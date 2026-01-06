/**
 * API Configuration
 * This file manages the backend API URL configuration
 */

// Backend API URL - Priority order:
// 1. Hard-coded Colab URL (temporary)
// 2. Environment variable (NEXT_PUBLIC_API_URL)
// 3. Local backend fallback
const getApiUrl = (): string => {
    // Node.js backend (with Cerebras Qwen 3 235B translation)
    // Run: cd backend/nodejs && node server.js
    return 'http://localhost:5000';

    // Colab ngrok URL (uncomment if using Colab)
    // return 'https://unpronouncing-kaylin-supersufficiently.ngrok-free.dev';

    // Original code (uncomment after .env.local works):
    // // Check for environment variable
    // if (process.env.NEXT_PUBLIC_API_URL) {
    //   return process.env.NEXT_PUBLIC_API_URL;
    // }
    //
    // // Development fallback
    // if (process.env.NODE_ENV === 'development') {
    //   return 'http://localhost:8000';
    // }
    //
    // // Production fallback (should be set via env var)
    // return 'http://localhost:8000';
};

export const API_CONFIG = {
    // Base URL without /api suffix
    baseURL: getApiUrl(),

    // Full API base URL with /api suffix
    apiURL: `${getApiUrl()}/api`,

    // SQL Execution URL (local MySQL server)
    // This runs on localhost:5000 for executing SQL queries
    sqlExecutionURL: 'http://localhost:5000/api',

    // Request timeout (30 seconds)
    timeout: 30000,

    // Default headers
    headers: {
        'Content-Type': 'application/json',
        // Skip ngrok browser warning (required for ngrok free tier)
        'ngrok-skip-browser-warning': 'true',
    },
} as const;

// Helper to check if using Colab backend
export const isColabBackend = (): boolean => {
    return API_CONFIG.baseURL.includes('ngrok');
};

// Helper to check if backend is reachable
export const checkBackendHealth = async (): Promise<{
    healthy: boolean;
    message?: string;
    modelLoaded?: boolean;
    device?: string;
}> => {
    try {
        const response = await fetch(`${API_CONFIG.apiURL}/health`, {
            method: 'GET',
            headers: API_CONFIG.headers,
        });

        if (response.ok) {
            const data = await response.json();
            return {
                healthy: true,
                ...data,
            };
        }

        return {
            healthy: false,
            message: `Backend returned status ${response.status}`,
        };
    } catch (error) {
        return {
            healthy: false,
            message: error instanceof Error ? error.message : 'Connection failed',
        };
    }
};

// Log configuration on startup (only in development)
if (process.env.NODE_ENV === 'development') {
    console.log('🔧 API Configuration:', {
        baseURL: API_CONFIG.baseURL,
        apiURL: API_CONFIG.apiURL,
        isColab: isColabBackend(),
        source: process.env.NEXT_PUBLIC_API_URL ? 'Environment Variable' : 'Default',
    });
}
