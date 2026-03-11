from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from config.secondary_database import SecondaryAsyncSessionLocal, secondary_async_engine


async def get_secondary_db() -> AsyncGenerator[AsyncSession, None]:
    async with SecondaryAsyncSessionLocal() as current_db:
        yield current_db


async def close_secondary_async_engine() -> None:
    await secondary_async_engine.dispose()
