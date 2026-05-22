"""SQLAlchemy database models for Passengers."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class Passenger(Base):
    """Database model for Passengers."""
    __tablename__ = "passengers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    
    first_name = Column(String, nullable=True) # Could be anonymized
    last_name = Column(String, nullable=True)
    passport_number = Column(String, nullable=True) # Encrypted at rest eventually
    phone_number = Column(String, nullable=True)
    
    is_active = Column(Boolean, default=True)
    # GDPR Right to Erasure
    is_anonymized = Column(Boolean, default=False)
    
    role = Column(String, default="passenger", nullable=False)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), 
        default=lambda: datetime.now(timezone.utc), 
        onupdate=lambda: datetime.now(timezone.utc), 
        nullable=False
    )
