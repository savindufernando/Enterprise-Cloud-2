"""Async SQLAlchemy database session management with connection pooling. ★ Enhancement #7"""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine

# Global variables to hold the engine and sessionmaker
engine: AsyncEngine | None = None
async_session_maker: async_sessionmaker[AsyncSession] | None = None


def init_db(database_url: str, pool_size: int = 20, max_overflow: int = 10) -> None:
    """Initialize the database engine and session factory.

    Call this during application startup.
    Uses connection pooling to prevent connection exhaustion under load.

    Args:
        database_url: Async PostgreSQL connection string (postgresql+asyncpg://...)
        pool_size: Number of connections to keep open in the pool.
        max_overflow: Number of temporary connections to allow beyond pool_size.
    """
    global engine, async_session_maker

    engine = create_async_engine(
        database_url,
        pool_size=pool_size,
        max_overflow=max_overflow,
        pool_pre_ping=True,  # Test connections before using them
        pool_recycle=3600,   # Recycle connections after 1 hour
    )

    async_session_maker = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False, autoflush=False
    )


async def close_db() -> None:
    """Close the database engine. Call during application shutdown."""
    global engine
    if engine is not None:
        await engine.dispose()
        engine = None


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency injection function for FastAPI routes.

    Yields a database session that is automatically committed on success or
    rolled back on exception, preventing connection leaks.
    """
    if async_session_maker is None:
        raise RuntimeError("Database not initialized. Call init_db() first.")

    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
