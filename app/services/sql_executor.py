"""SQL execution engine with read-only sandbox"""

import logging
import asyncio
from typing import Optional, List, Dict, Any
from datetime import datetime
import time

from sqlalchemy import text, inspect
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.config import settings
from app.services.validator import SQLValidator

logger = logging.getLogger(__name__)


class ExecutionResult:
    """Result of SQL execution"""
    
    def __init__(
        self,
        rows: List[Dict[str, Any]],
        columns: List[str],
        row_count: int,
        execution_time_ms: float,
        query_plan: Optional[str] = None,
    ):
        self.rows = rows
        self.columns = columns
        self.row_count = row_count
        self.execution_time_ms = execution_time_ms
        self.query_plan = query_plan
    
    def to_dict(self):
        return {
            "rows": self.rows,
            "columns": self.columns,
            "row_count": self.row_count,
            "execution_time_ms": self.execution_time_ms,
            "query_plan": self.query_plan,
        }


class SQLExecutor:
    """Executes SQL in read-only sandbox"""
    
    def __init__(self, database_url: str):
        # Use NullPool to avoid connection pooling issues
        self.engine = create_async_engine(
            database_url.replace("postgresql://", "postgresql+asyncpg://"),
            echo=False,
            future=True,
            poolclass=NullPool,
        )
    
    async def execute(
        self,
        sql: str,
        session: AsyncSession,
        timeout_ms: Optional[int] = None,
    ) -> ExecutionResult:
        """Execute SQL query with timeout and safety checks"""
        
        timeout = timeout_ms or settings.max_execution_ms
        
        try:
            start_time = time.time()
            
            # Wrap execution in timeout
            async def _execute():
                result = await session.execute(text(sql))
                rows = result.fetchall()
                columns = result.keys()
                return rows, list(columns)
            
            # Execute with timeout
            try:
                rows, columns = await asyncio.wait_for(
                    _execute(),
                    timeout=timeout / 1000,
                )
            except asyncio.TimeoutError:
                execution_time = (time.time() - start_time) * 1000
                logger.warning(f"Query timeout after {execution_time}ms")
                raise TimeoutError(f"Query execution exceeded {timeout}ms timeout")
            
            execution_time_ms = (time.time() - start_time) * 1000
            
            # Convert rows to dictionaries
            row_dicts = [dict(zip(columns, row)) for row in rows]
            
            # Try to get query plan (EXPLAIN ANALYZE)
            query_plan = await self._get_query_plan(session, sql)
            
            return ExecutionResult(
                rows=row_dicts,
                columns=columns,
                row_count=len(row_dicts),
                execution_time_ms=execution_time_ms,
                query_plan=query_plan,
            )
        
        except Exception as e:
            logger.error(f"Execution error: {e}")
            raise
    
    async def _get_query_plan(self, session: AsyncSession, sql: str) -> Optional[str]:
        """Get EXPLAIN plan for query"""
        try:
            # Remove trailing semicolon
            sql_clean = sql.rstrip(";")
            explain_sql = f"EXPLAIN (FORMAT JSON) {sql_clean}"
            result = await session.execute(text(explain_sql))
            plan_json = result.fetchone()
            return str(plan_json[0]) if plan_json else None
        except Exception as e:
            logger.debug(f"Could not get query plan: {e}")
            return None
    
    async def close(self):
        """Close database connection"""
        await self.engine.dispose()


class ReadOnlyExecutor:
    """Enforces read-only execution"""
    
    @staticmethod
    async def execute_read_only(
        sql: str,
        session: AsyncSession,
        timeout_ms: int = 10000,
    ) -> ExecutionResult:
        """Execute query in read-only transaction"""
        
        # Validate query is safe (read-only)
        is_safe, warnings = SQLValidator.is_safe(sql)
        if not is_safe:
            raise ValueError(f"Query not safe: {'; '.join(warnings)}")
        
        # Create read-only transaction
        try:
            async with session.begin():
                # Set transaction to read-only
                await session.execute(text("SET TRANSACTION READ ONLY"))
                
                # Execute query
                executor = SQLExecutor(settings.database_url)
                result = await executor.execute(sql, session, timeout_ms)
                
                # Rollback ensures read-only (no side effects)
            
            return result
        
        except Exception as e:
            logger.error(f"Read-only execution error: {e}")
            raise
