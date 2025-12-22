export class APIError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export function handleAPIError(error: unknown): string {
  if (error instanceof APIError) {
    return error.message;
  }

  if (error instanceof TypeError) {
    if (error.message.includes('Failed to fetch')) {
      return 'Network connection failed. Please check your internet connection.';
    }
    return 'An unexpected error occurred. Please try again.';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unknown error occurred';
}

export function isRetryableError(error: unknown): boolean {
  if (error instanceof APIError) {
    // Retry on 5xx errors and specific 4xx errors
    return error.status >= 500 || error.status === 429 || error.status === 408;
  }

  if (error instanceof TypeError) {
    return error.message.includes('Failed to fetch');
  }

  return false;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: unknown;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (!isRetryableError(error) || i === maxRetries - 1) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }

  throw lastError;
}
