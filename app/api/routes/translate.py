"""Translate endpoint (stub for Milestone 2)"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List
import logging
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.services.llm_translator import LLMTranslator
from app.services.schema_service import SchemaService
from app.services.cache_service import cache_service
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()


class TranslateRequest(BaseModel):
    natural_language: str
    database: str = "students_db"


class SQLCandidate(BaseModel):
    sql: str
    confidence: float
    reasoning: str


@router.post("/")
async def translate(
    request: TranslateRequest,
    session: AsyncSession = Depends(get_db),
):
    """Translate natural language to SQL candidates using OpenAI"""
    
    try:
        logger.info(f"Translate request: database={request.database}, query={request.natural_language[:50]}")
        
        if not request.natural_language or not request.natural_language.strip():
            raise HTTPException(status_code=400, detail="Query cannot be empty")
        
        # Get schema context (cached)
        cache_key = cache_service.make_key("schema", request.database)
        cached_schema = cache_service.get(cache_key)
        
        if cached_schema:
            logger.info(f"Using cached schema for {request.database}")
            schema_text, schema_version = cached_schema
        else:
            logger.info(f"Fetching fresh schema for {request.database}")
            schema_text, schema_version = await SchemaService.get_schema_context(
                session, request.database
            )
            cache_service.set(cache_key, (schema_text, schema_version), ttl_seconds=3600)
        
        if not settings.model_mode:
            logger.error("MODEL_MODE not configured")
            raise HTTPException(status_code=500, detail="Model not configured")
        
        if settings.model_mode == "openai" and not settings.openai_api_key:
            logger.error("OPENAI_API_KEY not set")
            raise HTTPException(status_code=500, detail="OpenAI API key not configured")
        
        # Translate using LLM
        logger.info(f"Initializing translator with mode={settings.model_mode}")
        translator = LLMTranslator(
            mode=settings.model_mode,
            api_key=settings.openai_api_key,
        )
        
        logger.info("Calling translator.translate()")
        candidates = await translator.translate(
            request.natural_language,
            schema_text,
        )
        
        logger.info(f"Translation completed with {len(candidates)} candidates")
        
        if not candidates:
            logger.warning("Translation returned no candidates")
            return {
                "error": "Translation failed",
                "candidates": [],
            }
        
        return {
            "candidates": [c.dict() for c in candidates],
            "schema_context_version": schema_version,
            "database": request.database,
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Translation error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")
