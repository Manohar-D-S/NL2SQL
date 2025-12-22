"""Prometheus metrics for monitoring"""

from prometheus_client import Counter, Histogram, Gauge, CollectorRegistry
import time

# Create registry
registry = CollectorRegistry()

# Counters
translate_requests = Counter(
    'translate_requests_total',
    'Total translate requests',
    ['database', 'status'],
    registry=registry,
)

execute_requests = Counter(
    'execute_requests_total',
    'Total execute requests',
    ['database', 'status'],
    registry=registry,
)

validate_requests = Counter(
    'validate_requests_total',
    'Total validate requests',
    ['result'],
    registry=registry,
)

# Histograms
translate_latency = Histogram(
    'translate_latency_seconds',
    'Translate endpoint latency',
    buckets=(0.1, 0.5, 1.0, 2.0, 5.0),
    registry=registry,
)

execute_latency = Histogram(
    'execute_latency_seconds',
    'Execute endpoint latency',
    buckets=(0.1, 0.5, 1.0, 2.0, 5.0),
    registry=registry,
)

execute_duration = Histogram(
    'query_execution_duration_ms',
    'Query execution duration in milliseconds',
    buckets=(10, 50, 100, 500, 1000, 5000),
    registry=registry,
)

# Gauges
active_requests = Gauge(
    'active_requests',
    'Active requests',
    ['endpoint'],
    registry=registry,
)

cached_schemas = Gauge(
    'cached_schemas_count',
    'Number of cached schemas',
    registry=registry,
)


class MetricsMiddleware:
    """Middleware to track metrics"""
    
    @staticmethod
    def record_translate(duration_sec: float, database: str, success: bool):
        """Record translate request metrics"""
        translate_latency.observe(duration_sec)
        status = 'success' if success else 'failure'
        translate_requests.labels(database=database, status=status).inc()
    
    @staticmethod
    def record_execute(duration_sec: float, database: str, query_duration_ms: float, success: bool):
        """Record execute request metrics"""
        execute_latency.observe(duration_sec)
        execute_duration.observe(query_duration_ms)
        status = 'success' if success else 'failure'
        execute_requests.labels(database=database, status=status).inc()
    
    @staticmethod
    def record_validate(is_safe: bool):
        """Record validate request metrics"""
        result = 'safe' if is_safe else 'unsafe'
        validate_requests.labels(result=result).inc()
