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

  return (
    <div className="space-y-2">
      {candidates.map((candidate, index) => (
        <div
          key={candidate.id}
          className={`cursor-pointer transition-all duration-200 card-premium ${
            selectedCandidateIndex === index
              ? "ring-2 ring-primary from-primary/20 to-primary/5"
              : "hover:from-card/90 hover:to-card/60"
          }`}
          onClick={() => onSelect(candidate.sql, index)}
        >
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="bg-secondary/80 text-secondary-foreground">
                Candidate {index + 1}
              </Badge>
              <Badge variant="outline" className="font-mono text-xs">
                {(candidate.confidence * 100).toFixed(0)}%
              </Badge>
            </div>
            <code className="block text-xs bg-muted/40 p-3 rounded-md font-mono overflow-x-auto border border-border/50 text-foreground/80">
              {candidate.sql.substring(0, 120)}
              {candidate.sql.length > 120 ? "..." : ""}
            </code>
            <div className="flex gap-2 justify-end">
              <Button
                onClick={(e) => {
                  e.stopPropagation()
                  onExplain(candidate.sql)
                }}
                size="sm"
                variant="ghost"
                className="gap-1 text-xs hover:bg-muted/50"
              >
                <Eye className="w-3 h-3" />
                Explain
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation()
                  onSelect(candidate.sql, index)
                }}
                size="sm"
                variant="ghost"
                className="gap-1 text-xs hover:bg-muted/50"
              >
                <Edit2 className="w-3 h-3" />
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation()
                  onRun(candidate.sql)
                }}
                size="sm"
                variant="ghost"
                className="gap-1 text-xs hover:bg-muted/50"
              >
                <Play className="w-3 h-3" />
                Run
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
