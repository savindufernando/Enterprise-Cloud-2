"""Structured JSON logging using structlog with correlation ID support."""

import logging
import sys
from typing import Any

import structlog


def setup_logging(service_name: str, log_level: str = "INFO") -> None:
    """Configure structlog for structured JSON logging across all microservices.

    Args:
        service_name: Name of the microservice (e.g., 'flight-service').
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL).
    """
    # Import locally to avoid circular dependency in some setups
    from shared.utils.pii_masker import mask_pii

    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.StackInfoRenderer(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.dict_tracebacks,
            _add_service_name(service_name),
            mask_pii,
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(
            getattr(logging, log_level.upper(), logging.INFO)
        ),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(file=sys.stdout),
        cache_logger_on_first_use=True,
    )


def _add_service_name(service_name: str):
    """Processor that injects the service name into every log entry."""

    def processor(_: Any, __: str, event_dict: dict[str, Any]) -> dict[str, Any]:
        event_dict["service"] = service_name
        return event_dict

    return processor


def get_logger(**kwargs: Any) -> structlog.stdlib.BoundLogger:
    """Get a structured logger instance with optional initial context.

    Usage:
        logger = get_logger(request_id="abc-123")
        logger.info("Processing request", endpoint="/api/v1/flights")

    Output:
        {"timestamp": "2026-...", "level": "info", "service": "flight-service",
         "request_id": "abc-123", "event": "Processing request", "endpoint": "/api/v1/flights"}
    """
    return structlog.get_logger(**kwargs)
