"""Query explanation service using EXPLAIN and LLM analysis"""

import logging
from typing import Optional, List, Dict, Any
import json
import re

logger = logging.getLogger(__name__)


class QueryExplainer:
    """Explains SQL queries using EXPLAIN output and LLM analysis"""
    
    @staticmethod
    def parse_explain_plan(explain_json: str) -> Dict[str, Any]:
        """Parse PostgreSQL EXPLAIN JSON output"""
        try:
            plan = json.loads(explain_json)
            if isinstance(plan, list) and len(plan) > 0:
                return plan[0]
            return plan
        except (json.JSONDecodeError, TypeError):
            return {}
    
    @staticmethod
    def extract_plan_metrics(plan: Dict[str, Any]) -> Dict[str, Any]:
        """Extract key metrics from query plan"""
        if not plan:
            return {}
        
        def get_plan_info(node: Dict) -> Dict[str, Any]:
            """Recursively extract info from plan node"""
            info = {
                "node_type": node.get("Node Type", ""),
                "rows": node.get("Actual Rows", node.get("Estimated Rows", 0)),
                "duration_ms": node.get("Actual Total Time", node.get("Total Cost", 0)),
                "filter": node.get("Filter", None),
                "index_name": node.get("Index Name", None),
                "scan_direction": node.get("Scan Direction", None),
            }
            return info
        
        top_level = get_plan_info(plan.get("Plan", {}))
        total_time = plan.get("Planning Time", 0) + plan.get("Execution Time", 0)
        
        return {
            "total_time_ms": total_time,
            "planning_time_ms": plan.get("Planning Time", 0),
            "execution_time_ms": plan.get("Execution Time", 0),
            "top_level_plan": top_level,
        }
    
    @staticmethod
    def generate_explanation(
        sql: str,
        plan_metrics: Dict[str, Any],
    ) -> str:
        """Generate human-readable explanation of query"""
        
        explanation = f"Query Execution Analysis:\n\n"
        
        if not plan_metrics:
            return explanation + "Unable to parse execution plan."
        
        # Timing info
        total = plan_metrics.get("total_time_ms", 0)
        planning = plan_metrics.get("planning_time_ms", 0)
        execution = plan_metrics.get("execution_time_ms", 0)
        
        explanation += f"Total Time: {total:.2f}ms\n"
        explanation += f"  - Planning: {planning:.2f}ms\n"
        explanation += f"  - Execution: {execution:.2f}ms\n\n"
        
        # Plan info
        top_plan = plan_metrics.get("top_level_plan", {})
        if top_plan.get("node_type"):
            explanation += f"Scan Type: {top_plan.get('node_type')}\n"
            if top_plan.get("rows"):
                explanation += f"Rows Returned: {top_plan.get('rows')}\n"
            if top_plan.get("filter"):
                explanation += f"Filter: {top_plan.get('filter')}\n"
            if top_plan.get("index_name"):
                explanation += f"Index Used: {top_plan.get('index_name')}\n"
        
        return explanation
    
    @staticmethod
    def get_complexity_score(plan_metrics: Dict[str, Any]) -> str:
        """Estimate query complexity"""
        if not plan_metrics:
            return "unknown"
        
        total_time = plan_metrics.get("total_time_ms", 0)
        
        if total_time < 1:
            return "very_simple"
        elif total_time < 10:
            return "simple"
        elif total_time < 100:
            return "moderate"
        elif total_time < 1000:
            return "complex"
        else:
            return "very_complex"


class QueryAnalyzer:
    """Analyzes query structure and patterns"""
    
    @staticmethod
    def extract_tables(sql: str) -> List[str]:
        """Extract table names from SQL"""
        # Simple regex-based extraction
        pattern = r'\bFROM\s+(\w+)|JOIN\s+(\w+)'
        matches = re.findall(pattern, sql, re.IGNORECASE)
        tables = [m[0] if m[0] else m[1] for m in matches]
        return list(set(tables))
    
    @staticmethod
    def extract_columns(sql: str) -> List[str]:
        """Extract selected columns from SQL"""
        # Extract between SELECT and FROM
        match = re.search(r'SELECT\s+(.*?)\s+FROM', sql, re.IGNORECASE | re.DOTALL)
        if match:
            cols_str = match.group(1)
            cols = [c.strip() for c in cols_str.split(',')]
            return cols
        return []
    
    @staticmethod
    def has_joins(sql: str) -> bool:
        """Check if query has JOINs"""
        return bool(re.search(r'\bJOIN\b', sql, re.IGNORECASE))
    
    @staticmethod
    def has_aggregates(sql: str) -> bool:
        """Check if query uses aggregates"""
        return bool(re.search(r'\b(COUNT|SUM|AVG|MIN|MAX|GROUP_CONCAT)\s*\(', sql, re.IGNORECASE))
    
    @staticmethod
    def has_subquery(sql: str) -> bool:
        """Check if query has subqueries"""
        return bool(re.search(r'$$.*SELECT.*$$', sql, re.IGNORECASE | re.DOTALL))
