"""BART model service for NL→SQL translation using SwastikM/bart-large-nl2sql"""

import logging
from typing import List, Optional
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch

from app.services.llm_translator import TranslationCandidate

logger = logging.getLogger(__name__)


class BARTTranslator:
    """Translates natural language to SQL using BART model"""
    
    _instance = None
    _model = None
    _tokenizer = None
    
    def __new__(cls):
        """Singleton pattern to avoid loading model multiple times"""
        if cls._instance is None:
            cls._instance = super(BARTTranslator, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        """Initialize BART model and tokenizer (lazy loading)"""
        if self._model is None:
            self._load_model()
    
    def _load_model(self):
        """Load the BART model and tokenizer"""
        try:
            logger.info("Loading BART NL2SQL model (SwastikM/bart-large-nl2sql)...")
            model_name = "SwastikM/bart-large-nl2sql"
            
            self._tokenizer = AutoTokenizer.from_pretrained(model_name)
            self._model = AutoModelForSeq2SeqLM.from_pretrained(model_name)
            
            # Move to GPU if available
            if torch.cuda.is_available():
                self._model = self._model.cuda()
                logger.info("Model loaded on GPU")
            else:
                logger.info("Model loaded on CPU")
            
            logger.info("BART model loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load BART model: {e}", exc_info=True)
            raise RuntimeError(f"Model initialization failed: {e}")
    
    def _format_prompt(self, natural_language: str, schema_context: str) -> str:
        """Format the input prompt for BART model"""
        # BART model expects: sql_prompt: <query> sql_context: <schema>
        return f"sql_prompt: {natural_language}\nsql_context: {schema_context}"
    
    async def translate(
        self, 
        natural_language: str, 
        schema_context: str,
        num_beams: int = 3,
        num_return_sequences: int = 3,
        max_new_tokens: int = 200,
    ) -> List[TranslationCandidate]:
        """
        Translate natural language to SQL using BART model
        
        Args:
            natural_language: The natural language query
            schema_context: Database schema context (CREATE TABLE statements)
            num_beams: Number of beams for beam search
            num_return_sequences: Number of SQL candidates to generate
            max_new_tokens: Maximum tokens to generate
            
        Returns:
            List of SQL translation candidates
        """
        try:
            if self._model is None or self._tokenizer is None:
                raise RuntimeError("Model not initialized")
            
            logger.info(f"Translating query: {natural_language[:100]}...")
            
            # Format the prompt
            prompt = self._format_prompt(natural_language, schema_context)
            
            # Tokenize input
            inputs = self._tokenizer(
                prompt, 
                return_tensors="pt",
                max_length=512,
                truncation=True
            ).input_ids
            
            # Move to same device as model
            if torch.cuda.is_available():
                inputs = inputs.cuda()
            
            # Generate SQL with beam search for multiple candidates
            with torch.no_grad():
                outputs = self._model.generate(
                    inputs,
                    max_new_tokens=max_new_tokens,
                    num_beams=num_beams,
                    num_return_sequences=min(num_return_sequences, num_beams),
                    do_sample=False,  # Deterministic for consistency
                    early_stopping=True,
                    return_dict_in_generate=True,
                    output_scores=True,
                )
            
            # Decode the generated SQL queries
            candidates = []
            sequences = outputs.sequences
            scores = outputs.sequences_scores if hasattr(outputs, 'sequences_scores') else None
            
            for idx, sequence in enumerate(sequences):
                sql = self._tokenizer.decode(sequence, skip_special_tokens=True)
                
                # Calculate confidence from score (normalize to 0-1 range)
                if scores is not None:
                    # Scores are log probabilities, convert to confidence
                    confidence = float(torch.exp(scores[idx]).cpu())
                else:
                    # Default confidence based on ranking
                    confidence = max(0.5, 1.0 - (idx * 0.15))
                
                candidates.append(
                    TranslationCandidate(
                        sql=sql.strip(),
                        confidence=round(confidence, 3),
                        reasoning=f"Generated by BART model (beam {idx + 1})"
                    )
                )
            
            logger.info(f"Generated {len(candidates)} SQL candidates")
            
            # Remove duplicates while preserving order
            unique_candidates = []
            seen_sql = set()
            for candidate in candidates:
                if candidate.sql not in seen_sql:
                    unique_candidates.append(candidate)
                    seen_sql.add(candidate.sql)
            
            return unique_candidates
            
        except Exception as e:
            logger.error(f"BART translation error: {e}", exc_info=True)
            return []
    
    def unload_model(self):
        """Unload model to free memory"""
        if self._model is not None:
            del self._model
            del self._tokenizer
            self._model = None
            self._tokenizer = None
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            logger.info("BART model unloaded")


# Global instance
bart_translator = BARTTranslator()
