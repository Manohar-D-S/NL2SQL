"""LLM service for NL→SQL translation"""

import logging
from typing import Optional, List
from pydantic import BaseModel
import json
import os

logger = logging.getLogger(__name__)


class TranslationCandidate(BaseModel):
    """SQL translation candidate"""
    sql: str
    confidence: float
    reasoning: str


class LLMTranslator:
    """Translates natural language to SQL using OpenAI or local models"""
    
    def __init__(self, mode: str = "openai", api_key: Optional[str] = None):
        self.mode = mode
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        
        if self.mode == "openai":
            try:
                from openai import AsyncOpenAI
                self.client = AsyncOpenAI(api_key=self.api_key)
                logger.info("AsyncOpenAI client initialized")
            except ImportError as e:
                logger.error(f"OpenAI library not installed: {e}")
                self.client = None
            except Exception as e:
                logger.error(f"Failed to initialize OpenAI client: {e}")
                self.client = None
    
    def _build_system_prompt(self, schema_context: str) -> str:
        """Build system prompt with schema context and few-shot examples"""
        return f"""You are an expert SQL query writer. Convert natural language queries to SQL.

SCHEMA CONTEXT:
{schema_context}

RULES:
1. Generate only valid SQL for the given schema
2. Use table and column names exactly as provided
3. Prefer SELECT queries (read-only operations)
4. Provide 2-3 alternative SQL candidates if semantically different
5. Respond in JSON format with list of candidates

EXAMPLES:
- NL: "Show all students with marks above 80"
  SQL: SELECT * FROM students WHERE marks > 80;
  
- NL: "Get computer science students in year 2"
  SQL: SELECT * FROM students WHERE department = 'Computer Science' AND year = 2;

Format your response as JSON:
{{
  "candidates": [
    {{"sql": "SELECT ...", "confidence": 0.95, "reasoning": "..."}}
  ]
}}"""
    
    async def translate(self, natural_language: str, schema_context: str) -> List[TranslationCandidate]:
        """Translate natural language to SQL candidates"""
        
        if self.mode == "openai":
            return await self._translate_openai(natural_language, schema_context)
        else:
            return await self._translate_local(natural_language, schema_context)
    
    async def _translate_openai(self, natural_language: str, schema_context: str) -> List[TranslationCandidate]:
        """Translate using OpenAI API"""
        if not self.client:
            logger.error("OpenAI client not initialized - API key may be missing")
            return []
        
        try:
            logger.info(f"Translating: {natural_language[:50]}...")
            system_prompt = self._build_system_prompt(schema_context)
            
            response = await self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": natural_language},
                ],
                temperature=0.3,
                max_tokens=1000,
                n=1,
            )
            
            content = response.choices[0].message.content
            logger.info(f"OpenAI response: {content[:200]}")
            
            # Parse JSON response
            try:
                data = json.loads(content)
                candidates = [
                    TranslationCandidate(**c) for c in data.get("candidates", [])
                ]
                logger.info(f"Parsed {len(candidates)} translation candidates")
                return candidates
            except (json.JSONDecodeError, ValueError) as e:
                logger.error(f"Failed to parse OpenAI response: {e}")
                # Fallback: extract SQL from response
                return [TranslationCandidate(
                    sql=content.split(";")[0] + ";",
                    confidence=0.7,
                    reasoning="Extracted from response",
                )]
        
        except Exception as e:
            logger.error(f"OpenAI translation error: {e}", exc_info=True)
            return []
    
    async def _translate_local(self, natural_language: str, schema_context: str) -> List[TranslationCandidate]:
        """Translate using local BART model"""
        try:
            from app.services.bart_translator import bart_translator
            logger.info("Using BART model for translation")
            candidates = await bart_translator.translate(natural_language, schema_context)
            return candidates
        except Exception as e:
            logger.error(f"BART translation error: {e}", exc_info=True)
            return []
