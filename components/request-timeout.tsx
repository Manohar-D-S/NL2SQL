'use client';

import { Clock, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface RequestTimeoutProps {
  onRetry: () => void;
  estimatedTime?: number;
}

export function RequestTimeout({ onRetry, estimatedTime }: RequestTimeoutProps) {
  return (
    <Card className="p-4 bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800 space-y-3">
      <div className="flex gap-3">
        <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
            Request Taking Long
          </h4>
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Your query is still running. Large result sets may take time to process.
          </p>
          {estimatedTime && (
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
              Estimated time: ~{estimatedTime}s
            </p>
          )}
        </div>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={onRetry}
        className="flex items-center gap-2"
      >
        <RefreshCw className="w-3 h-3" />
        Check Status
      </Button>
    </Card>
  );
}
