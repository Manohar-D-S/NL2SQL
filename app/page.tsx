"use client"

import { useState, useCallback, useEffect } from "react"
import { AlertTriangle, Database, Settings, History, Book } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { NLInputBar } from "@/components/nl-input-bar"
import { CandidatesPanel } from "@/components/candidates-panel"
import { SQLEditor } from "@/components/sql-editor"
import { ExplanationPane } from "@/components/explanation-pane"
import { ExecutionResult } from "@/components/execution-result"
import { OptimizationSuggestions } from "@/components/optimization-suggestions"
import { FeedbackWidget } from "@/components/feedback-widget"
import { BackendStatus } from "@/components/backend-status"
import { useUIStore } from "@/lib/store"
import { useExplain, useExecute, useOptimize, useValidate } from "@/hooks/use-translate"
import type { SQLCandidate, ExplainResponse, ExecuteResponse, OptimizationSuggestion } from "@/lib/types"

export default function WorkspacePage() {
  const {
    selectedDatabase,
    setSelectedDatabase,
    selectedSQL,
    setSelectedSQL,
    setSelectedCandidateIndex,
    isUnsafeWarningOpen,
    setUnsafeWarningOpen,
    unsafeSQL,
  } = useUIStore()

  const [candidates, setCandidates] = useState<SQLCandidate[]>([])
  const [explanation, setExplanation] = useState<ExplainResponse>()
  const [executionResult, setExecutionResult] = useState<ExecuteResponse>()
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([])
  const [currentQueryId, setCurrentQueryId] = useState<string>("")
  const [activeTab, setActiveTab] = useState<"candidates" | "results" | "suggestions">("candidates")
  const [isMounted, setIsMounted] = useState(false)

  const explain = useExplain()
  const execute = useExecute()
  const optimize = useOptimize()
  const validate = useValidate()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleTranslate = useCallback(
    (newCandidates: SQLCandidate[]) => {
      setCandidates(newCandidates)
      if (newCandidates.length > 0) {
        setSelectedSQL(newCandidates[0].sql)
        setSelectedCandidateIndex(0)
      }
    },
    [setSelectedSQL, setSelectedCandidateIndex],
  )

  const handleSelectCandidate = useCallback(
    (sql: string, index: number) => {
      setSelectedSQL(sql)
      setSelectedCandidateIndex(index)
      setExplanation(undefined)
      setSuggestions([])
    },
    [setSelectedSQL, setSelectedCandidateIndex],
  )

  const handleExplain = useCallback(
    async (sql: string) => {
      try {
        const result = await explain.mutateAsync(sql)
        setExplanation(result)
      } catch (error) {
        console.error("Explain error:", error)
      }
    },
    [explain],
  )

  const handleValidateAndRun = useCallback(
    async (sql: string) => {
      try {
        const validation = await validate.mutateAsync(sql)

        if (!validation.isSafe && validation.warnings.length > 0) {
          setUnsafeWarningOpen(true, sql)
          return
        }

        await handleExecute(sql)
      } catch (error) {
        console.error("Validation error:", error)
      }
    },
    [validate, setUnsafeWarningOpen],
  )

  const handleExecute = useCallback(
    async (sql: string) => {
      try {
        const result = await execute.mutateAsync({
          sql,
          database: selectedDatabase,
        })
        setExecutionResult(result)
        setCurrentQueryId(`query-${Date.now()}`)
        setActiveTab("results")

        // Automatically fetch optimization suggestions after execution
        try {
          const opts = await optimize.mutateAsync({
            sql,
            database: selectedDatabase,
          })
          setSuggestions(opts.suggestions)
        } catch (e) {
          console.error("Optimize error:", e)
        }
      } catch (error) {
        console.error("Execute error:", error)
      }
    },
    [execute, optimize, selectedDatabase],
  )

  const handleConfirmUnsafeSQL = useCallback(async () => {
    setUnsafeWarningOpen(false, "")
    await handleExecute(unsafeSQL)
  }, [unsafeSQL, handleExecute, setUnsafeWarningOpen])

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/50 backdrop-blur-xl">
        <div className="max-w-full px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
                <Database className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">SQL Translator</h1>
                <p className="text-xs text-muted-foreground font-medium">Natural Language → SQL</p>
              </div>
            </div>

            {/* Navigation & Controls */}
            <nav className="flex items-center gap-3">
              <Select value={selectedDatabase} onValueChange={setSelectedDatabase}>
                <SelectTrigger className="w-40 h-9 glass border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default DB</SelectItem>
                  <SelectItem value="analytics">Analytics</SelectItem>
                  <SelectItem value="warehouse">Warehouse</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="ghost" size="sm" asChild className="gap-2 text-muted-foreground hover:text-foreground">
                <Link href="/schema/default">
                  <Book className="w-4 h-4" />
                  <span className="hidden sm:inline">Schema</span>
                </Link>
              </Button>

              <Button variant="ghost" size="sm" asChild className="gap-2 text-muted-foreground hover:text-foreground">
                <Link href="/history">
                  <History className="w-4 h-4" />
                  <span className="hidden sm:inline">History</span>
                </Link>
              </Button>

              <Button variant="ghost" size="sm" asChild className="gap-2 text-muted-foreground hover:text-foreground">
                <Link href="/settings">
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Settings</span>
                </Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="w-full h-[calc(100vh-73px)] overflow-hidden">
        <div className="h-full flex flex-col lg:flex-row gap-0">
          {/* Left Panel - Input & Candidates */}
          <div className="flex-1 lg:flex-none lg:w-[28%] overflow-y-auto border-r border-border/50 flex flex-col">
            <div className="p-6 space-y-6 flex-1">
              {/* Backend Status */}
              {isMounted && <BackendStatus />}

              {/* Input Section */}
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-primary" />
                  Natural Language Input
                </h2>
                <NLInputBar onTranslate={handleTranslate} />
              </div>

              {/* Candidates Section */}
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-primary" />
                  SQL Candidates
                </h2>
                <CandidatesPanel
                  candidates={candidates}
                  onSelect={handleSelectCandidate}
                  onExplain={handleExplain}
                  onRun={(sql) => handleValidateAndRun(sql)}
                />
              </div>
            </div>
          </div>

          {/* Middle Panel - SQL Editor */}
          <div className="flex-1 lg:flex-none lg:w-[36%] overflow-y-auto border-r border-border/50 flex flex-col">
            <div className="p-6 flex-1 flex flex-col">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-primary" />
                SQL Editor
              </h2>
              <SQLEditor
                value={selectedSQL}
                onChange={setSelectedSQL}
                onRun={() => handleValidateAndRun(selectedSQL)}
                isLoading={execute.isPending}
              />
            </div>
          </div>

          {/* Right Panel - Explanation, Results, Suggestions */}
          <div className="flex-1 overflow-y-auto flex flex-col">
            <div className="p-6 space-y-6 flex-1">
              {/* Mobile Tabs */}
              <div className="lg:hidden flex gap-2 -mx-6 px-6 pb-4 border-b border-border/50 overflow-x-auto">
                <Button
                  variant={activeTab === "candidates" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("candidates")}
                  className="whitespace-nowrap"
                >
                  Explanation
                </Button>
                <Button
                  variant={activeTab === "results" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("results")}
                  className="whitespace-nowrap"
                >
                  Results
                </Button>
                <Button
                  variant={activeTab === "suggestions" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("suggestions")}
                  className="whitespace-nowrap"
                >
                  Optimize
                </Button>
              </div>

              {/* Explanation Pane */}
              <div className="hidden lg:block">
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-primary" />
                  Explanation
                </h2>
                <ExplanationPane
                  explanation={explanation}
                  isLoading={explain.isPending}
                  error={explain.error?.message}
                />
              </div>
              <div className="lg:hidden" style={{ display: activeTab === "candidates" ? "block" : "none" }}>
                <ExplanationPane
                  explanation={explanation}
                  isLoading={explain.isPending}
                  error={explain.error?.message}
                />
              </div>

              {/* Results Pane */}
              <div className="hidden lg:block">
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-primary" />
                  Results
                </h2>
                <ExecutionResult
                  result={executionResult}
                  isLoading={execute.isPending}
                  error={execute.error?.message}
                />
              </div>
              <div className="lg:hidden" style={{ display: activeTab === "results" ? "block" : "none" }}>
                <ExecutionResult
                  result={executionResult}
                  isLoading={execute.isPending}
                  error={execute.error?.message}
                />
              </div>

              {/* Optimization Pane */}
              <div className="hidden lg:block">
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-primary" />
                  Optimization
                </h2>
                <OptimizationSuggestions
                  suggestions={suggestions}
                  isLoading={optimize.isPending}
                  error={optimize.error?.message}
                />
              </div>
              <div className="lg:hidden" style={{ display: activeTab === "suggestions" ? "block" : "none" }}>
                <OptimizationSuggestions
                  suggestions={suggestions}
                  isLoading={optimize.isPending}
                  error={optimize.error?.message}
                />
              </div>

              {/* Feedback Widget */}
              {currentQueryId && <FeedbackWidget queryId={currentQueryId} />}
            </div>
          </div>
        </div>
      </main>

      <Dialog open={isUnsafeWarningOpen} onOpenChange={(open) => setUnsafeWarningOpen(open, "")}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Unsafe SQL Detected
            </DialogTitle>
            <DialogDescription>
              This query contains potentially unsafe operations. Please review carefully before proceeding.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-destructive/10 p-3 rounded-lg border border-destructive/50 max-h-32 overflow-y-auto">
            <code className="text-xs font-mono text-destructive/80">{unsafeSQL}</code>
          </div>
          <div className="text-sm text-muted-foreground">
            To confirm execution, type "CONFIRM" in the query or click the button below.
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setUnsafeWarningOpen(false, "")}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmUnsafeSQL}>
              Run Anyway (CONFIRM)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
