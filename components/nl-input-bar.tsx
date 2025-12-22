// Natural language input component

"use client"

import { useState } from "react"
import { Mic, Send, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useUIStore } from "@/lib/store"
import { useTranslate } from "@/hooks/use-translate"

interface NLInputBarProps {
  onTranslate: (candidates: any[]) => void
}

export function NLInputBar({ onTranslate }: NLInputBarProps) {
  const { nlQuery, setNLQuery, setVoiceModalOpen, selectedDatabase } = useUIStore()
  const translate = useTranslate()
  const [isListening, setIsListening] = useState(false)

  const handleTranslate = async () => {
    if (!nlQuery.trim()) return

    try {
      console.log("[v0] Starting translation for database:", selectedDatabase)
      const result = await translate.mutateAsync({
        query: nlQuery,
        database: selectedDatabase,
      })
      console.log("[v0] Translation successful:", result)
      onTranslate(result.candidates)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      console.error("[v0] Translation error:", errorMessage)
      console.error("[v0] Full error:", error)
    }
  }

  const handleVoiceClick = () => {
    setVoiceModalOpen(true)
  }

  const handleClear = () => {
    setNLQuery("")
  }

  return (
    <div className="space-y-3">
      <Textarea
        value={nlQuery}
        onChange={(e) => setNLQuery(e.target.value)}
        placeholder="Ask anything in English, e.g., Show students scoring above 80"
        className="min-h-28 resize-none glass border-border/50 rounded-lg focus:border-primary/50 transition-all"
      />
      <div className="flex gap-2">
        <Button
          onClick={handleVoiceClick}
          variant="outline"
          size="sm"
          className="glass border-border/50 gap-2 hover:bg-muted/50 bg-transparent"
        >
          <Mic className="w-4 h-4" />
          Voice
        </Button>
        <Button
          onClick={handleTranslate}
          disabled={!nlQuery.trim() || translate.isPending}
          className="flex-1 gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all"
        >
          <Send className="w-4 h-4" />
          {translate.isPending ? "Translating..." : "Translate"}
        </Button>
        <Button
          onClick={handleClear}
          variant="outline"
          size="sm"
          className="glass border-border/50 gap-2 hover:bg-muted/50 bg-transparent"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      {translate.error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/50">
          Translation error: {translate.error instanceof Error ? translate.error.message : "Network Error"}
        </div>
      )}
    </div>
  )
}
