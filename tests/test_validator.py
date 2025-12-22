"""Unit tests for SQL validator"""

import pytest
from app.services.validator import SQLValidator


class TestSQLValidator:
    """Test SQL validation"""
    
    def test_safe_select_query(self):
        """SELECT queries should be safe"""
        sql = "SELECT * FROM students WHERE marks > 80;"
        is_safe, warnings = SQLValidator.is_safe(sql)
        assert is_safe is True
        assert len(warnings) == 0
    
    def test_delete_query_unsafe(self):
        """DELETE queries should be flagged as unsafe"""
        sql = "DELETE FROM students WHERE id = 1;"
        is_safe, warnings = SQLValidator.is_safe(sql)
        assert is_safe is False
        assert any("DELETE" in w for w in warnings)
    
    def test_drop_query_unsafe(self):
        """DROP queries should be flagged as unsafe"""
        sql = "DROP TABLE students;"
        is_safe, warnings = SQLValidator.is_safe(sql)
        assert is_safe is False
        assert any("DROP" in w for w in warnings)
    
    def test_insert_query_unsafe(self):
        """INSERT queries should be flagged as unsafe"""
        sql = "INSERT INTO students (name, marks) VALUES ('John', 85);"
        is_safe, warnings = SQLValidator.is_safe(sql)
        assert is_safe is False
        assert any("INSERT" in w for w in warnings)
    
    def test_update_query_unsafe(self):
        """UPDATE queries should be flagged as unsafe"""
        sql = "UPDATE students SET marks = 90 WHERE id = 1;"
        is_safe, warnings = SQLValidator.is_safe(sql)
        assert is_safe is False
        assert any("UPDATE" in w for w in warnings)
    
    def test_complex_select_safe(self):
        """Complex SELECT with JOINs should be safe"""
        sql = """
        SELECT s.name, s.marks, COUNT(*) as count
        FROM students s
        WHERE s.department = 'Computer Science'
        GROUP BY s.name, s.marks
        ORDER BY s.marks DESC;
        """
        is_safe, warnings = SQLValidator.is_safe(sql)
        assert is_safe is True
        assert len(warnings) == 0
    
    def test_case_insensitive_detection(self):
        """Detection should be case-insensitive"""
        sql = "delete from students;"
        is_safe, warnings = SQLValidator.is_safe(sql)
        assert is_safe is False
        assert any("DELETE" in w for w in warnings)
