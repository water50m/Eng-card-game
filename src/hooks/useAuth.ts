// english-card-game/src/hooks/useAuth.ts
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export interface CurrentUser {
  name:    string
  emoji:   string
  isAdmin: boolean
}

export function useAuth(redirectIfLoggedOut = true) {
  const router = useRouter()
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const raw = localStorage.getItem("ecg-user")
    const token = localStorage.getItem("ecg-token")
    if (raw && token) {
      setUser(JSON.parse(raw))
    } else if (redirectIfLoggedOut) {
      router.push("/login")
    }
    setReady(true)
  }, [router, redirectIfLoggedOut])

  function logout() {
    localStorage.removeItem("ecg-token")
    localStorage.removeItem("ecg-user")
    router.push("/login")
  }

  return { user, ready, logout }
}
