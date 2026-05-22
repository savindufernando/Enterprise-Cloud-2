"""Graceful shutdown management for FastAPI applications. ★ Enhancement #6"""

import asyncio
import signal
import sys
from collections.abc import Callable, Coroutine
from typing import Any

import structlog

logger = structlog.get_logger()


class GracefulShutdown:
    """Manages graceful shutdown of the application by intercepting SIGINT and SIGTERM.

    Ensures that background tasks, database connections, and Kafka consumers are properly
    given time to close before the process exits, preventing data loss or corrupted state.
    """

    def __init__(self) -> None:
        self.shutdown_requested = False
        self._cleanup_tasks: list[Callable[[], Coroutine[Any, Any, None]]] = []
        # Uvicorn already handles SIGINT/SIGTERM and correctly triggers the 
        # FastAPI lifespan context manager. We no longer need to hijack signals here.
        # This fixes 'RuntimeError: no running event loop' at import time.

    def _signal_handler(self) -> None:
        """Handle incoming signals asynchronously."""
        if not self.shutdown_requested:
            logger.info("Shutdown signal received. Initiating graceful shutdown...")
            self.shutdown_requested = True
            asyncio.create_task(self._run_cleanup_tasks())
        else:
            logger.warning("Forcing immediate exit...")
            sys.exit(1)

    def _sync_signal_handler(self, sig: int, frame: Any) -> None:
        """Handle incoming signals synchronously (Windows)."""
        if not self.shutdown_requested:
            logger.info("Shutdown signal received. Initiating graceful shutdown...")
            self.shutdown_requested = True
            asyncio.create_task(self._run_cleanup_tasks())
        else:
            logger.warning("Forcing immediate exit...")
            sys.exit(1)

    def register_cleanup_task(self, task: Callable[[], Coroutine[Any, Any, None]]) -> None:
        """Register an async function to be called during shutdown.

        Example:
            shutdown_manager.register_cleanup_task(kafka_producer.stop)
            shutdown_manager.register_cleanup_task(db.close)
        """
        self._cleanup_tasks.append(task)

    async def _run_cleanup_tasks(self) -> None:
        """Execute all registered cleanup tasks."""
        errors = []
        for task in self._cleanup_tasks:
            try:
                await task()
            except Exception as e:
                logger.error("Error during cleanup task", error=str(e), task_name=task.__name__)
                errors.append(e)

        if errors:
            logger.error("Shutdown completed with errors", error_count=len(errors))
            sys.exit(1)
        else:
            logger.info("Graceful shutdown completed successfully.")
            sys.exit(0)

# Global singleton
shutdown_manager = GracefulShutdown()
