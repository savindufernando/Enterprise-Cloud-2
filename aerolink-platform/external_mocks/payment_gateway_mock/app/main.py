"""Mock External Payment Gateway.
Simulates a 3rd party API (e.g. Stripe/PayPal) for processing payments.
"""

import uuid
import random
import asyncio
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import structlog

logger = structlog.get_logger()
app = FastAPI(title="Mock Payment Gateway")

class ChargeRequest(BaseModel):
    amount: float
    token: str

class ChargeResponse(BaseModel):
    status: str
    transaction_id: str


@app.post("/api/charge", response_model=ChargeResponse)
async def process_charge(req: ChargeRequest):
    """Simulate a credit card charge."""
    logger.info("Received charge request", amount=req.amount, token=req.token)
    
    # Simulate network latency
    await asyncio.sleep(random.uniform(0.5, 2.0))
    
    # Simulate card decline
    if req.token == "tok_fail":
        logger.warning("Charge declined")
        raise HTTPException(status_code=402, detail="Card declined")
        
    # Simulate random 5% generic failure
    if random.random() < 0.05:
        logger.error("Gateway error")
        raise HTTPException(status_code=500, detail="Internal gateway error")
        
    logger.info("Charge successful")
    return ChargeResponse(status="success", transaction_id=f"tx_{uuid.uuid4().hex[:12]}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8093)
