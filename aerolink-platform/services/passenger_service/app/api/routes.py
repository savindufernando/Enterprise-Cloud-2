"""API routes for Passengers including Auth, GDPR, and AES-256 Encryption. ★ Enhancement #17"""

import uuid

from fastapi import APIRouter, Depends, status, Response, Header
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, ConfigDict
import structlog

from app.models.passenger import Passenger
from shared.db.session import get_db
from shared.auth.password import get_password_hash, verify_password
from shared.auth.jwt_handler import create_access_token, verify_token
from shared.utils.audit import audit_logger, AuditEvent
from shared.middleware.error_handler import UnauthorizedError, AppError
from shared.utils.encryption import encrypt_field, decrypt_field
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


class PassengerUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    passport_number: str | None = None
    phone_number: str | None = None
    
    model_config = ConfigDict(extra="forbid")


async def get_current_user_id(authorization: str = Header(..., description="Bearer JWT token")) -> uuid.UUID:
    """FastAPI dependency to extract and validate active user_id from token claims."""
    if not authorization.startswith("Bearer "):
        raise AppError("UNAUTHORIZED", "Invalid authorization header scheme", 401)
    token = authorization.split(" ")[1]
    payload = verify_token(token, secret_key="supersecretdevkey")
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise AppError("UNAUTHORIZED", "Subject claim missing from JWT token", 401)
    try:
        return uuid.UUID(user_id_str)
    except ValueError:
        raise AppError("UNAUTHORIZED", "Subject claim does not conform to UUID structure", 401)


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


@router.put("/me", response_model=PassengerDataExport)
async def update_my_profile(
    data: PassengerUpdate,
    db: AsyncSession = Depends(get_db),
    current_user_id: uuid.UUID = Depends(get_current_user_id)
):
    """Update active logged-in passenger profile (includes field encryption)."""
    return await update_profile(user_id=current_user_id, data=data, db=db)


@router.put("/{user_id}", response_model=PassengerDataExport)
async def update_profile(user_id: uuid.UUID, data: PassengerUpdate, db: AsyncSession = Depends(get_db)):
    """Update passenger profile details (including AES-256 field encryption prior to storage)."""
    user = await db.get(Passenger, user_id)
    if not user:
        raise AppError("NOT_FOUND", "User not found", 404)
        
    if data.first_name is not None:
        user.first_name = data.first_name
    if data.last_name is not None:
        user.last_name = data.last_name
    if data.phone_number is not None:
        user.phone_number = data.phone_number
    if data.passport_number is not None:
        # App-level envelope field encryption prior to database commit
        user.passport_number = encrypt_field(data.passport_number)
        
    await db.commit()
    await db.refresh(user)
    
    # Decrypt upon returning data to the client
    decrypted_passport = decrypt_field(user.passport_number)
    return PassengerDataExport(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        passport_number=decrypted_passport,
        phone_number=user.phone_number,
        is_anonymized=user.is_anonymized
    )


@router.delete("/me", status_code=204)
async def delete_my_account(
    db: AsyncSession = Depends(get_db),
    current_user_id: uuid.UUID = Depends(get_current_user_id)
):
    """GDPR Right to Erasure for authenticated users."""
    return await delete_account(user_id=current_user_id, db=db)


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


@router.get("/me/export", response_model=PassengerDataExport)
async def export_my_data(
    db: AsyncSession = Depends(get_db),
    current_user_id: uuid.UUID = Depends(get_current_user_id)
):
    """GDPR Data Portability for authenticated users."""
    return await export_data(user_id=current_user_id, db=db)


@router.get("/{user_id}/export", response_model=PassengerDataExport)
async def export_data(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """GDPR Data Portability — export all personal data. ★ Enhancement"""
    user = await db.get(Passenger, user_id)
    if not user:
        raise AppError("NOT_FOUND", "User not found", 404)
        
    decrypted_passport = decrypt_field(user.passport_number)
    data = PassengerDataExport(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        passport_number=decrypted_passport,
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

