"""Retry utility with exponential backoff and jitter."""

import asyncio
import random
from collections.abc import Callable, Coroutine
from typing import TypeVar

import structlog

logger = structlog.get_logger()

T = TypeVar("T")


async def retry_with_backoff(
    func: Callable[[], Coroutine[Any, Any, T]],
    max_retries: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 10.0,
    exceptions: tuple[type[Exception], ...] = (Exception,)
) -> T:
    """Execute an async function with exponential backoff and jitter on failure.

    Args:
        func: The async function to execute.
        max_retries: Maximum number of attempts.
        base_delay: Initial delay in seconds.
        max_delay: Cap on the maximum delay between retries.
        exceptions: Tuple of exceptions to catch and retry on.

    Returns:
        The result of the function if successful.

    Raises:
        The last exception encountered if max_retries is exhausted.
    """
    attempt = 0
    while True:
        try:
            return await func()
        except exceptions as e:
            attempt += 1
            if attempt >= max_retries:
                logger.error("Max retries exhausted", func_name=func.__name__, error=str(e))
                raise

            # Exponential backoff: base_delay * 2^(attempt-1)
            delay = min(base_delay * (2 ** (attempt - 1)), max_delay)
            
            # Jitter: Add a random fraction to prevent thundering herd problem
            jitter = random.uniform(0, 0.5 * delay)
            sleep_time = delay + jitter

            logger.warning(
                "Operation failed, retrying...",
                func_name=func.__name__,
                attempt=attempt,
                sleep_time=round(sleep_time, 2),
                error=str(e)
            )
            
            await asyncio.sleep(sleep_time)
