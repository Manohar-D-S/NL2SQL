"""Query optimization suggestion engine (rule-based)"""

import logging
import re
from typing import List, Dict, Any

logger = logging.getLogger(__name__)


class OptimizationSuggestion:
    """A single optimization suggestion"""
    
    def __init__(
        self,
        type: str,
        priority: str,
        title: str,
        description: str,
        suggested_change: str,
        estimated_improvement: str,
    ):
        self.type = type
        self.priority = priority
        self.title = title
        self.description = description
        self.suggested_change = suggested_change
        self.estimated_improvement = estimated_improvement
    
    def to_dict(self):
        return {
            "type": self.type,
            "priority": self.priority,
            "title": self.title,
            "description": self.description,
            "suggested_change": self.suggested_change,
            "estimated_improvement": self.estimated_improvement,
        }


class QueryOptimizer:
    """Generates optimization suggestions based on query patterns"""
    
    @staticmethod
    def analyze(sql: str, explain_plan: Optional[str] = None) -> List[OptimizationSuggestion]:
        """Analyze query and generate optimization suggestions"""
        suggestions = []
        
        sql_upper = sql.upper()
        
        # Rule 1: SELECT * usage
        if re.search(r'SELECT\s+\*', sql_upper):
            suggestions.append(OptimizationSuggestion(
                type="column_selection",
                priority="medium",
                title="Specify columns instead of SELECT *",
                description="Using SELECT * fetches all columns which may be unnecessary and increases network traffic",
                suggested_change="Replace SELECT * with specific columns: SELECT id, name, email FROM customers",
                estimated_improvement="10-20% reduction in data transfer",
            ))
        
        # Rule 2: Missing indexes
        if re.search(r'WHERE\s+\w+\s*[=<>]', sql_upper):
            suggestions.append(OptimizationSuggestion(
                type="index",
                priority="high",
                title="Consider adding indexes on filtered columns",
                description="Queries with WHERE clauses benefit from indexes on frequently filtered columns",
                suggested_change="CREATE INDEX idx_customers_email ON customers(email);",
                estimated_improvement="50-100% faster lookups",
            ))
        
        # Rule 3: N+1 query pattern
        if re.search(r'SELECT.*FROM.*WHERE\s+id\s*=', sql_upper):
            suggestions.append(OptimizationSuggestion(
                type="query_pattern",
                priority="high",
                title="Potential N+1 query pattern detected",
                description="Single-row lookups in loops should be batched or replaced with JOINs",
                suggested_change="Use JOIN instead of multiple queries: SELECT * FROM customers JOIN orders",
                estimated_improvement="100-1000% improvement with batching",
            ))
        
        # Rule 4: LIMIT without ORDER BY
        if re.search(r'LIMIT\s+\d+', sql_upper) and not re.search(r'ORDER\s+BY', sql_upper):
            suggestions.append(OptimizationSuggestion(
                type="sorting",
                priority="low",
                title="Consider adding ORDER BY with LIMIT",
                description="LIMIT without ORDER BY returns arbitrary rows; specify ORDER BY for consistency",
                suggested_change="Add ORDER BY: SELECT * FROM students ORDER BY marks DESC LIMIT 10;",
                estimated_improvement="Better result predictability",
            ))
        
        # Rule 5: GROUP BY without aggregates
        if re.search(r'GROUP\s+BY', sql_upper) and not re.search(r'\b(COUNT|SUM|AVG|MIN|MAX)\s*\(', sql_upper):
            suggestions.append(OptimizationSuggestion(
                type="grouping",
                priority="medium",
                title="GROUP BY without aggregate functions",
                description="GROUP BY is typically used with aggregate functions like COUNT, SUM, AVG",
                suggested_change="Add aggregate: SELECT department, COUNT(*) FROM students GROUP BY department;",
                estimated_improvement="Clarifies query intent",
            ))
        
        # Rule 6: DISTINCT usage
        if re.search(r'SELECT\s+DISTINCT', sql_upper):
            suggestions.append(OptimizationSuggestion(
                type="performance",
                priority="medium",
                title="DISTINCT can be expensive",
                description="DISTINCT removes duplicates but may be slow on large datasets",
                suggested_change="Consider using GROUP BY instead or ensure your data model eliminates duplicates",
                estimated_improvement="Varies by data, may reduce overhead",
            ))
        
        # Rule 7: LIKE with leading wildcard
        if re.search(r"LIKE\s+'%", sql_upper, re.IGNORECASE):
            suggestions.append(OptimizationSuggestion(
                type="search",
                priority="high",
                title="LIKE with leading wildcard prevents index usage",
                description="Patterns like '%text' cannot use indexes and require full table scans",
                suggested_change="Avoid leading wildcards if possible: WHERE name LIKE 'A%' instead of '%son'",
                estimated_improvement="100-1000% faster with proper indexes",
            ))
        
        return suggestions
