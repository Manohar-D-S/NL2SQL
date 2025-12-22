"""Caching service for schema and query results"""

import logging
import json
import hashlib
from typing import Optional, Any
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class CacheService:
    """Simple in-memory cache with TTL (Redis support in Milestone 4)"""
    
    def __init__(self):
        self.cache = {}
        self.ttl = {}
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        if key not in self.cache:
            return None
        
        # Check TTL
        if key in self.ttl:
            if datetime.now() > self.ttl[key]:
                del self.cache[key]
                del self.ttl[key]
                return None
        
        return self.cache[key]
    
    def set(self, key: str, value: Any, ttl_seconds: int = 3600):
        """Set value in cache with TTL"""
        self.cache[key] = value
        self.ttl[key] = datetime.now() + timedelta(seconds=ttl_seconds)
        logger.debug(f"Cached {key} for {ttl_seconds}s")
    
    def invalidate(self, key: str):
        """Remove key from cache"""
        if key in self.cache:
            del self.cache[key]
            if key in self.ttl:
                del self.ttl[key]
    
    @staticmethod
    def make_key(*parts) -> str:
        """Create cache key from parts"""
        key_str = ":".join(str(p) for p in parts)
        return hashlib.md5(key_str.encode()).hexdigest()


# Global cache instance
cache_service = CacheService()
