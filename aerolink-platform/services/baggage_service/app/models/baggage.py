"""DynamoDB handler for Baggage."""

import uuid
from typing import Any
from datetime import datetime, timezone

import aioboto3
from pydantic import BaseModel, ConfigDict
import structlog

from app.core.config import settings
from shared.middleware.error_handler import AppError, NotFoundError

logger = structlog.get_logger()


class BaggageEvent(BaseModel):
    timestamp: str
    location: str
    status: str

class BaggageItem(BaseModel):
    baggage_id: str
    passenger_id: str
    flight_id: str
    weight_kg: float
    current_status: str
    history: list[BaggageEvent] = []

    model_config = ConfigDict(extra="ignore")


class DynamoDBHandler:
    """Async wrapper for DynamoDB baggage storage."""

    def __init__(self):
        self.session = aioboto3.Session()

    async def _get_resource(self):
        return self.session.resource(
            "dynamodb",
            endpoint_url=settings.DYNAMODB_ENDPOINT_URL,
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        )

    async def setup_table(self):
        """Create the DynamoDB table if it doesn't exist (for local dev)."""
        async with await self._get_resource() as dynamodb:
            try:
                table = await dynamodb.create_table(
                    TableName=settings.BAGGAGE_TABLE_NAME,
                    KeySchema=[
                        {"AttributeName": "baggage_id", "KeyType": "HASH"}
                    ],
                    AttributeDefinitions=[
                        {"AttributeName": "baggage_id", "AttributeType": "S"}
                    ],
                    BillingMode="PAY_PER_REQUEST"
                )
                await table.wait_until_exists()
                logger.info("DynamoDB Table created", table_name=settings.BAGGAGE_TABLE_NAME)
            except Exception as e:
                if "ResourceInUseException" in str(e):
                    logger.info("DynamoDB Table already exists", table_name=settings.BAGGAGE_TABLE_NAME)
                else:
                    logger.error("Error creating DynamoDB table", error=str(e))

    async def get_baggage(self, baggage_id: str) -> BaggageItem:
        async with await self._get_resource() as dynamodb:
            table = await dynamodb.Table(settings.BAGGAGE_TABLE_NAME)
            response = await table.get_item(Key={"baggage_id": baggage_id})
            
            item = response.get("Item")
            if not item:
                raise NotFoundError("Baggage", baggage_id)
                
            return BaggageItem(**item)

    async def create_baggage(self, data: dict) -> BaggageItem:
        async with await self._get_resource() as dynamodb:
            table = await dynamodb.Table(settings.BAGGAGE_TABLE_NAME)
            
            baggage_id = str(uuid.uuid4())
            item = {
                "baggage_id": baggage_id,
                "passenger_id": data["passenger_id"],
                "flight_id": data["flight_id"],
                "weight_kg": str(data["weight_kg"]), # DynamoDB uses strings or Decimals for floats
                "current_status": "CHECKED_IN",
                "history": [{
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "location": "CHECK-IN DESK",
                    "status": "CHECKED_IN"
                }]
            }
            
            await table.put_item(Item=item)
            # Reconstruct to the float model
            item["weight_kg"] = data["weight_kg"]
            return BaggageItem(**item)

    async def update_status(self, baggage_id: str, status: str, location: str) -> BaggageItem:
        async with await self._get_resource() as dynamodb:
            table = await dynamodb.Table(settings.BAGGAGE_TABLE_NAME)
            
            event = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "location": location,
                "status": status
            }
            
            try:
                # Append to the history list and update current_status
                response = await table.update_item(
                    Key={"baggage_id": baggage_id},
                    UpdateExpression="SET current_status = :status, history = list_append(if_not_exists(history, :empty_list), :event)",
                    ExpressionAttributeValues={
                        ":status": status,
                        ":event": [event],
                        ":empty_list": []
                    },
                    ReturnValues="ALL_NEW"
                )
                
                item = response.get("Attributes")
                item["weight_kg"] = float(item["weight_kg"])
                return BaggageItem(**item)
            except Exception as e:
                logger.error("Failed to update baggage", baggage_id=baggage_id, error=str(e))
                raise AppError("UPDATE_FAILED", f"Failed to update baggage {baggage_id}", 500)
