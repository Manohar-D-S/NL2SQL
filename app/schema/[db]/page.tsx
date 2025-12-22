'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Database, Table2, Key, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSchema } from '@/hooks/use-schema';
import { SchemaTable } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function SchemaPage() {
  const params = useParams();
  const router = useRouter();
  const database = (params.db as string) || 'default';
  const { data: schema, isLoading, error } = useSchema(database);
  const [selectedTable, setSelectedTable] = useState<SchemaTable | null>(null);

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Schema Explorer</h1>
              <p className="text-xs text-muted-foreground">{database}</p>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-6">
          <Card className="p-4 bg-destructive/10 border-destructive/50">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-destructive">Error Loading Schema</h3>
                <p className="text-sm text-destructive/80">
                  {error instanceof Error ? error.message : 'Failed to load database schema'}
                </p>
              </div>
            </div>
          </Card>
        </main>
      </div>
    );
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
            <Database className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold">Schema Explorer</h1>
              <p className="text-xs text-muted-foreground">{database}</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => router.push('/')}>
            Back to Workspace
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        ) : !schema ? (
          <Card className="p-8 text-center">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-muted-foreground">No schema data available</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tables List */}
            <div className="md:col-span-1">
              <h2 className="text-sm font-semibold mb-3 text-muted-foreground">TABLES ({schema.tables.length})</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {schema.tables.map((table) => (
                  <Card
                    key={table.name}
                    className={`p-3 cursor-pointer transition-all ${
                      selectedTable?.name === table.name
                        ? 'ring-2 ring-primary bg-accent'
                        : 'hover:bg-accent/50'
                    }`}
                    onClick={() => setSelectedTable(table)}
                  >
                    <div className="flex items-start gap-2">
                      <Table2 className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-sm font-semibold truncate">{table.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {table.columns.length} cols · {table.rowCount.toLocaleString()} rows
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Table Details */}
            <div className="md:col-span-2 space-y-4">
              {selectedTable ? (
                <>
                  {/* Columns Section */}
                  <Card className="overflow-hidden">
                    <div className="p-4 border-b bg-accent/50">
                      <h3 className="font-semibold">Columns</h3>
                    </div>
                    <div className="divide-y">
                      {selectedTable.columns.map((col) => (
                        <div key={col.name} className="p-3 hover:bg-accent/50">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <code className="text-sm font-mono font-semibold">{col.name}</code>
                                {col.isPrimary && (
                                  <Badge variant="default" className="text-xs">
                                    <Key className="w-3 h-3 mr-1" />
                                    PK
                                  </Badge>
                                )}
                                {col.isForeign && (
                                  <Badge variant="secondary" className="text-xs">
                                    FK
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground font-mono">
                                {col.type}
                              </p>
                              {col.references && (
                                <p className="text-xs text-primary/70 mt-1">
                                  → {col.references.table}.{col.references.column}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Indexes Section */}
                  {selectedTable.indexes.length > 0 && (
                    <Card className="overflow-hidden">
                      <div className="p-4 border-b bg-accent/50">
                        <h3 className="font-semibold">Indexes</h3>
                      </div>
                      <div className="divide-y">
                        {selectedTable.indexes.map((idx, i) => (
                          <div key={i} className="p-3">
                            <code className="text-sm font-mono">{idx}</code>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Metadata Section */}
                  <Card className="p-4">
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">TABLE NAME</p>
                        <code className="text-sm font-mono font-semibold">{selectedTable.name}</code>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">TOTAL ROWS</p>
                        <p className="font-semibold">{selectedTable.rowCount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">COLUMNS</p>
                        <p className="font-semibold">{selectedTable.columns.length}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">PRIMARY KEYS</p>
                        <p className="font-semibold">
                          {selectedTable.columns.filter((c) => c.isPrimary).length}
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* Sample Query */}
                  <Card className="p-4 bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-2 font-semibold">SAMPLE QUERY</p>
                    <code className="block text-xs font-mono bg-background p-2 rounded border">
                      SELECT * FROM {selectedTable.name} LIMIT 10;
                    </code>
                  </Card>
                </>
              ) : (
                <Card className="p-8 text-center">
                  <Table2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-muted-foreground">Select a table to view details</p>
                </Card>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
