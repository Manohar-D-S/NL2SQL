"use client"

import { useState, useCallback, useEffect } from "react"
import { AlertTriangle, Database } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { NLInputBar } from "@/components/nl-input-bar"
import { SQLEditor } from "@/components/sql-editor"
import { ExplanationPane } from "@/components/explanation-pane"
import { ExecutionResult } from "@/components/execution-result"
import { useUIStore } from "@/lib/store"
import { useExplain, useExecute, useValidate, useDebug } from "@/hooks/use-translate"
import type { SQLCandidate, ExplainResponse, ExecuteResponse } from "@/lib/types"

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
  const [isMounted, setIsMounted] = useState(false)

  const explain = useExplain()
  const execute = useExecute()
  const validate = useValidate()
  const debug = useDebug()

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
      } catch (error) {
        console.error("Execute error:", error)
      }
    },
    [execute, selectedDatabase],
  )

  const handleConfirmUnsafeSQL = useCallback(async () => {
    setUnsafeWarningOpen(false, "")
    await handleExecute(unsafeSQL)
  }, [unsafeSQL, handleExecute, setUnsafeWarningOpen])

  const handleDebug = useCallback(
    async (sql: string, errorMessage: string) => {
      try {
        const result = await debug.mutateAsync({
          sql,
          error: errorMessage,
          database: selectedDatabase,
        })
        if (result.fixedSql) {
          setSelectedSQL(result.fixedSql)
          // Clear the error by resetting execution result
          setExecutionResult(undefined)
        }
      } catch (error) {
        console.error("Debug error:", error)
      }
    },
    [debug, selectedDatabase, setSelectedSQL],
  )

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

            {/* Database Type Selector */}
            <nav className="flex items-center gap-3">
              <Select value={selectedDatabase} onValueChange={setSelectedDatabase}>
                <SelectTrigger className="w-36 h-9 glass border-border/50">
                  <SelectValue placeholder="Select DB Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sakila">SQL (MySQL)</SelectItem>
                  <SelectItem value="mongodb">NoSQL (MongoDB)</SelectItem>
                </SelectContent>
              </Select>
            </nav>
          </div>
        </div>
      </header>

      <main className="w-full h-[calc(100vh-73px)] overflow-hidden bg-background">
        <div className="h-full flex flex-col lg:flex-row">
          {/* Left Panel - Natural Language Input Only */}
          <div className="flex-1 lg:flex-none lg:w-[25%] overflow-y-auto panel flex flex-col min-h-[100px]">
            <div className="p-6 space-y-6 flex-1">
              {/* Input Section */}
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-primary" />
                  Natural Language Input
                </h2>
                <NLInputBar onTranslate={handleTranslate} />
              </div>
              {/* Explanation Section - Bottom */}
              <div className="flex-1 mt-15">
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
            </div>
          </div>

          {/* Middle Panel - Results */}
          <div className="flex-1 lg:flex-none lg:w-[40%] overflow-y-auto panel flex flex-col">
            <div className="p-6 flex-1 flex flex-col space-y-6">
              {/* Results Section - Top */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-primary" />
                    Results
                  </h2>
                  {selectedSQL && (
                    <Button
                      onClick={() => handleValidateAndRun(selectedSQL)}
                      disabled={execute.isPending}
                      size="sm"
                      className="gap-2"
                    >
                      <span>▶</span>
                      {execute.isPending ? 'Running...' : 'Run Query'}
                    </Button>
                  )}
                </div>
                <ExecutionResult
                  result={executionResult}
                  isLoading={execute.isPending}
                  error={execute.error?.message}
                  onDebug={execute.error ? () => handleDebug(selectedSQL, execute.error?.message || '') : undefined}
                  isDebugging={debug.isPending}
                />
              </div>
            </div>
          </div>

          {/* Right Panel - SQL Editor */}
          <div className="flex-1 overflow-y-auto flex flex-col gradient-subtle">
            <div className="p-6 flex-1 flex flex-col">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-primary" />
                SQL Editor
              </h2>
              <SQLEditor
                value={selectedSQL}
                onChange={setSelectedSQL}
                onRun={() => selectedSQL && handleValidateAndRun(selectedSQL)}
                isLoading={execute.isPending}
              />
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
