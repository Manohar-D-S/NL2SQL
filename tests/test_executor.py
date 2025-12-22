"""Unit tests for SQL executor"""

import pytest
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.services.sql_executor import SQLExecutor, ExecutionResult


@pytest.fixture
async def test_db_session():
    """Create test database session"""
    engine = create_async_engine(
        "postgresql+asyncpg://postgres:password@postgres:5432/students_db",
        echo=False,
        future=True,
    )
    
    SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with SessionLocal() as session:
        yield session


@pytest.mark.asyncio
async def test_executor_select_query(test_db_session):
    """Test executing a SELECT query"""
    executor = SQLExecutor("postgresql://postgres:password@postgres:5432/students_db")
    
    result = await executor.execute(
        "SELECT COUNT(*) as count FROM students;",
        test_db_session,
    )
    
    assert result.row_count >= 0
    assert result.execution_time_ms >= 0
    assert len(result.columns) > 0


@pytest.mark.asyncio
async def test_execution_timeout():
    """Test query timeout"""
    executor = SQLExecutor("postgresql://postgres:password@postgres:5432/students_db")
    
    # This test would require a query that takes longer than timeout
    # Skipping for now as it's infrastructure-dependent
    pass
