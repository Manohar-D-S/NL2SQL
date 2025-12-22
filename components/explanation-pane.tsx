// Component showing SQL explanation

"use client"
import type { ExplainResponse } from "@/lib/types"
import { AlertCircle } from "lucide-react"

interface ExplanationPaneProps {
  explanation?: ExplainResponse
  isLoading: boolean
  error?: string
}

export function ExplanationPane({ explanation, isLoading, error }: ExplanationPaneProps) {
  if (error) {
    return (
      <div className="card-premium p-4 bg-destructive/5 border-destructive/50">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-destructive text-sm">Error</h4>
            <p className="text-xs text-destructive/80 mt-1">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="card-premium p-4 space-y-3">
        <div className="h-4 bg-muted/50 rounded-md w-3/4 animate-pulse" />
        <div className="h-4 bg-muted/50 rounded-md w-full animate-pulse" />
        <div className="h-4 bg-muted/50 rounded-md w-4/5 animate-pulse" />
      </div>
    )
  }

  if (!explanation) {
    return (
      <div className="card-premium p-6 text-center text-muted-foreground">
        <p className="text-sm">Select a query to see the explanation</p>
      </div>
    )
  }

  return (
    <div className="card-premium space-y-4 p-4">
      <div>
        <h3 className="font-semibold text-sm mb-2">Overview</h3>
        <p className="text-xs text-foreground/80 leading-relaxed">{explanation.explanation}</p>
      </div>

      <div className="space-y-2">
        <h4 className="font-semibold text-xs uppercase text-muted-foreground">Query Breakdown</h4>
        <div className="space-y-2">
          {explanation.clauses.select && (
            <div className="flex gap-2 items-start">
              <span className="font-mono text-xs bg-primary/10 px-2 py-1 rounded border border-primary/30 whitespace-nowrap">
                SELECT
              </span>
              <span className="text-xs text-foreground/70 break-words">{explanation.clauses.select}</span>
            </div>
          )}
          {explanation.clauses.from && (
            <div className="flex gap-2 items-start">
              <span className="font-mono text-xs bg-primary/10 px-2 py-1 rounded border border-primary/30 whitespace-nowrap">
                FROM
              </span>
              <span className="text-xs text-foreground/70 break-words">{explanation.clauses.from}</span>
            </div>
          )}
          {explanation.clauses.where && (
            <div className="flex gap-2 items-start">
              <span className="font-mono text-xs bg-primary/10 px-2 py-1 rounded border border-primary/30 whitespace-nowrap">
                WHERE
              </span>
              <span className="text-xs text-foreground/70 break-words">{explanation.clauses.where}</span>
            </div>
          )}
          {explanation.clauses.groupBy && (
            <div className="flex gap-2 items-start">
              <span className="font-mono text-xs bg-primary/10 px-2 py-1 rounded border border-primary/30 whitespace-nowrap">
                GROUP BY
              </span>
              <span className="text-xs text-foreground/70 break-words">{explanation.clauses.groupBy}</span>
            </div>
          )}
          {explanation.clauses.orderBy && (
            <div className="flex gap-2 items-start">
              <span className="font-mono text-xs bg-primary/10 px-2 py-1 rounded border border-primary/30 whitespace-nowrap">
                ORDER BY
              </span>
              <span className="text-xs text-foreground/70 break-words">{explanation.clauses.orderBy}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
