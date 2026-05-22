"""API routes for Payment Processing."""

import uuid

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, ConfigDict, Field
import structlog
import httpx

from app.models.payment import Payment
from app.core.config import settings
from shared.db.session import get_db
from shared.utils.audit import audit_logger, AuditEvent
from shared.middleware.error_handler import AppError
from shared.constants.events import PAYMENT_PROCESSED

# Global Kafka dependency placeholder
import app.main

logger = structlog.get_logger()
router = APIRouter()


class PaymentRequest(BaseModel):
    booking_id: uuid.UUID
    amount: float = Field(..., gt=0)
    payment_method_token: str
    
    model_config = ConfigDict(extra="forbid")

class PaymentResponse(BaseModel):
    id: uuid.UUID
    booking_id: uuid.UUID
    status: str
    gateway_transaction_id: str | None


@router.post("/process", response_model=PaymentResponse)
async def process_payment(
    data: PaymentRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Process a payment.
    
    This endpoint is idempotent via the API Gateway/Middleware.
    It integrates with the external payment mock.
    """
    correlation_id = getattr(request.state, "correlation_id", None)
    
    # 1. Create PENDING record
    payment = Payment(
        booking_id=data.booking_id,
        amount=data.amount,
        payment_method_token=data.payment_method_token,
        status="PENDING"
    )
    db.add(payment)
    await db.commit()
    await db.refresh(payment)
    
    try:
        # 2. Call external gateway
        # Note: In reality, we'd use the circuit breaker here.
        async with httpx.AsyncClient() as client:
            res = await client.post(
                settings.PAYMENT_GATEWAY_URL, 
                json={"amount": data.amount, "token": data.payment_method_token},
                headers={"X-Correlation-ID": correlation_id} if correlation_id else {}
            )
            
            if res.status_code == 200:
                gateway_data = res.json()
                payment.status = "SUCCESS"
                payment.gateway_transaction_id = gateway_data.get("transaction_id")
            else:
                payment.status = "FAILED"
                
    except Exception as e:
        logger.error("Payment gateway unreachable", error=str(e))
        payment.status = "FAILED"
        
    await db.commit()
    
    # 3. PCI-DSS Audit Log (Enhancement #13)
    await audit_logger.log(AuditEvent(
        entity_type="PAYMENT",
        entity_id=str(payment.id),
        action="PROCESS_CHARGE",
        new_value={"status": payment.status, "amount": str(payment.amount)},
        performed_by="SYSTEM",
        correlation_id=correlation_id
    ))
    
    if payment.status == "FAILED":
        raise AppError("PAYMENT_FAILED", "Failed to charge payment method", 502)
        
    # 4. Emit Event
    await app.main.kafka_producer.publish(
        topic=PAYMENT_PROCESSED,
        event={"payment_id": str(payment.id), "booking_id": str(payment.booking_id)},
        correlation_id=correlation_id,
        key=str(payment.booking_id)
    )

    return PaymentResponse(
        id=payment.id,
        booking_id=payment.booking_id,
        status=payment.status,
        gateway_transaction_id=payment.gateway_transaction_id
    )
