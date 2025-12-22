"""Validate endpoint (stub for Milestone 2)"""

from fastapi import APIRouter
from pydantic import BaseModel
import logging

from app.services.validator import SQLValidator

logger = logging.getLogger(__name__)
router = APIRouter()


class ValidateRequest(BaseModel):
    sql: str
    database: str = "students_db"


class ValidationResult(BaseModel):
    is_safe: bool
    warnings: list[str]
    suggestions: list[str] = []


@router.post("/", response_model=ValidationResult)
async def validate(request: ValidateRequest):
    """Validate SQL query for safety"""
    
    try:
        is_safe, warnings = SQLValidator.is_safe(request.sql)
        
        # Add suggestions based on warnings
        suggestions = []
        if any("DELETE" in w for w in warnings):
            suggestions.append("Use SELECT with WHERE clause to preview rows first")
        if any("DROP" in w for w in warnings):
            suggestions.append("This operation cannot be executed in read-only mode")
        
        logger.info(f"Validation: safe={is_safe}, warnings={len(warnings)}")
        
        return ValidationResult(
            is_safe=is_safe,
            warnings=warnings,
            suggestions=suggestions,
        )
    
    except Exception as e:
        logger.error(f"Validation error: {e}")
        return ValidationResult(is_safe=False, warnings=[str(e)])
