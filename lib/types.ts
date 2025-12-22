// Type definitions for the NL-to-SQL translator

export interface SQLCandidate {
  id: string;
  sql: string;
  confidence: number;
  explanation?: string;
}

export interface TranslateResponse {
  candidates: SQLCandidate[];
  selectedIndex: number;
}

export interface ExplainResponse {
  explanation: string;
  clauses: {
    select?: string;
    from?: string;
    where?: string;
    groupBy?: string;
    orderBy?: string;
  };
}

export interface ValidationResult {
  isSafe: boolean;
  warnings: string[];
  isSuspicious: boolean;
}

export interface ExecuteResponse {
  success: boolean;
  rows: Record<string, any>[];
  rowCount: number;
  executionTime: number;
  error?: string;
}

export interface OptimizationSuggestion {
  type: 'index' | 'rewrite' | 'other';
  suggestion: string;
  speedup: string;
  code?: string;
}

export interface OptimizeResponse {
  suggestions: OptimizationSuggestion[];
}

export interface SchemaTable {
  name: string;
  columns: {
    name: string;
    type: string;
    isPrimary: boolean;
    isForeign: boolean;
    references?: {
      table: string;
      column: string;
    };
  }[];
  indexes: string[];
  rowCount: number;
}

export interface SchemaResponse {
  tables: SchemaTable[];
  metadata: {
    dbName: string;
    version: string;
  };
}

export interface QueryHistory {
  id: string;
  nlQuery: string;
  generatedSQL: string;
  status: 'success' | 'error' | 'pending';
  executionTime: number;
  timestamp: string;
  database: string;
  feedback?: 'accept' | 'reject' | 'edit';
}

export interface AnalyticsData {
  totalQueries: number;
  averageLatency: number;
  acceptanceRate: number;
  queryFrequency: Array<{ date: string; count: number }>;
  latencyTrend: Array<{ date: string; latency: number }>;
}
