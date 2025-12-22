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

  // Translate natural language to SQL
  async translate(query: string, database: string): Promise<TranslateResponse> {
    try {
      console.log('[v0] Translate request:', { query, database });
      const response = await this.client.post('/translate', { natural_language: query, database });
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
    const response = await this.client.post('/explain', { sql });
    return response.data;
  }

  // Validate SQL for safety
  async validate(sql: string): Promise<ValidationResult> {
    const response = await this.client.post('/validate', { sql });
    return response.data;
  }

  // Execute SQL query
  async execute(sql: string, database: string): Promise<ExecuteResponse> {
    const response = await this.client.post('/execute', { sql, database });
    return response.data;
  }

  // Get optimization suggestions
  async optimize(sql: string, database: string): Promise<OptimizeResponse> {
    const response = await this.client.post('/optimize', { sql, database });
    return response.data;
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
