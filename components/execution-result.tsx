// Component showing query execution results

"use client"

import { useState } from "react"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ExecuteResponse } from "@/lib/types"

interface ExecutionResultProps {
  result?: ExecuteResponse
  isLoading: boolean
  error?: string
  onDebug?: () => void
  isDebugging?: boolean
}

const ROWS_PER_PAGE = 10

export function ExecutionResult({ result, isLoading, error, onDebug, isDebugging }: ExecutionResultProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const [expandedRow, setExpandedRow] = useState<number | null>(null)

  const handleDownloadCSV = () => {
    if (!result?.rows) return

    const headers = Object.keys(result.rows[0] || {})
    const csv = [
      headers.join(","),
      ...result.rows.map((row) => headers.map((h) => JSON.stringify(row[h] ?? "")).join(",")),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "query_results.csv"
    a.click()
  }

  if (error) {
    return (
      <div className="card-modern p-4 bg-destructive/5 border-destructive/30 space-y-3">
        <h4 className="font-semibold text-destructive mb-1 text-sm">Execution Error</h4>
        <p className="text-xs text-destructive/80">{error}</p>
        {onDebug && (
          <Button
            onClick={onDebug}
            disabled={isDebugging}
            size="sm"
            variant="outline"
            className="gap-2 text-xs border-primary/50 text-primary hover:bg-primary/10"
          >
            {isDebugging ? 'Fixing...' : '🔧 Debug & Fix Query'}
          </Button>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="card-modern p-4 space-y-3">
        <div className="h-4 bg-secondary rounded-md w-1/3 animate-pulse" />
        <div className="h-24 bg-secondary rounded-md animate-pulse" />
      </div>
    )
  }

  if (!result) {
    return (
      <div className="card-modern p-8 text-center text-muted-foreground">
        <p className="text-sm">Execute a query to see results</p>
      </div>
    )
  }

  const headers = result.rows.length > 0 ? Object.keys(result.rows[0]) : []
  const paginatedRows = result.rows.slice(currentPage * ROWS_PER_PAGE, (currentPage + 1) * ROWS_PER_PAGE)
  const totalPages = Math.ceil(result.rows.length / ROWS_PER_PAGE)

  return (
    <div className="card-modern space-y-4 p-4 flex flex-col">
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h3 className="font-semibold text-sm">Query Results</h3>
          <p className="text-xs text-muted-foreground">
            {result.rowCount} rows • {result.executionTime}ms
          </p>
        </div>
        <Button
          onClick={handleDownloadCSV}
          size="sm"
          variant="outline"
          className="gap-2 text-xs border-border bg-secondary/50 hover:bg-secondary"
        >
          <Download className="w-3 h-3" />
          CSV
        </Button>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left p-2 font-mono font-semibold text-muted-foreground">#</th>
              {headers.map((h) => (
                <th key={h} className="text-left p-2 font-mono font-semibold text-muted-foreground whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row, idx) => (
              <tr
                key={currentPage * ROWS_PER_PAGE + idx}
                className="border-b border-border/30 hover:bg-muted/30 transition-colors"
              >
                <td className="p-2 text-muted-foreground font-mono text-xs">{currentPage * ROWS_PER_PAGE + idx + 1}</td>
                {headers.map((h) => (
                  <td
                    key={h}
                    className="p-2 max-w-xs truncate font-mono text-xs text-foreground/80"
                    title={JSON.stringify(row[h])}
                  >
                    {JSON.stringify(row[h])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <div className="text-xs text-muted-foreground">
            Page {currentPage + 1} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              size="sm"
              variant="outline"
              className="text-xs glass border-border/50"
            >
              Previous
            </Button>
            <Button
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage === totalPages - 1}
              size="sm"
              variant="outline"
              className="text-xs glass border-border/50"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
