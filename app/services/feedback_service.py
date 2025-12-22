"""Feedback collection and storage service"""

import logging
from datetime import datetime
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import insert
from app.db.models import QueryFeedback

logger = logging.getLogger(__name__)


class FeedbackService:
    """Manages query feedback for model training"""
    
    @staticmethod
    async def submit_feedback(
        session: AsyncSession,
        query_id: str,
        natural_language: str,
        generated_sql: str,
        user_feedback: str,
        rating: int,
    ) -> bool:
        """Store user feedback on generated query"""
        
        try:
            # Validate rating
            if not (1 <= rating <= 5):
                logger.warning(f"Invalid rating {rating}, must be 1-5")
                rating = max(1, min(5, rating))
            
            # Insert feedback
            stmt = insert(QueryFeedback).values(
                query_id=query_id,
                natural_language=natural_language,
                generated_sql=generated_sql,
                user_feedback=user_feedback,
                rating=rating,
                created_at=datetime.utcnow(),
            )
            
            await session.execute(stmt)
            await session.commit()
            
            logger.info(f"Feedback stored for query {query_id}, rating: {rating}")
            return True
        
        except Exception as e:
            logger.error(f"Error storing feedback: {e}")
            await session.rollback()
            return False
    
    @staticmethod
    async def get_feedback_stats(session: AsyncSession) -> dict:
        """Get feedback statistics"""
        
        try:
            from sqlalchemy import func, select
            
            stmt = select(
                func.count(QueryFeedback.id).label("total_feedback"),
                func.avg(QueryFeedback.rating).label("avg_rating"),
                func.count(QueryFeedback.id).filter(QueryFeedback.rating >= 4).label("positive_count"),
            )
            
            result = await session.execute(stmt)
            row = result.first()
            
            return {
                "total_feedback": row[0] or 0,
                "average_rating": round(row[1] or 0, 2),
                "positive_feedback_count": row[2] or 0,
            }
        
        except Exception as e:
            logger.error(f"Error getting feedback stats: {e}")
            return {}
