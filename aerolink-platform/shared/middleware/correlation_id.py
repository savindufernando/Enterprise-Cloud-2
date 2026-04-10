"""Correlation ID middleware for distributed request tracing. ★ Enhancement #2"""

import uuid
from typing import Any

import structlog
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

CORRELATION_ID_HEADER = "X-Correlation-ID"


class CorrelationIdMiddleware(BaseHTTPMiddleware):
    """Generates or propagates a correlation ID across all service calls.

    - If the incoming request has an X-Correlation-ID header, it's reused.
    - If not, a new UUID is generated.
    - The correlation ID is:
      1. Bound to structlog's context vars (appears in all logs automatically).
      2. Attached to request.state for downstream access.
      3. Echoed back in the response header.

    This enables tracing a single user request across multiple microservices
    through logs, Kafka messages, and HTTP calls.
    """

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        # Extract or generate correlation ID
        correlation_id = request.headers.get(CORRELATION_ID_HEADER, str(uuid.uuid4()))

        # Bind to structlog context — all subsequent log calls include this
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(correlation_id=correlation_id)

        # Attach to request state for access in route handlers
        request.state.correlation_id = correlation_id

        # Process request
        response = await call_next(request)

        # Echo in response header
        response.headers[CORRELATION_ID_HEADER] = correlation_id

        return response


def get_correlation_id(request: Request) -> str:
    """Extract correlation ID from request state. Use as a FastAPI dependency.

    Usage:
        @router.get("/flights")
        async def get_flights(correlation_id: str = Depends(get_correlation_id)):
            logger.info("Fetching flights", correlation_id=correlation_id)
    """
    return getattr(request.state, "correlation_id", str(uuid.uuid4()))
