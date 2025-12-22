"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Activity, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useHistory, useAnalytics } from "@/hooks/use-schema"
import { useUIStore } from "@/lib/store"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"

const ROWS_PER_PAGE = 10

export default function HistoryPage() {
  const router = useRouter()
  const { selectedDatabase } = useUIStore()
  const { data: history, isLoading: historyLoading } = useHistory(selectedDatabase)
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics(selectedDatabase)

  const [currentPage, setCurrentPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredHistory = useMemo(() => {
    if (!history) return []
    return history.filter((item) => {
      const statusMatch = statusFilter === "all" || item.status === statusFilter
      const searchMatch =
        item.nlQuery.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.generatedSQL.toLowerCase().includes(searchQuery.toLowerCase())
      return statusMatch && searchMatch
    })
  }, [history, statusFilter, searchQuery])

  const paginatedHistory = useMemo(() => {
    return filteredHistory.slice(currentPage * ROWS_PER_PAGE, (currentPage + 1) * ROWS_PER_PAGE)
  }, [filteredHistory, currentPage])

  const totalPages = Math.ceil(filteredHistory.length / ROWS_PER_PAGE)

  const handleCopySQL = (sql: string) => {
    navigator.clipboard.writeText(sql)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-500/10 text-green-700 border-green-200"
      case "error":
        return "bg-red-500/10 text-red-700 border-red-200"
      default:
        return "bg-yellow-500/10 text-yellow-700 border-yellow-200"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Activity className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold">Query History & Analytics</h1>
              <p className="text-xs text-muted-foreground">{selectedDatabase}</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => router.push("/")}>
            Back to Workspace
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Analytics Cards */}
        {analyticsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        ) : analytics ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-xs text-muted-foreground mb-1">TOTAL QUERIES</div>
              <div className="text-2xl font-bold">{analytics.totalQueries}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground mb-1">AVG LATENCY</div>
              <div className="text-2xl font-bold">{analytics.averageLatency.toFixed(0)}ms</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground mb-1">ACCEPTANCE RATE</div>
              <div className="text-2xl font-bold">{(analytics.acceptanceRate * 100).toFixed(1)}%</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground mb-1">SUCCESS RATE</div>
              <div className="text-2xl font-bold">
                {analytics.totalQueries > 0
                  ? (((analytics.totalQueries * analytics.acceptanceRate) / analytics.totalQueries) * 100).toFixed(1)
                  : "0"}
                %
              </div>
            </Card>
          </div>
        ) : null}

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Query Frequency */}
          {analyticsLoading ? (
            <Skeleton className="h-80" />
          ) : analytics && analytics.queryFrequency.length > 0 ? (
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Query Frequency</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.queryFrequency}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--background)",
                      border: "1px solid var(--border)",
                      borderRadius: "4px",
                    }}
                  />
                  <Bar dataKey="count" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          ) : (
            <Card className="p-4 flex items-center justify-center h-80">
              <p className="text-muted-foreground">No query frequency data</p>
            </Card>
          )}

          {/* Latency Trend */}
          {analyticsLoading ? (
            <Skeleton className="h-80" />
          ) : analytics && analytics.latencyTrend.length > 0 ? (
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Latency Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.latencyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--background)",
                      border: "1px solid var(--border)",
                      borderRadius: "4px",
                    }}
                  />
                  <Line type="monotone" dataKey="latency" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          ) : (
            <Card className="p-4 flex items-center justify-center h-80">
              <p className="text-muted-foreground">No latency data</p>
            </Card>
          )}
        </div>

        {/* History Table */}
        <Card>
          <div className="p-4 border-b space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Query History</h3>
              <div className="text-xs text-muted-foreground">{filteredHistory.length} queries</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Input
                placeholder="Search queries..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(0)
                }}
                className="text-sm"
              />
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v)
                  setCurrentPage(0)
                }}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {historyLoading ? (
            <div className="divide-y">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="p-8 text-center">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-muted-foreground">No queries found</p>
            </div>
          ) : (
            <>
              <div className="divide-y overflow-x-auto">
                {paginatedHistory.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-accent/50 transition-colors">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                      {/* Status */}
                      <div className="md:col-span-1">
                        <Badge variant="outline" className={getStatusColor(item.status)}>
                          {item.status}
                        </Badge>
                      </div>

                      {/* NL Query */}
                      <div className="md:col-span-3">
                        <p className="text-xs text-muted-foreground mb-1">Natural Language</p>
                        <p className="text-sm line-clamp-2">{item.nlQuery}</p>
                      </div>

                      {/* Generated SQL */}
                      <div className="md:col-span-4">
                        <p className="text-xs text-muted-foreground mb-1">Generated SQL</p>
                        <div className="flex items-start gap-2">
                          <code className="text-xs font-mono bg-muted p-2 rounded flex-1 line-clamp-2">
                            {item.generatedSQL}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopySQL(item.generatedSQL)}
                            className="flex-shrink-0"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="md:col-span-2">
                        <p className="text-xs text-muted-foreground mb-1">Execution Time</p>
                        <p className="text-sm font-semibold">{item.executionTime}ms</p>
                      </div>

                      {/* Timestamp */}
                      <div className="md:col-span-2">
                        <p className="text-xs text-muted-foreground mb-1">Timestamp</p>
                        <p className="text-xs">
                          {new Date(item.timestamp).toLocaleDateString()} at{" "}
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-4 border-t flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    Page {currentPage + 1} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                      disabled={currentPage === 0}
                    >
                      Previous
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                      disabled={currentPage === totalPages - 1}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </main>
    </div>
  )
}
