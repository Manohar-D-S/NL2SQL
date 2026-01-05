// Panel displaying SQL candidate queries

"use client"

import { AlertCircle, Eye, Edit2, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { SQLCandidate } from "@/lib/types"
import { useUIStore } from "@/lib/store"

interface CandidatesPanelProps {
  candidates: SQLCandidate[]
  onSelect: (sql: string, index: number) => void
  onExplain: (sql: string) => void
  onRun: (sql: string) => void
}

export function CandidatesPanel({ candidates, onSelect, onExplain, onRun }: CandidatesPanelProps) {
  const { selectedCandidateIndex } = useUIStore()

  if (candidates.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground glass rounded-lg border border-border/50 p-6">
        <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-40" />
        <p className="text-sm">No SQL candidates yet. Enter a natural language query to get started.</p>
      </div>
    )
  }

  // Get the selected candidate or first one
  const selectedCandidate = candidates[selectedCandidateIndex] || candidates[0];

  if (!selectedCandidate) {
    return (
      <div className="text-center py-12 text-muted-foreground glass rounded-lg border border-border/50 p-6">
        <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-40" />
        <p className="text-sm">No SQL candidates yet. Enter a natural language query to get started.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Selected SQL Query Card */}
      <div className="card-premium ring-2 ring-primary/50">
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-primary/20 text-primary font-semibold">
                Selected Query
              </Badge>
              <Badge variant="outline" className="font-mono text-xs bg-green-500/10 text-green-700 border-green-200">
                {(selectedCandidate.confidence * 100).toFixed(0)}% Confidence
              </Badge>
            </div>
            {candidates.length > 1 && (
              <span className="text-xs text-muted-foreground">
                {selectedCandidateIndex + 1} of {candidates.length}
              </span>
            )}
          </div>

          {/* Full SQL Query */}
          <div className="bg-muted/40 p-4 rounded-lg border border-border/50">
            <code className="block text-sm font-mono text-foreground whitespace-pre-wrap break-all">
              {selectedCandidate.sql}
            </code>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={() => onRun(selectedCandidate.sql)}
              className="flex-1 gap-2 bg-primary hover:bg-primary/90"
              size="lg"
            >
              <Play className="w-4 h-4" />
              Run Query
            </Button>
            <Button
              onClick={() => onExplain(selectedCandidate.sql)}
              variant="outline"
              size="lg"
              className="gap-2"
            >
              <Eye className="w-4 h-4" />
              Explain
            </Button>
          </div>
        </div>
      </div>

      {/* Alternative Candidates Selector (if multiple) */}
      {candidates.length > 1 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Alternative Queries ({candidates.length - 1})
          </div>
          <div className="space-y-2">
            {candidates.map((candidate, index) => {
              if (index === selectedCandidateIndex) return null;
              return (
                <button
                  key={`candidate-${candidate.id}-${index}`}
                  className="w-full text-left p-3 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-muted/20 transition-all"
                  onClick={() => onSelect(candidate.sql, index)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">Option {index + 1}</span>
                    <Badge variant="outline" className="text-xs">
                      {(candidate.confidence * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <code className="block text-xs font-mono text-foreground/60 line-clamp-2">
                    {candidate.sql}
                  </code>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  )
}
