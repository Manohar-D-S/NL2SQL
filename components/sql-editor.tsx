// SQL editor component using Monaco Editor

"use client"

import { useRef } from "react"
import { Copy, Play, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SQLEditorProps {
  value: string
  onChange: (value: string) => void
  onRun: () => void
  isLoading?: boolean
  warning?: boolean
}

export function SQLEditor({ value, onChange, onRun, isLoading = false, warning = false }: SQLEditorProps) {
  const editorRef = useRef<HTMLTextAreaElement>(null)

  const handleCopy = () => {
    navigator.clipboard.writeText(value)
  }

  return (
    <div className="card-premium h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">SQL Query</h3>
          {warning && (
            <div className="flex items-center gap-1 text-xs text-destructive bg-destructive/10 px-2 py-1 rounded-md">
              <AlertTriangle className="w-3 h-3" />
              Warning
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCopy} size="sm" variant="ghost" className="gap-1 text-xs hover:bg-muted/50">
            <Copy className="w-3 h-3" />
            Copy
          </Button>
          <Button
            onClick={onRun}
            disabled={!value.trim() || isLoading}
            size="sm"
            className="gap-1 text-xs bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            <Play className="w-3 h-3" />
            {isLoading ? "Running..." : "Run"}
          </Button>
        </div>
      </div>

      <textarea
        ref={editorRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="SELECT * FROM users WHERE id = 1;"
        className="flex-1 p-4 font-mono text-sm bg-muted/20 border-0 resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
      />
      <div className="text-xs text-muted-foreground p-3 border-t border-border/50 bg-muted/10">
        💡 Tip: Press Ctrl+Enter to run the query
      </div>
    </div>
  )
}
