"""Feedback endpoint (Milestone 3)"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import logging
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.services.feedback_service import FeedbackService

logger = logging.getLogger(__name__)
router = APIRouter()


class FeedbackRequest(BaseModel):
    query_id: str
    natural_language: str
    generated_sql: str
    user_feedback: str
    rating: int  # 1-5


@router.post("/")
async def submit_feedback(
    request: FeedbackRequest,
    session: AsyncSession = Depends(get_db),
):
    """Submit feedback on generated query"""
    
    try:
        success = await FeedbackService.submit_feedback(
            session,
            request.query_id,
            request.natural_language,
            request.generated_sql,
            request.user_feedback,
            request.rating,
        )
        
        if success:
            return {
                "status": "received",
                "query_id": request.query_id,
                "rating": request.rating,
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to store feedback")
    
    except Exception as e:
        logger.error(f"Feedback error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def get_feedback_stats(session: AsyncSession = Depends(get_db)):
    """Get feedback statistics"""
    
    try:
        stats = await FeedbackService.get_feedback_stats(session)
        return stats
    
    except Exception as e:
        logger.error(f"Stats error: {e}")
        return {}
