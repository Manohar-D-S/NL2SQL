"""Explain endpoint (Milestone 3)"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import logging
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.services.query_explainer import QueryExplainer, QueryAnalyzer
from app.services.sql_executor import SQLExecutor
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()


class ExplainRequest(BaseModel):
    sql: str
    database: str = "students_db"


@router.post("/")
async def explain(request: ExplainRequest):
    """Explain SQL query with execution plan and analysis"""
    
    try:
        # Get execution plan
        db_urls = {
            "students_db": "postgresql+asyncpg://postgres:password@postgres:5432/students_db",
            "retail_db": "postgresql+asyncpg://postgres:password@postgres:5432/retail_db",
        }
        
        if request.database not in db_urls:
            raise HTTPException(status_code=400, detail="Invalid database")
        
        from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession as AsyncSessionType, async_sessionmaker
        
        engine = create_async_engine(db_urls[request.database], echo=False, future=True)
        SessionLocal = async_sessionmaker(engine, class_=AsyncSessionType, expire_on_commit=False)
        
        async with SessionLocal() as session:
            executor = SQLExecutor(db_urls[request.database])
            result = await executor.execute(request.sql, session)
            
            # Parse and analyze plan
            plan = QueryExplainer.parse_explain_plan(result.query_plan or "{}")
            metrics = QueryExplainer.extract_plan_metrics(plan)
            complexity = QueryExplainer.get_complexity_score(metrics)
            explanation = QueryExplainer.generate_explanation(request.sql, metrics)
            
            # Analyze query structure
            tables = QueryAnalyzer.extract_tables(request.sql)
            columns = QueryAnalyzer.extract_columns(request.sql)
            has_joins = QueryAnalyzer.has_joins(request.sql)
            has_aggregates = QueryAnalyzer.has_aggregates(request.sql)
            has_subquery = QueryAnalyzer.has_subquery(request.sql)
            
            return {
                "explanation": explanation,
                "complexity": complexity,
                "execution_plan": plan,
                "metrics": metrics,
                "structure": {
                    "tables": tables,
                    "columns": columns,
                    "has_joins": has_joins,
                    "has_aggregates": has_aggregates,
                    "has_subquery": has_subquery,
                },
                "execution_time_ms": result.execution_time_ms,
                "row_count": result.row_count,
            }
    
    except Exception as e:
        logger.error(f"Explain error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
