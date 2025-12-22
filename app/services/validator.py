"""SQL validation service (stub for Milestone 2)"""

import re
import logging

logger = logging.getLogger(__name__)


class SQLValidator:
    """Validates SQL queries for safety"""
    
    DESTRUCTIVE_KEYWORDS = ["DELETE", "DROP", "TRUNCATE", "ALTER", "UPDATE", "INSERT", "CREATE"]
    
    @staticmethod
    def is_safe(sql: str) -> tuple[bool, list[str]]:
        """Check if SQL is safe to execute"""
        warnings = []
        
        sql_upper = sql.upper().strip()
        
        # Check for destructive operations
        for keyword in SQLValidator.DESTRUCTIVE_KEYWORDS:
            if re.search(rf"\b{keyword}\b", sql_upper):
                warnings.append(f"Query contains {keyword} operation")
        
        if warnings:
            return False, warnings
        
        return True, []
