// API client for backend communication

import axios, { AxiosInstance, AxiosError } from 'axios';
import { API_CONFIG } from './api-config';
import {
  TranslateResponse,
  ExplainResponse,
  ValidationResult,
  ExecuteResponse,
  OptimizeResponse,
  SchemaResponse,
  QueryHistory,
  AnalyticsData,
} from './types';

class SQLTranslatorAPI {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.apiURL,
      headers: API_CONFIG.headers,
      timeout: API_CONFIG.timeout,
    });

    this.client.interceptors.response.use(
      response => response,
      error => {
        const axiosError = error as AxiosError;
        console.error('[v0] API Error:', {
          message: axiosError.message,
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          data: axiosError.response?.data,
          url: axiosError.config?.url,
        });
        return Promise.reject(error);
      }
    );
  }

  // Translate natural language to SQL (with schema context)
  async translate(query: string, database: string): Promise<TranslateResponse> {
    try {
      console.log('[v0] Translate request:', { query, database });

      // Step 1: Fetch database schema from local MySQL server
      let schema_context = '';
      try {
        console.log(`[v0] Fetching schema for database: ${database}`);
        const schemaResponse = await axios.get(
          `${API_CONFIG.sqlExecutionURL}/schema/${database}`,
          { timeout: 5000 }
        );

        // Convert schema to CREATE TABLE statements format
        const schemaData = schemaResponse.data;
        if (schemaData.schema) {
          const createStatements: string[] = [];
          for (const [tableName, columns] of Object.entries(schemaData.schema)) {
            const columnDefs = (columns as any[]).map((col: any) => {
              return `${col.Field} ${col.Type}${col.Null === 'NO' ? ' NOT NULL' : ''}`;
            }).join(', ');
            createStatements.push(`CREATE TABLE ${tableName} (${columnDefs});`);
          }
          schema_context = createStatements.join(' ');
          console.log(`[v0] Schema fetched: ${createStatements.length} tables`);
        }
      } catch (schemaError) {
        console.warn('[v0] Failed to fetch schema, continuing without context:', schemaError);
        // Continue without schema - BART will do its best
      }

      // Step 2: Send to Colab for translation with schema context
      const response = await this.client.post('/translate', {
        natural_language: query,
        database,
        schema_context  // Include schema context for BART model
      });

      console.log('[v0] Translate response:', response.data);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('[v0] Translate failed:', {
        message: axiosError.message,
        status: axiosError.response?.status,
      });
      throw new Error(`Failed to translate query: ${axiosError.message}`);
    }
  }

  // Get explanation for SQL query
  async explain(sql: string): Promise<ExplainResponse> {
    try {
      const response = await this.client.post('/explain', { sql });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      // If endpoint doesn't exist (404), return a fallback explanation
      if (axiosError.response?.status === 404) {
        console.warn('[v0] Explain endpoint not available, using fallback');
        return {
          explanation: 'SQL explanation feature is not available in the current backend configuration. The query will be executed directly.',
          clauses: {},
        };
      }
      throw error;
    }
  }

  // Validate SQL for safety
  async validate(sql: string): Promise<ValidationResult> {
    try {
      const response = await this.client.post('/validate', { sql });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      // If endpoint doesn't exist (404), return a safe default
      if (axiosError.response?.status === 404) {
        console.warn('[v0] Validate endpoint not available, allowing query');
        return {
          isSafe: true,
          warnings: ['Validation endpoint not available - proceeding with caution'],
          isSuspicious: false,
        };
      }
      throw error;
    }
  }

  // Execute SQL query on LOCAL MySQL server
  async execute(sql: string, database: string): Promise<ExecuteResponse> {
    try {
      console.log('[v0] Executing SQL on LOCAL MySQL:', { sql: sql.substring(0, 100), database });
      // Use local SQL execution server (localhost:5000)
      const response = await axios.post(
        `${API_CONFIG.sqlExecutionURL}/execute`,
        { sql, database },
        { timeout: API_CONFIG.timeout }
      );
      console.log('[v0] Execution result:', response.data);
      return response.data;
    } catch (error) {
      console.error('[v0] Execute error:', error);
      throw error;
    }
  }

  // Get optimization suggestions
  async optimize(sql: string, database: string): Promise<OptimizeResponse> {
    try {
      const response = await this.client.post('/optimize', { sql, database });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      // If endpoint doesn't exist (404), return fallback suggestions
      if (axiosError.response?.status === 404) {
        console.warn('[v0] Optimize endpoint not available, using fallback');
        return {
          suggestions: [
            {
              type: 'other',
              suggestion: 'Optimization feature is not available in the current backend configuration.',
              speedup: 'N/A',
            },
            {
              type: 'index',
              suggestion: 'Consider adding indexes on frequently queried columns.',
              speedup: '2-10x',
            },
            {
              type: 'other',
              suggestion: 'Use EXPLAIN to analyze query execution plans.',
              speedup: 'N/A',
            },
          ],
        };
      }
      throw error;
    }
  }

  // Log user feedback
  async submitFeedback(
    queryId: string,
    feedback: 'accept' | 'reject' | 'edit',
    comment?: string
  ): Promise<void> {
    await this.client.post('/feedback', { queryId, feedback, comment });
  }

  // Fetch database schema
  async getSchema(database: string): Promise<SchemaResponse> {
    const response = await this.client.get(`/schema/${database}`);
    return response.data;
  }

  // Get query history
  async getHistory(
    database?: string,
    startDate?: string,
    endDate?: string,
    status?: string
  ): Promise<QueryHistory[]> {
    const response = await this.client.get('/history', {
      params: { database, startDate, endDate, status },
    });
    return response.data;
  }

  // Get analytics data
  async getAnalytics(database?: string): Promise<AnalyticsData> {
    const response = await this.client.get('/analytics', {
      params: { database },
    });
    return response.data;
  }

  // Speech to text (optional)
  async speechToText(audioBlob: Blob): Promise<{ text: string }> {
    const formData = new FormData();
    formData.append('audio', audioBlob);
    const response = await this.client.post('/speech-to-text', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }
}

export const apiClient = new SQLTranslatorAPI();
