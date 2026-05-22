"""API routes for Passengers including Auth and GDPR Endpoints."""

import uuid

from fastapi import APIRouter, Depends, status, Response
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, ConfigDict
import structlog

from app.models.passenger import Passenger
from shared.db.session import get_db
from shared.auth.password import get_password_hash, verify_password
from shared.auth.jwt_handler import create_access_token
from shared.utils.audit import audit_logger, AuditEvent
from shared.middleware.error_handler import UnauthorizedError, AppError
# We can mock this for now
from shared.constants.roles import Role

logger = structlog.get_logger()
router = APIRouter()

class UserRegister(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: str
    
    model_config = ConfigDict(extra="forbid")

class UserLogin(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class PassengerDataExport(BaseModel):
    id: uuid.UUID
    email: str
    first_name: str | None
    last_name: str | None
    passport_number: str | None
    phone_number: str | None
    is_anonymized: bool


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(data: UserRegister, db: AsyncSession = Depends(get_db)):
    """Register a new passenger."""
    # Check existing
    result = await db.execute(select(Passenger).where(Passenger.email == data.email))
    if result.scalar_one_or_none():
        raise AppError("EMAIL_EXISTS", "Email already registered", 409)
        
    hashed_pw = get_password_hash(data.password)
    user = Passenger(
        email=data.email,
        hashed_password=hashed_pw,
        first_name=data.first_name,
        last_name=data.last_name,
        role=Role.PASSENGER
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    token = create_access_token({"sub": str(user.id), "role": Role.PASSENGER}, secret_key="supersecretdevkey")
    return {"access_token": token}


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    """Login and get JWT."""
    result = await db.execute(select(Passenger).where(Passenger.email == data.email))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(data.password, user.hashed_password):
        raise UnauthorizedError("Incorrect email or password")
        
    if user.is_anonymized:
        raise UnauthorizedError("Account has been deleted/anonymized")
        
    token = create_access_token({"sub": str(user.id), "role": user.role}, secret_key="supersecretdevkey")
    return {"access_token": token}


@router.delete("/{user_id}", status_code=204)
async def delete_account(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """GDPR Right to Erasure — anonymise PII. ★ Enhancement"""
    user = await db.get(Passenger, user_id)
    if not user:
        raise AppError("NOT_FOUND", "User not found", 404)
        
    # Anonymise rather than hard delete to keep referential integrity for bookings/revenue
    hashed_anon = get_password_hash(str(uuid.uuid4()))
    
    user.email = f"anonymized_{user.id}@deleted.local"
    user.first_name = "REDACTED"
    user.last_name = "REDACTED"
    user.passport_number = "REDACTED"
    user.phone_number = "REDACTED"
    user.hashed_password = hashed_anon
    user.is_anonymized = True
    user.is_active = False
    
    await db.commit()
    
    # Create Audit Log (Enhancement #13)
    await audit_logger.log(AuditEvent(
        entity_type="PASSENGER",
        entity_id=str(user.id),
        action="GDPR_ERASURE",
        performed_by=str(user.id)
    ))
    return Response(status_code=204)


@router.get("/{user_id}/export", response_model=PassengerDataExport)
async def export_data(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """GDPR Data Portability — export all personal data. ★ Enhancement"""
    user = await db.get(Passenger, user_id)
    if not user:
        raise AppError("NOT_FOUND", "User not found", 404)
        
    data = PassengerDataExport(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        passport_number=user.passport_number,
        phone_number=user.phone_number,
        is_anonymized=user.is_anonymized
    )
    
    await audit_logger.log(AuditEvent(
        entity_type="PASSENGER",
        entity_id=str(user.id),
        action="GDPR_DATA_EXPORT",
        performed_by=str(user.id)
    ))
    
    # Return as downloadable JSON file
    return JSONResponse(
        content=jsonable_encoder(data),
        headers={"Content-Disposition": f"attachment; filename=passenger_data_{user_id}.json"}
    )
