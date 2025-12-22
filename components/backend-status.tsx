"use client"

import { useEffect, useState } from "react"
import { AlertCircle, CheckCircle2, Wifi, WifiOff } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { API_CONFIG, checkBackendHealth, isColabBackend } from "@/lib/api-config"

export function BackendStatus() {
    const [status, setStatus] = useState<{
        healthy: boolean
        checking: boolean
        message?: string
        device?: string
    }>({
        healthy: false,
        checking: true,
    })

    const checkHealth = async () => {
        setStatus((prev) => ({ ...prev, checking: true }))
        const result = await checkBackendHealth()
        setStatus({
            healthy: result.healthy,
            checking: false,
            message: result.message,
            device: result.device,
        })
    }

    useEffect(() => {
        // Check on mount
        checkHealth()

        // Check every 30 seconds
        const interval = setInterval(checkHealth, 30000)
        return () => clearInterval(interval)
    }, [])

    const backendType = isColabBackend() ? "Colab" : "Local"
    const backendUrl = API_CONFIG.baseURL

    if (status.checking && !status.healthy) {
        return (
            <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
                <Wifi className="h-4 w-4 text-yellow-600 animate-pulse" />
                <AlertDescription className="text-sm">
                    Connecting to backend...
                </AlertDescription>
            </Alert>
        )
    }

    if (!status.healthy) {
        return (
            <Alert variant="destructive">
                <WifiOff className="h-4 w-4" />
                <AlertDescription className="text-sm">
                    <div className="font-semibold mb-1">Backend Offline</div>
                    <div className="text-xs opacity-90 mb-2">{status.message || "Cannot connect to backend"}</div>
                    <div className="text-xs opacity-75">
                        Expected: <code className="bg-black/10 px-1 rounded">{backendUrl}</code>
                    </div>
                    {isColabBackend() && (
                        <div className="text-xs mt-2 opacity-90">
                            💡 Make sure your Colab notebook is running and ngrok URL is correct
                        </div>
                    )}
                </AlertDescription>
            </Alert>
        )
    }

    return (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-sm flex items-center justify-between">
                <div>
                    <span className="font-semibold text-green-900 dark:text-green-100">Backend Connected</span>
                    <div className="text-xs text-green-700 dark:text-green-300 mt-0.5 flex items-center gap-2">
                        <Badge variant="outline" className="text-xs border-green-300 bg-green-100 dark:bg-green-900">
                            {backendType}
                        </Badge>
                        {status.device && (
                            <Badge variant="outline" className="text-xs border-green-300 bg-green-100 dark:bg-green-900">
                                {status.device.toUpperCase()}
                            </Badge>
                        )}
                    </div>
                </div>
                <button
                    onClick={checkHealth}
                    className="text-xs text-green-700 dark:text-green-300 hover:underline"
                >
                    Refresh
                </button>
            </AlertDescription>
        </Alert>
    )
}
