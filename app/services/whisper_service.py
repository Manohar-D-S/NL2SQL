"""Whisper speech-to-text service"""

import logging
from typing import Optional
import asyncio
import tempfile
from pathlib import Path

logger = logging.getLogger(__name__)


class WhisperService:
    """OpenAI Whisper for speech-to-text transcription"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key
        try:
            from openai import OpenAI
            self.client = OpenAI(api_key=api_key)
        except ImportError:
            logger.error("OpenAI library not installed")
            self.client = None
    
    async def transcribe_audio(
        self,
        audio_bytes: bytes,
        audio_format: str = "mp3",
    ) -> Optional[str]:
        """Transcribe audio file to text using Whisper"""
        
        if not self.client:
            logger.error("OpenAI client not initialized")
            return None
        
        try:
            # Create temporary file
            with tempfile.NamedTemporaryFile(
                suffix=f".{audio_format}",
                delete=False,
            ) as temp_file:
                temp_file.write(audio_bytes)
                temp_path = temp_file.name
            
            # Run transcription in thread pool
            loop = asyncio.get_event_loop()
            transcription = await loop.run_in_executor(
                None,
                self._transcribe_sync,
                temp_path,
            )
            
            # Clean up temp file
            Path(temp_path).unlink()
            
            return transcription
        
        except Exception as e:
            logger.error(f"Whisper transcription error: {e}")
            return None
    
    def _transcribe_sync(self, audio_path: str) -> Optional[str]:
        """Synchronous transcription (runs in thread)"""
        
        try:
            with open(audio_path, "rb") as audio_file:
                transcript = self.client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                )
            
            return transcript.text
        
        except Exception as e:
            logger.error(f"Whisper API error: {e}")
            return None
