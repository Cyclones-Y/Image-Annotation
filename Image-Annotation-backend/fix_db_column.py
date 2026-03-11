import asyncio
from sqlalchemy import text
from config.database import async_engine

async def main():
    try:
        async with async_engine.begin() as conn:
            await conn.execute(text("ALTER TABLE sys_logininfor ALTER COLUMN msg TYPE VARCHAR(2000)"))
        print("Done")
    finally:
        await async_engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
