"""
FastAPI NL→SQL Translator Backend
Main application entry point with route registration and startup logic
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from app.core.config import settings
from app.core.logger import setup_logging
from app.api.routes import health, schema, translate, execute, validate, explain, optimize, feedback, metrics, speech
from app.db.database import init_db, get_db

# Setup logging
setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle"""
    # Startup
    await init_db()
    yield
    # Shutdown
    pass


app = FastAPI(
    title="NL→SQL Translator API",
    description="Convert natural language queries to SQL",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["localhost", "127.0.0.1", "*.localhost"],
)

# Include routers
app.include_router(health.router, prefix="/api/health", tags=["Health"])
app.include_router(schema.router, prefix="/api/schema", tags=["Schema"])
app.include_router(translate.router, prefix="/api/translate", tags=["Translate"])
app.include_router(execute.router, prefix="/api/execute", tags=["Execute"])
app.include_router(validate.router, prefix="/api/validate", tags=["Validate"])
app.include_router(explain.router, prefix="/api/explain", tags=["Explain"])
app.include_router(optimize.router, prefix="/api/optimize", tags=["Optimize"])
app.include_router(feedback.router, prefix="/api/feedback", tags=["Feedback"])
app.include_router(metrics.router, prefix="/metrics", tags=["Metrics"])
app.include_router(speech.router, prefix="/api/speech", tags=["Speech"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "NL→SQL Translator API",
        "docs": "/docs",
        "health": "/api/health",
    }
