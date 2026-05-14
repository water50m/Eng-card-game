// english-card-game/src/hooks/useApiStatus.ts
"use client"
import { useState, useEffect, useCallback } from "react"

export interface ApiEndpoint {
  id:       string
  name:     string
  url:      string
  method:   "GET" | "POST"
  category: "database" | "dict" | "translation" | "tts"
  testPayload?: object
}

export interface ApiStatus {
  id:      string
  status:  "ok" | "error" | "checking" | "unknown"
  latency: number | null   // ms
  lastChecked: Date | null
  detail?: string
  error?:  string
}

type HealthResponse = {
  database?: {
    ok?: boolean
    name?: string | null
    user?: string | null
    error?: string
  }
}

export const API_ENDPOINTS: ApiEndpoint[] = [
  {
    id:       "database-health",
    name:     "App / Database",
    url:      "/api/health",
    method:   "GET",
    category: "database",
  },
  {
    id:       "mymemory",
    name:     "MyMemory Translation",
    url:      "https://api.mymemory.translated.net/get?q=hello&langpair=en|th",
    method:   "GET",
    category: "translation",
  },
  {
    id:       "datamuse",
    name:     "Datamuse (Word API)",
    url:      "https://api.datamuse.com/words?sp=cat&max=1",
    method:   "GET",
    category: "dict",
  },
  {
    id:       "free-dict",
    name:     "Free Dictionary API",
    url:      "https://api.dictionaryapi.dev/api/v2/entries/en/cat",
    method:   "GET",
    category: "dict",
  },
]

export function useApiStatus(autoCheck = false) {
  const [statuses, setStatuses] = useState<Record<string, ApiStatus>>({})
  const [checking, setChecking] = useState(false)

  const checkEndpoint = useCallback(async (ep: ApiEndpoint): Promise<ApiStatus> => {
    const start = Date.now()

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("ecg-token") : null
      const headers = ep.url.startsWith("/") && token
        ? { Authorization: `Bearer ${token}` }
        : undefined
      const res = await fetch(ep.url, {
        method: ep.method,
        headers,
        signal: AbortSignal.timeout(5000),
      })
      const latency = Date.now() - start
      let detail: string | undefined
      let error = res.ok ? undefined : `HTTP ${res.status}`

      if (ep.id === "database-health") {
        const data = await res.json().catch(() => null) as HealthResponse | null
        if (data?.database) {
          const dbName = data.database.name ?? "unknown"
          const dbUser = data.database.user ? ` (${data.database.user})` : ""
          detail = `DB: ${dbName}${dbUser}`
          error = data.database.ok === false
            ? data.database.error || error || "Database error"
            : error
        }
      }

      return {
        id: ep.id,
        status: res.ok ? "ok" : "error",
        latency,
        lastChecked: new Date(),
        detail,
        error,
      }
    } catch(e: unknown) {
      const message = e instanceof Error ? e.message : ""
      return {
        id: ep.id,
        status: "error",
        latency: null,
        lastChecked: new Date(),
        error: message.includes("timeout") ? "Timeout" : "Unreachable",
      }
    }
  }, [])

  const checkAll = useCallback(async () => {
    setChecking(true)
    const results: Record<string, ApiStatus> = {}

    await Promise.all(API_ENDPOINTS.map(async ep => {
      results[ep.id] = { id:ep.id, status:"checking", latency:null, lastChecked:null }
      setStatuses(prev => ({ ...prev, [ep.id]: results[ep.id] }))

      results[ep.id] = await checkEndpoint(ep)
      setStatuses(prev => ({ ...prev, [ep.id]: results[ep.id] }))
    }))

    setChecking(false)
  }, [checkEndpoint])

  const checkOne = useCallback(async (epId: string) => {
    const ep = API_ENDPOINTS.find(e => e.id === epId)
    if (!ep) return
    setStatuses(prev => ({ ...prev, [ep.id]: { id:ep.id, status:"checking", latency:null, lastChecked:null } }))
    const result = await checkEndpoint(ep)
    setStatuses(prev => ({ ...prev, [ep.id]: result }))
  }, [checkEndpoint])

  useEffect(() => {
    if (!autoCheck) return
    const timer = window.setTimeout(() => {
      void checkAll()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [autoCheck, checkAll])

  return { statuses, checking, checkAll, checkOne }
}
