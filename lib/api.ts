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

      // Step 1: Fetch database schema from local MySQL server (skip for MongoDB - backend handles it)
      let schema_context = '';
      if (database !== 'mongodb') {
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
          // Continue without schema - model will do its best
        }
      } else {
        console.log('[v0] MongoDB mode - backend will fetch schema');
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

  // Execute SQL query on LOCAL MySQL server or MongoDB
  async execute(sql: string, database: string): Promise<ExecuteResponse> {
    try {
      // Check if MongoDB mode
      if (database === 'mongodb') {
        console.log('[v0] Executing MongoDB query:', { sql: sql.substring(0, 100) });

        // Parse the MongoDB query from the display format
        // The sql will be in format: db.collection.operation({...})
        // We need to extract and call the mongo/execute endpoint
        let queryObj;
        try {
          // Try to parse as JSON if it's already a query object
          queryObj = JSON.parse(sql);
        } catch {
          // If it's in display format, we need to extract the query
          // For now, return an error asking to use proper format
          console.log('[v0] MongoDB query is in display format, attempting to parse');

          // Extract collection and operation from display format
          const match = sql.match(/db\.(\w+)\.(\w+)\(([\s\S]*)\)$/);
          if (match) {
            const [, collection, operation, queryStr] = match;
            let query = {};

            // Try to parse the query content if not empty
            const trimmedQuery = queryStr.trim();
            if (trimmedQuery && trimmedQuery !== '{}') {
              try {
                // Clean up multi-line JSON
                const cleanedQuery = trimmedQuery.replace(/\n/g, '').replace(/\s+/g, ' ').trim();
                query = JSON.parse(cleanedQuery);
              } catch {
                console.error('[v0] Could not parse MongoDB query:', trimmedQuery);
                throw new Error('Could not parse MongoDB query. Invalid JSON format.');
              }
            }

            queryObj = { collection, operation, query };
          } else {
            console.error('[v0] Could not match MongoDB query format:', sql);
            throw new Error('Invalid MongoDB query format. Expected: db.collection.operation({...})');
          }
        }

        // Get the MongoDB database name from env or default
        const mongoDbName = process.env.NEXT_PUBLIC_MONGODB_DATABASE || 'sample_mflix';

        const response = await axios.post(
          `${API_CONFIG.sqlExecutionURL}/mongo/execute`,
          {
            database: mongoDbName,
            collection: queryObj.collection,
            operation: queryObj.operation,
            query: queryObj.query,
            options: queryObj.options || {}
          },
          { timeout: API_CONFIG.timeout }
        );
        console.log('[v0] MongoDB execution result:', response.data);
        return response.data;
      }

      // MySQL execution
      console.log('[v0] Executing SQL on LOCAL MySQL:', { sql: sql.substring(0, 100), database });
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

  // Debug and fix a failed SQL query
  async debug(sql: string, error: string, database: string): Promise<{
    fixedSql: string;
    originalSql: string;
    originalError: string;
    success: boolean;
  }> {
    try {
      console.log('[v0] Debug request:', { sql: sql.substring(0, 50), error: error.substring(0, 50) });
      const response = await this.client.post('/debug', { sql, error, database });
      console.log('[v0] Debug response:', response.data);
      return response.data;
    } catch (err) {
      const axiosError = err as AxiosError;
      console.error('[v0] Debug failed:', {
        message: axiosError.message,
        status: axiosError.response?.status,
      });
      throw new Error(`Failed to debug query: ${axiosError.message}`);
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
