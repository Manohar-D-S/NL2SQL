"""Speech-to-text endpoint using Whisper"""

from fastapi import APIRouter, UploadFile, File, HTTPException
import logging
from app.services.whisper_service import WhisperService
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize Whisper service
whisper_service = WhisperService(api_key=settings.openai_api_key)


@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """Transcribe audio file to text using Whisper"""
    
    try:
        # Validate file type
        allowed_types = {"audio/mpeg", "audio/wav", "audio/ogg", "audio/flac", "audio/m4a"}
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid audio format. Allowed: {', '.join(allowed_types)}",
            )
        
        # Read audio bytes
        audio_bytes = await file.read()
        
        if len(audio_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty audio file")
        
        if len(audio_bytes) > 25 * 1024 * 1024:  # 25MB limit
            raise HTTPException(status_code=413, detail="Audio file too large (max 25MB)")
        
        # Get audio format from filename
        audio_format = file.filename.split(".")[-1].lower()
        
        # Transcribe
        text = await whisper_service.transcribe_audio(audio_bytes, audio_format)
        
        if not text:
            raise HTTPException(status_code=500, detail="Transcription failed")
        
        logger.info(f"Transcribed {len(audio_bytes)} bytes to: {text[:100]}")
        
        return {
            "text": text,
            "language": "en",
            "confidence": 0.9,  # Whisper doesn't provide explicit confidence
        }
    
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Transcription error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
