"""Prometheus metrics endpoint"""

from fastapi import APIRouter
from prometheus_client import generate_latest
from fastapi.responses import Response

router = APIRouter()


@router.get("/")
async def metrics():
    """Prometheus metrics endpoint"""
    from app.services.metrics import registry
    return Response(generate_latest(registry), media_type="text/plain")
