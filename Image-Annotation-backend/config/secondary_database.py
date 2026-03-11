from urllib.parse import quote_plus

from sqlalchemy import Engine, create_engine
from sqlalchemy.ext.asyncio import AsyncEngine, async_sessionmaker, create_async_engine
from sqlalchemy.orm import sessionmaker

from config.env import SecondaryDataBaseConfig


def build_secondary_async_sqlalchemy_database_url() -> str:
    if SecondaryDataBaseConfig.secondary_db_type == 'postgresql':
        return (
            f'postgresql+asyncpg://{SecondaryDataBaseConfig.secondary_db_username}:'
            f'{quote_plus(SecondaryDataBaseConfig.secondary_db_password)}@'
            f'{SecondaryDataBaseConfig.secondary_db_host}:{SecondaryDataBaseConfig.secondary_db_port}/'
            f'{SecondaryDataBaseConfig.secondary_db_database}'
        )
    return (
        f'mysql+asyncmy://{SecondaryDataBaseConfig.secondary_db_username}:'
        f'{quote_plus(SecondaryDataBaseConfig.secondary_db_password)}@'
        f'{SecondaryDataBaseConfig.secondary_db_host}:{SecondaryDataBaseConfig.secondary_db_port}/'
        f'{SecondaryDataBaseConfig.secondary_db_database}'
    )


SECONDARY_ASYNC_SQLALCHEMY_DATABASE_URL = build_secondary_async_sqlalchemy_database_url()


def build_secondary_sync_sqlalchemy_database_url() -> str:
    if SecondaryDataBaseConfig.secondary_db_type == 'postgresql':
        return (
            f'postgresql+psycopg2://{SecondaryDataBaseConfig.secondary_db_username}:'
            f'{quote_plus(SecondaryDataBaseConfig.secondary_db_password)}@'
            f'{SecondaryDataBaseConfig.secondary_db_host}:{SecondaryDataBaseConfig.secondary_db_port}/'
            f'{SecondaryDataBaseConfig.secondary_db_database}'
        )
    return (
        f'mysql+pymysql://{SecondaryDataBaseConfig.secondary_db_username}:'
        f'{quote_plus(SecondaryDataBaseConfig.secondary_db_password)}@'
        f'{SecondaryDataBaseConfig.secondary_db_host}:{SecondaryDataBaseConfig.secondary_db_port}/'
        f'{SecondaryDataBaseConfig.secondary_db_database}'
    )


SECONDARY_SYNC_SQLALCHEMY_DATABASE_URL = build_secondary_sync_sqlalchemy_database_url()


def create_secondary_async_db_engine(echo: bool | None = None) -> AsyncEngine:
    return create_async_engine(
        SECONDARY_ASYNC_SQLALCHEMY_DATABASE_URL,
        echo=SecondaryDataBaseConfig.secondary_db_echo if echo is None else echo,
        max_overflow=SecondaryDataBaseConfig.secondary_db_max_overflow,
        pool_size=SecondaryDataBaseConfig.secondary_db_pool_size,
        pool_recycle=SecondaryDataBaseConfig.secondary_db_pool_recycle,
        pool_timeout=SecondaryDataBaseConfig.secondary_db_pool_timeout,
    )


def create_secondary_sync_db_engine(echo: bool | None = None) -> Engine:
    return create_engine(
        SECONDARY_SYNC_SQLALCHEMY_DATABASE_URL,
        echo=SecondaryDataBaseConfig.secondary_db_echo if echo is None else echo,
        max_overflow=SecondaryDataBaseConfig.secondary_db_max_overflow,
        pool_size=SecondaryDataBaseConfig.secondary_db_pool_size,
        pool_recycle=SecondaryDataBaseConfig.secondary_db_pool_recycle,
        pool_timeout=SecondaryDataBaseConfig.secondary_db_pool_timeout,
    )


def create_secondary_async_session_local(engine: AsyncEngine) -> async_sessionmaker:
    return async_sessionmaker(autocommit=False, autoflush=False, bind=engine)


def create_secondary_sync_session_local(engine: Engine) -> sessionmaker:
    return sessionmaker(autocommit=False, autoflush=False, bind=engine)


secondary_async_engine = create_secondary_async_db_engine()
SecondaryAsyncSessionLocal = create_secondary_async_session_local(secondary_async_engine)
