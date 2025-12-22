"""Schema metadata endpoints"""

from fastapi import APIRouter, Query, HTTPException
from typing import Optional
import logging
import hashlib
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import inspect
from app.db.database import AsyncSessionLocal

logger = logging.getLogger(__name__)
router = APIRouter()


async def get_schema_metadata(database: str = "students_db"):
    """Get schema metadata for a database"""
    # Map database names to connection strings (simplified)
    db_map = {
        "students_db": "postgresql+asyncpg://postgres:password@postgres:5432/students_db",
        "retail_db": "postgresql+asyncpg://postgres:password@postgres:5432/retail_db",
    }
    
    if database not in db_map:
        raise HTTPException(status_code=400, detail="Invalid database name")
    
    tables = {}
    
    # Hardcoded schema for Milestone 1 (would be dynamic in Milestone 2)
    if database == "students_db":
        tables = {
            "students": {
                "columns": [
                    {"name": "id", "type": "INTEGER", "nullable": False, "key": "PRIMARY KEY"},
                    {"name": "roll_no", "type": "VARCHAR(16)", "nullable": False, "key": "UNIQUE"},
                    {"name": "name", "type": "TEXT", "nullable": False},
                    {"name": "department", "type": "TEXT", "nullable": True},
                    {"name": "year", "type": "INTEGER", "nullable": True},
                    {"name": "subject", "type": "TEXT", "nullable": True},
                    {"name": "marks", "type": "INTEGER", "nullable": True},
                    {"name": "dob", "type": "DATE", "nullable": True},
                ],
                "indexes": ["idx_students_subject_marks"],
            }
        }
    elif database == "retail_db":
        tables = {
            "customers": {
                "columns": [
                    {"name": "id", "type": "INTEGER", "nullable": False, "key": "PRIMARY KEY"},
                    {"name": "name", "type": "TEXT", "nullable": True},
                    {"name": "email", "type": "TEXT", "nullable": True, "key": "UNIQUE"},
                    {"name": "created_at", "type": "TIMESTAMP", "nullable": True},
                ],
            },
            "products": {
                "columns": [
                    {"name": "id", "type": "INTEGER", "nullable": False, "key": "PRIMARY KEY"},
                    {"name": "name", "type": "TEXT", "nullable": True},
                    {"name": "category", "type": "TEXT", "nullable": True},
                    {"name": "price", "type": "NUMERIC", "nullable": True},
                ],
            },
            "orders": {
                "columns": [
                    {"name": "id", "type": "INTEGER", "nullable": False, "key": "PRIMARY KEY"},
                    {"name": "customer_id", "type": "INTEGER", "nullable": True, "key": "FOREIGN KEY"},
                    {"name": "order_date", "type": "TIMESTAMP", "nullable": True},
                    {"name": "total", "type": "NUMERIC", "nullable": True},
                ],
                "indexes": ["idx_orders_customer"],
            },
            "order_items": {
                "columns": [
                    {"name": "id", "type": "INTEGER", "nullable": False, "key": "PRIMARY KEY"},
                    {"name": "order_id", "type": "INTEGER", "nullable": True, "key": "FOREIGN KEY"},
                    {"name": "product_id", "type": "INTEGER", "nullable": True, "key": "FOREIGN KEY"},
                    {"name": "qty", "type": "INTEGER", "nullable": True},
                    {"name": "price", "type": "NUMERIC", "nullable": True},
                ],
            },
        }
    
    # Generate schema context version hash
    schema_str = str(tables)
    schema_version = hashlib.md5(schema_str.encode()).hexdigest()[:8]
    
    return {
        "database": database,
        "tables": tables,
        "schema_context_version": schema_version,
    }


@router.get("/")
async def list_databases():
    """List available databases"""
    return {
        "databases": ["students_db", "retail_db"],
        "default": "students_db",
    }


@router.get("/{database}")
async def get_database_schema(database: str = Query(...)):
    """Get schema for a specific database"""
    try:
        schema = await get_schema_metadata(database)
        return schema
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error fetching schema: {e}")
        raise HTTPException(status_code=500, detail="Error fetching schema")
