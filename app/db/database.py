"""Database connection and initialization"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

Base = declarative_base()

# Convert postgresql:// to postgresql+asyncpg://
async_database_url = settings.database_url.replace("postgresql://", "postgresql+asyncpg://")

engine = create_async_engine(
    async_database_url,
    echo=False,
    future=True,
)

AsyncSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


async def init_db():
    """Initialize database (run migrations, create tables if needed)"""
    logger.info("Initializing database...")
    try:
        async with engine.begin() as conn:
            # Tables are created via Alembic migrations in production
            # For now, we'll rely on seed scripts
            logger.info("Database connection verified")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise


async def get_db() -> AsyncSession:
    """Get database session"""
    async with AsyncSessionLocal() as session:
        yield session
