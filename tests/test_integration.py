"""Integration tests for Milestone 3"""

import pytest
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.services.query_explainer import QueryExplainer, QueryAnalyzer
from app.services.query_optimizer import QueryOptimizer
from app.services.feedback_service import FeedbackService


class TestQueryExplainer:
    """Test query explanation functionality"""
    
    def test_extract_tables(self):
        """Extract tables from SQL"""
        sql = "SELECT * FROM students s JOIN marks m ON s.id = m.student_id"
        tables = QueryAnalyzer.extract_tables(sql)
        assert "students" in tables
        assert "marks" in tables
    
    def test_extract_columns(self):
        """Extract columns from SELECT"""
        sql = "SELECT id, name, email FROM customers"
        columns = QueryAnalyzer.extract_columns(sql)
        assert "id" in columns
        assert "name" in columns
        assert "email" in columns
    
    def test_has_joins_detection(self):
        """Detect JOINs in query"""
        sql_with_join = "SELECT * FROM a JOIN b ON a.id = b.id"
        sql_without_join = "SELECT * FROM a WHERE id = 1"
        
        assert QueryAnalyzer.has_joins(sql_with_join) is True
        assert QueryAnalyzer.has_joins(sql_without_join) is False
    
    def test_aggregate_detection(self):
        """Detect aggregate functions"""
        sql_with_agg = "SELECT COUNT(*) as total FROM students"
        sql_without_agg = "SELECT * FROM students"
        
        assert QueryAnalyzer.has_aggregates(sql_with_agg) is True
        assert QueryAnalyzer.has_aggregates(sql_without_agg) is False
    
    def test_complexity_scoring(self):
        """Score query complexity"""
        metrics_fast = {"total_time_ms": 0.5}
        metrics_slow = {"total_time_ms": 500}
        
        assert QueryExplainer.get_complexity_score(metrics_fast) == "very_simple"
        assert QueryExplainer.get_complexity_score(metrics_slow) == "moderate"


class TestQueryOptimizer:
    """Test query optimization suggestions"""
    
    def test_select_star_suggestion(self):
        """Suggest specififying columns instead of SELECT *"""
        sql = "SELECT * FROM customers"
        suggestions = QueryOptimizer.analyze(sql)
        
        assert len(suggestions) > 0
        assert any(s.type == "column_selection" for s in suggestions)
    
    def test_index_suggestion(self):
        """Suggest adding indexes"""
        sql = "SELECT * FROM customers WHERE email = 'test@example.com'"
        suggestions = QueryOptimizer.analyze(sql)
        
        assert any(s.type == "index" for s in suggestions)
    
    def test_leading_wildcard_suggestion(self):
        """Detect inefficient LIKE patterns"""
        sql = "SELECT * FROM customers WHERE name LIKE '%John%'"
        suggestions = QueryOptimizer.analyze(sql)
        
        assert any(s.type == "search" for s in suggestions)
    
    def test_priority_sorting(self):
        """Suggestions sorted by priority"""
        sql = "SELECT * FROM customers WHERE email = 'test@example.com' LIKE '%test%'"
        suggestions = QueryOptimizer.analyze(sql)
        
        if len(suggestions) > 1:
            priorities = [s.priority for s in suggestions]
            # Check if sorted by priority
            assert priorities == sorted(priorities, key=lambda x: {"high": 0, "medium": 1, "low": 2}.get(x, 3))
