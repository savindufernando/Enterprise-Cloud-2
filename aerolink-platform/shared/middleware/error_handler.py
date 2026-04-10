"""Consistent error handling middleware and custom exceptions. ★ Enhancement #14"""

from datetime import datetime, timezone
from typing import Any

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel


class ErrorResponse(BaseModel):
    """Standard error response returned by all AeroLink microservices."""

    code: str
    message: str
    status: int
    timestamp: str
    path: str
    correlation_id: str | None = None


class AppError(Exception):
    """Base application error — raise this in service/business logic.

    Usage:
        raise AppError("FLIGHT_NOT_FOUND", "No flight found with ID FL-999", 404)
        raise AppError("SEAT_UNAVAILABLE", "Seat 12A is already booked", 409)
        raise AppError("PAYMENT_FAILED", "Payment gateway returned error", 502)
    """

    def __init__(self, code: str, message: str, status: int = 400, details: dict[str, Any] | None = None):
        self.code = code
        self.message = message
        self.status = status
        self.details = details or {}
        super().__init__(self.message)


class ValidationError(AppError):
    """Raised when request validation fails beyond Pydantic's auto-validation."""

    def __init__(self, message: str, details: dict[str, Any] | None = None):
        super().__init__("VALIDATION_ERROR", message, 422, details)


class NotFoundError(AppError):
    """Raised when a requested resource does not exist."""

    def __init__(self, resource: str, identifier: str):
        super().__init__(
            f"{resource.upper()}_NOT_FOUND",
            f"{resource} with identifier '{identifier}' not found",
            404,
        )


class ConflictError(AppError):
    """Raised when an operation conflicts with current state (e.g., double booking)."""

    def __init__(self, message: str):
        super().__init__("CONFLICT", message, 409)


class UnauthorizedError(AppError):
    """Raised when authentication fails."""

    def __init__(self, message: str = "Authentication required"):
        super().__init__("UNAUTHORIZED", message, 401)


class ForbiddenError(AppError):
    """Raised when the user lacks permission for the requested action."""

    def __init__(self, message: str = "Insufficient permissions"):
        super().__init__("FORBIDDEN", message, 403)


async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    """Global exception handler for AppError — produces consistent error shape."""
    return JSONResponse(
        status_code=exc.status,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "status": exc.status,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "path": str(request.url.path),
                "correlationId": getattr(request.state, "correlation_id", None),
                **({"details": exc.details} if exc.details else {}),
            }
        },
    )


async def unhandled_error_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all handler for unexpected exceptions — never expose stack traces."""
    import structlog

    logger = structlog.get_logger()
    logger.error(
        "Unhandled exception",
        error=str(exc),
        error_type=type(exc).__name__,
        path=str(request.url.path),
    )

    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred. Please try again later.",
                "status": 500,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "path": str(request.url.path),
                "correlationId": getattr(request.state, "correlation_id", None),
            }
        },
    )


def register_error_handlers(app: FastAPI) -> None:
    """Register all error handlers on a FastAPI application.

    Usage in main.py:
        from shared.middleware.error_handler import register_error_handlers
        register_error_handlers(app)
    """
    app.add_exception_handler(AppError, app_error_handler)
    app.add_exception_handler(Exception, unhandled_error_handler)
