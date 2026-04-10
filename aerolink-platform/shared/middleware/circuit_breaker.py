"""Circuit Breaker middleware to prevent cascade failures.

Utilizes pybreaker.
"""

from typing import Any
import pybreaker
import structlog

logger = structlog.get_logger()


class CircuitBreakerMetricsListener(pybreaker.CircuitBreakerListener):
    """Listener to log circuit breaker state changes and accumulate metrics."""

    def state_change(self, cb: pybreaker.CircuitBreaker, old_state: pybreaker.CircuitBreakerState, new_state: pybreaker.CircuitBreakerState) -> None:
        if new_state.name == "open":
            logger.error("Circuit breaker TRIPPED OPEN", breaker_name=cb.name)
        elif new_state.name == "half-open":
            logger.warning("Circuit breaker HALF OPEN, testing recovery", breaker_name=cb.name)
        elif new_state.name == "closed":
            logger.info("Circuit breaker CLOSED, recovered", breaker_name=cb.name)

    def failure(self, cb: pybreaker.CircuitBreaker, exc: Exception) -> None:
        logger.warning("Circuit breaker recorded failure", breaker_name=cb.name, error=str(exc))


def create_circuit_breaker(name: str, fail_max: int = 5, reset_timeout: int = 30) -> pybreaker.CircuitBreaker:
    """Create a new circuit breaker.

    Args:
        name: The name of the remote dependency (e.g., "payment-api").
        fail_max: Consecutive failures before tripping open.
        reset_timeout: Seconds to wait before attempting recovery (half-open).

    Returns:
        A decorated pybreaker wrapper.
    """
    return pybreaker.CircuitBreaker(
        fail_max=fail_max,
        reset_timeout=reset_timeout,
        name=name,
        listeners=[CircuitBreakerMetricsListener()],
    )

# Common circuit breakers to be used across microservices
db_breaker = create_circuit_breaker(name="database", fail_max=5, reset_timeout=30)
kafka_breaker = create_circuit_breaker(name="kafka", fail_max=3, reset_timeout=30)
