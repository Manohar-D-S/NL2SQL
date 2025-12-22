'use client';

import { AlertTriangle, Wifi, Clock, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface APIErrorProps {
  error: Error | null;
  onRetry?: () => void;
  showDetails?: boolean;
}

export function APIErrorHandler({
  error,
  onRetry,
  showDetails = false,
}: APIErrorProps) {
  if (!error) return null;

  const errorMessage = error.message || 'Unknown error occurred';
  const isNetworkError = errorMessage.includes('Failed to fetch') || errorMessage.includes('Network');
  const isTimeoutError = errorMessage.includes('timeout') || errorMessage.includes('TIMEOUT');

  let icon = <AlertTriangle className="w-5 h-5" />;
  let title = 'Error';
  let description = errorMessage;

  if (isNetworkError) {
    icon = <Wifi className="w-5 h-5" />;
    title = 'Connection Error';
    description = 'Unable to reach the server. Check your connection and try again.';
  } else if (isTimeoutError) {
    icon = <Clock className="w-5 h-5" />;
    title = 'Request Timeout';
    description = 'The server took too long to respond. Please try again.';
  }

  return (
    <Card className="p-4 bg-destructive/10 border-destructive/50 space-y-3">
      <div className="flex gap-3">
        <div className="text-destructive flex-shrink-0 mt-0.5">{icon}</div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-destructive mb-1">{title}</h4>
          <p className="text-sm text-destructive/80">{description}</p>
          {showDetails && errorMessage !== description && (
            <p className="text-xs text-destructive/70 mt-2 font-mono">{errorMessage}</p>
          )}
        </div>
      </div>
      {onRetry && (
        <Button
          size="sm"
          variant="outline"
          onClick={onRetry}
          className="text-destructive hover:text-destructive"
        >
          Retry
        </Button>
      )}
    </Card>
  );
}
