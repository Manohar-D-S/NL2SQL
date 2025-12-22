// Component showing query optimization suggestions

"use client"

import { AlertCircle, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { OptimizationSuggestion } from "@/lib/types"

interface OptimizationSuggestionsProps {
  suggestions?: OptimizationSuggestion[]
  isLoading: boolean
  error?: string
}

export function OptimizationSuggestions({ suggestions, isLoading, error }: OptimizationSuggestionsProps) {
  if (error) {
    return (
      <div className="card-premium p-4 bg-destructive/5 border-destructive/50">
        <div className="flex gap-2">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-xs text-destructive/80">{error}</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="card-premium p-4 space-y-3">
        <div className="h-4 bg-muted/50 rounded-md w-1/2 animate-pulse" />
        <div className="h-20 bg-muted/50 rounded-md animate-pulse" />
      </div>
    )
  }

  if (!suggestions || suggestions.length === 0) {
    return (
      <div className="card-premium p-6 text-center text-muted-foreground">
        <Zap className="w-5 h-5 mx-auto mb-2 opacity-40" />
        <p className="text-sm">No optimization suggestions available</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {suggestions.map((sugg, idx) => (
        <div key={idx} className="card-premium p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={`text-xs font-semibold ${
                    sugg.type === "index"
                      ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                      : sugg.type === "rewrite"
                        ? "bg-green-500/10 text-green-400 border-green-500/30"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                  }`}
                >
                  {sugg.type.toUpperCase()}
                </Badge>
                <span className="text-xs font-semibold text-primary">~{sugg.speedup}x faster</span>
              </div>
              <p className="text-xs leading-relaxed text-foreground/80">{sugg.suggestion}</p>
            </div>
          </div>
          {sugg.code && (
            <code className="block text-xs bg-muted/40 p-3 rounded-md font-mono overflow-x-auto border border-border/50 text-foreground/70">
              {sugg.code}
            </code>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button size="sm" variant="ghost" disabled className="text-xs">
              Preview
            </Button>
            <Button size="sm" variant="ghost" disabled className="text-xs">
              Apply
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
