"""Execute endpoint (stub for Milestone 2)"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import logging
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db, AsyncSessionLocal
from app.services.sql_executor import ReadOnlyExecutor
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()


class ExecuteRequest(BaseModel):
    sql: str
    database: str = "students_db"


@router.post("/")
async def execute(request: ExecuteRequest):
    """Execute SQL query in read-only sandbox"""
    
    try:
        # Route to correct database
        db_urls = {
            "students_db": "postgresql+asyncpg://postgres:password@postgres:5432/students_db",
            "retail_db": "postgresql+asyncpg://postgres:password@postgres:5432/retail_db",
            "appdb": settings.database_url.replace("postgresql://", "postgresql+asyncpg://"),
        }
        
        if request.database not in db_urls:
            raise HTTPException(status_code=400, detail="Invalid database")
        
        # Get session for target database
        from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession as AsyncSessionType, async_sessionmaker
        
        engine = create_async_engine(db_urls[request.database], echo=False, future=True)
        SessionLocal = async_sessionmaker(engine, class_=AsyncSessionType, expire_on_commit=False)
        
        async with SessionLocal() as session:
            result = await ReadOnlyExecutor.execute_read_only(
                request.sql,
                session,
                timeout_ms=settings.max_execution_ms,
            )
            
            return result.to_dict()
    
    except TimeoutError as e:
        logger.warning(f"Execution timeout: {e}")
        raise HTTPException(status_code=408, detail=str(e))
    except ValueError as e:
        logger.warning(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Execution error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
