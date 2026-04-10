"""Pydantic schemas for health checks."""

from pydantic import BaseModel, Field


class ServiceHealth(BaseModel):
    status: str = Field(..., description="ok or error")
    message: str | None = None


class ReadinessResponse(BaseModel):
    status: str = Field(..., description="ready or not_ready")
    timestamp: str
    checks: dict[str, ServiceHealth]


class LivenessResponse(BaseModel):
    status: str = Field(..., description="alive")
    timestamp: str
