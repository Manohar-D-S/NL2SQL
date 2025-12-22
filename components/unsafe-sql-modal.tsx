'use client';

import { AlertTriangle, Shield, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { SafetyCheckResult } from '@/lib/validators';

interface UnsafeSQLModalProps {
  open: boolean;
  sql: string;
  validationResult: SafetyCheckResult;
  onConfirm: () => void;
  onCancel: () => void;
}

export function UnsafeSQLModal({
  open,
  sql,
  validationResult,
  onConfirm,
  onCancel,
}: UnsafeSQLModalProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Unsafe SQL Detected
          </DialogTitle>
          <DialogDescription>
            This query has been flagged for safety concerns. Please review before proceeding.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Severity Badge */}
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <Badge className={`${getSeverityColor(validationResult.severity)} text-white`}>
              {validationResult.severity.toUpperCase()} SEVERITY
            </Badge>
          </div>

          {/* SQL Query Display */}
          <div className="bg-muted p-3 rounded border border-destructive/20">
            <p className="text-xs text-muted-foreground mb-2">QUERY:</p>
            <code className="text-xs font-mono text-destructive/80 block overflow-x-auto whitespace-pre-wrap break-words">
              {sql}
            </code>
          </div>

          {/* Warnings */}
          {validationResult.warnings.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Issues Found:
              </p>
              <ul className="space-y-1">
                {validationResult.warnings.map((warning, i) => (
                  <li key={i} className="text-sm text-foreground/80 flex gap-2">
                    <span className="text-destructive">•</span>
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Safety Tips */}
          <Card className="p-3 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-2">Safety Tips:</p>
            <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Always backup your database before running DDL/DML queries</li>
              <li>• Review the query carefully in a safe environment first</li>
              <li>• Test on a non-production database when possible</li>
              <li>• Verify that data loss is intentional before proceeding</li>
            </ul>
          </Card>

          {/* Confirmation Instructions */}
          <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded">
            <p className="text-xs font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
              Confirmation Required
            </p>
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              To execute this query, click "Run Anyway" below or add "CONFIRM" to your SQL.
            </p>
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Run Anyway (CONFIRM)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
