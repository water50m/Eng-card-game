// english-card-game/src/lib/api.ts
// src/lib/api.ts — Frontend API client

import type { VocabWord } from "@/types/game"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

type AuthUser = { id: string; name: string; emoji: string; isAdmin: boolean }
type DashboardData = Record<string, unknown>
type ProgressData = Record<string, unknown>
type MasteredWord = Record<string, unknown>
type LeaderboardEntry = Record<string, unknown>
type Achievement = Record<string, unknown>
type AdminUser = Record<string, unknown>
type AdminStats = Record<string, unknown>
type AdminSetting = Record<string, string>

function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("ecg-token")
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `API error ${res.status}`)
  }

  return res.json()
}

// ── Auth ──────────────────────────────────────────────────────
export const api = {
  auth: {
    login: (pin: string) =>
      request<{ token: string; user: AuthUser }>(
        "/api/auth/pin", { method: "POST", body: JSON.stringify({ pin }) }
      ),
    verify: () =>
      request<{ valid: boolean }>("/api/auth/verify", { method: "POST" }),
  },

  // ── Game ──────────────────────────────────────────────────
  game: {
    randomWord: (params?: { category?: string; difficulty?: string; excludeIds?: string[] }) => {
      const qs = new URLSearchParams()
      if (params?.category) qs.set("category", params.category)
      if (params?.difficulty) qs.set("difficulty", params.difficulty)
      if (params?.excludeIds?.length) qs.set("excludeIds", params.excludeIds.join(","))
      return request<{ word: VocabWord; options: string[] }>(`/api/game/vocabulary/random?${qs}`)
    },
    themes: () => request<{ category: string; count: number }[]>("/api/game/vocabulary/themes"),
    submitAnswer: (body: { wordId: string; correct: boolean; timeMs: number; sessionId?: string }) =>
      request<{ correct: boolean; isMastered: boolean; newStreak: number; xpEarned: number; accuracy: number }>(
        "/api/game/submit-answer", { method: "POST", body: JSON.stringify(body) }
      ),
    startSession: (mode: string) =>
      request<{ sessionId: string }>("/api/game/session/start", { method: "POST", body: JSON.stringify({ mode }) }),
    endSession: (id: string, body: { wordsCompleted: number; wordsMastered: number; xpEarned: number }) =>
      request(`/api/game/session/${id}/end`, { method: "POST", body: JSON.stringify(body) }),
  },

  // ── User ──────────────────────────────────────────────────
  user: {
    dashboard: () => request<DashboardData>("/api/user/dashboard"),
    progress:  () => request<ProgressData[]>("/api/user/progress"),
    mastered:  () => request<MasteredWord[]>("/api/user/mastered"),
  },

  // ── Vocabulary ────────────────────────────────────────────
  vocabulary: {
    list: (params?: { category?: string; difficulty?: string; search?: string }) => {
      const qs = new URLSearchParams()
      if (params?.category)   qs.set("category", params.category)
      if (params?.difficulty) qs.set("difficulty", params.difficulty)
      if (params?.search)     qs.set("search", params.search)
      return request<VocabWord[]>(`/api/vocabulary?${qs}`)
    },
    add: (word: { english: string; thai: string; phonetic?: string; example?: string; category?: string; difficulty?: number }) =>
      request<VocabWord>("/api/vocabulary", { method: "POST", body: JSON.stringify(word) }),
    delete: (id: string) =>
      request(`/api/vocabulary/${id}`, { method: "DELETE" }),
  },

  // ── Leaderboard ───────────────────────────────────────────
  leaderboard: {
    get: (limit = 20) => request<LeaderboardEntry[]>(`/api/leaderboard?limit=${limit}`),
  },

  // ── Achievements ──────────────────────────────────────────
  achievements: {
    list: () => request<Achievement[]>("/api/achievements"),
  },

  // ── Admin ─────────────────────────────────────────────────
  admin: {
    getSettings: () => request<AdminSetting>("/api/admin/settings"),
    updateSetting: (key: string, value: string) =>
      request("/api/admin/settings", { method: "PUT", body: JSON.stringify({ key, value }) }),
    listUsers: () => request<AdminUser[]>("/api/admin/users"),
    createUser: (body: { displayName: string; pin: string; emoji?: string; isAdmin?: boolean }) =>
      request<AdminUser>("/api/admin/users", { method: "POST", body: JSON.stringify(body) }),
    deleteUser: (userId: string) =>
      request(`/api/admin/users/${userId}`, { method: "DELETE" }),
    seedVocabulary: () =>
      request("/api/admin/seed-vocabulary", { method: "POST" }),
    stats: () => request<AdminStats>("/api/admin/stats"),
  },
}
