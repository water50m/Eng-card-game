// english-card-game/src/hooks/useApiStatus.ts
"use client"
import { useState, useEffect, useCallback } from "react"

export interface ApiEndpoint {
  id:       string
  name:     string
  url:      string
  method:   "GET" | "POST"
  category: "backend" | "dict" | "translation" | "tts"
  testPayload?: object
}

export interface ApiStatus {
  id:      string
  status:  "ok" | "error" | "checking" | "unknown"
  latency: number | null   // ms
  lastChecked: Date | null
  error?:  string
}

export const API_ENDPOINTS: ApiEndpoint[] = [
  {
    id:       "backend-health",
    name:     "Backend API",
    url:      "http://localhost:3000/api/health",
    method:   "GET",
    category: "backend",
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

  const checkAll = useCallback(async () => {
    setChecking(true)
    const results: Record<string, ApiStatus> = {}

    await Promise.all(API_ENDPOINTS.map(async ep => {
      const start = Date.now()
      results[ep.id] = { id:ep.id, status:"checking", latency:null, lastChecked:null }
      setStatuses(prev => ({ ...prev, [ep.id]: results[ep.id] }))

      try {
        const res = await fetch(ep.url, {
          method: ep.method,
          signal: AbortSignal.timeout(5000),
        })
        const latency = Date.now() - start
        results[ep.id] = {
          id: ep.id,
          status: res.ok ? "ok" : "error",
          latency,
          lastChecked: new Date(),
          error: res.ok ? undefined : `HTTP ${res.status}`,
        }
      } catch(e: unknown) {
        const message = e instanceof Error ? e.message : ""
        results[ep.id] = {
          id: ep.id,
          status: "error",
          latency: null,
          lastChecked: new Date(),
          error: message.includes("timeout") ? "Timeout" : "Unreachable",
        }
      }
      setStatuses(prev => ({ ...prev, [ep.id]: results[ep.id] }))
    }))

    setChecking(false)
  }, [])

  const checkOne = useCallback(async (epId: string) => {
    const ep = API_ENDPOINTS.find(e => e.id === epId)
    if (!ep) return
    setStatuses(prev => ({ ...prev, [ep.id]: { id:ep.id, status:"checking", latency:null, lastChecked:null } }))
    const start = Date.now()
    try {
      const res = await fetch(ep.url, { signal: AbortSignal.timeout(5000) })
      setStatuses(prev => ({ ...prev, [ep.id]: {
        id:ep.id, status:res.ok?"ok":"error",
        latency:Date.now()-start, lastChecked:new Date(),
        error:res.ok?undefined:`HTTP ${res.status}`,
      }}))
    } catch(e: unknown) {
      const message = e instanceof Error ? e.message : ""
      setStatuses(prev => ({ ...prev, [ep.id]: {
        id:ep.id, status:"error", latency:null, lastChecked:new Date(),
        error:message.includes("timeout")?"Timeout":"Unreachable",
      }}))
    }
  }, [])

  useEffect(() => {
    if (!autoCheck) return
    const timer = window.setTimeout(() => {
      void checkAll()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [autoCheck, checkAll])

  return { statuses, checking, checkAll, checkOne }
}
