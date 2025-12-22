"""Optimize endpoint (Milestone 3)"""

from fastapi import APIRouter
from pydantic import BaseModel
import logging

from app.services.query_optimizer import QueryOptimizer
from app.services.metrics import MetricsMiddleware

logger = logging.getLogger(__name__)
router = APIRouter()


class OptimizeRequest(BaseModel):
    sql: str
    database: str = "students_db"


@router.post("/")
async def optimize(request: OptimizeRequest):
    """Get optimization suggestions for SQL query"""
    
    try:
        # Generate suggestions
        suggestions = QueryOptimizer.analyze(request.sql)
        
        # Sort by priority
        priority_order = {"high": 0, "medium": 1, "low": 2}
        suggestions.sort(key=lambda s: priority_order.get(s.priority, 3))
        
        logger.info(f"Generated {len(suggestions)} optimization suggestions")
        
        return {
            "suggestions": [s.to_dict() for s in suggestions],
            "total_suggestions": len(suggestions),
            "high_priority_count": sum(1 for s in suggestions if s.priority == "high"),
            "medium_priority_count": sum(1 for s in suggestions if s.priority == "medium"),
            "low_priority_count": sum(1 for s in suggestions if s.priority == "low"),
        }
    
    except Exception as e:
        logger.error(f"Optimize error: {e}")
        return {
            "suggestions": [],
            "error": str(e),
        }
