'use client';

import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface QueryConfirmationProps {
  open: boolean;
  query: string;
  estimatedRows?: number;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function QueryConfirmation({
  open,
  query,
  estimatedRows,
  onConfirm,
  onCancel,
  isLoading,
}: QueryConfirmationProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            Confirm Query Execution
          </DialogTitle>
          <DialogDescription>
            Review the query before execution. This action may modify data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted p-3 rounded border">
            <p className="text-xs text-muted-foreground mb-2">QUERY:</p>
            <code className="text-xs font-mono overflow-x-auto block whitespace-pre-wrap break-words">
              {query}
            </code>
          </div>

          {estimatedRows && (
            <Card className="p-3 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-900 dark:text-blue-100">
                <span className="font-semibold">Estimated Result:</span> {estimatedRows.toLocaleString()} rows
              </p>
            </Card>
          )}

          <Card className="p-3 bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
            <div className="flex gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                Make sure this is the query you want to run. This action cannot be undone.
              </p>
            </div>
          </Card>
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Executing...' : 'Execute Query'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
