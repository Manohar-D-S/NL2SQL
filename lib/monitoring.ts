interface ErrorLog {
  timestamp: string;
  error: string;
  stack?: string;
  context: Record<string, any>;
}

class ErrorMonitor {
  private logs: ErrorLog[] = [];
  private maxLogs = 100;

  logError(error: Error, context: Record<string, any> = {}) {
    const log: ErrorLog = {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      context,
    };

    this.logs.push(log);

    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      this.sendToTracker(log);
    }

    console.error('[ErrorMonitor]', log);
  }

  private sendToTracker(log: ErrorLog) {
    // Integration point for Sentry, LogRocket, etc.
    // Example: Sentry.captureException(log.error, { extra: log.context })
  }

  getLogs() {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }
}

export const errorMonitor = new ErrorMonitor();
