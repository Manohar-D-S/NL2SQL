"""Schema extraction and caching service"""

import logging
import hashlib
from typing import Dict, List, Any, Tuple
from sqlalchemy import inspect, text
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


class SchemaService:
    """Extract and serialize database schema"""
    
    @staticmethod
    async def get_schema_context(
        session: AsyncSession,
        database_name: str = "students_db",
    ) -> Tuple[str, str]:
        """Get schema as text context + version hash"""
        
        # Hardcoded schema for now (would be dynamic with actual DB inspection)
        schema_text = SchemaService._get_hardcoded_schema(database_name)
        
        # Generate version hash
        version_hash = hashlib.md5(schema_text.encode()).hexdigest()[:8]
        
        return schema_text, version_hash
    
    @staticmethod
    def _get_hardcoded_schema(database_name: str) -> str:
        """Get hardcoded schema for seed databases"""
        
        if database_name == "students_db":
            return """
TABLE: students
COLUMNS:
  - id (INTEGER, PRIMARY KEY)
  - roll_no (VARCHAR(16), UNIQUE)
  - name (TEXT, NOT NULL)
  - department (TEXT)
  - year (INTEGER)
  - subject (TEXT)
  - marks (INTEGER)
  - dob (DATE)
INDEXES:
  - idx_students_subject_marks (subject, marks)

Sample data: 200 students from Computer Science, Electronics, Mechanical departments
Academic data with marks ranging from 60-100 in various subjects.
"""
        
        elif database_name == "retail_db":
            return """
TABLE: customers
COLUMNS:
  - id (INTEGER, PRIMARY KEY)
  - name (TEXT)
  - email (TEXT, UNIQUE)
  - created_at (TIMESTAMP)

TABLE: products
COLUMNS:
  - id (INTEGER, PRIMARY KEY)
  - name (TEXT)
  - category (TEXT)
  - price (NUMERIC)

TABLE: orders
COLUMNS:
  - id (INTEGER, PRIMARY KEY)
  - customer_id (INTEGER, FOREIGN KEY -> customers.id)
  - order_date (TIMESTAMP)
  - total (NUMERIC)
INDEXES:
  - idx_orders_customer (customer_id)

TABLE: order_items
COLUMNS:
  - id (INTEGER, PRIMARY KEY)
  - order_id (INTEGER, FOREIGN KEY -> orders.id)
  - product_id (INTEGER, FOREIGN KEY -> products.id)
  - qty (INTEGER)
  - price (NUMERIC)

Sample data: 10 customers, 10 products, 50 orders with items
"""
        
        return "Unknown database"
