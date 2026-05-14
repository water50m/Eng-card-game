// english-card-game/src/hooks/useAuth.ts
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export interface CurrentUser {
  name:    string
  emoji:   string
  isAdmin: boolean
}

const VERIFY_TTL_MS = 5 * 60 * 1000
let verifiedToken: string | null = null
let verifiedAt = 0
let verifyInFlight: Promise<Response> | null = null

function shouldVerify(token: string) {
  return verifiedToken !== token || Date.now() - verifiedAt > VERIFY_TTL_MS
}

function verifyAuthToken(token: string) {
  if (!shouldVerify(token)) return Promise.resolve(null)
  if (!verifyInFlight) {
    verifyInFlight = fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(response => {
      if (response.ok) {
        verifiedToken = token
        verifiedAt = Date.now()
      }
      return response
    }).finally(() => {
      verifyInFlight = null
    })
  }
  return verifyInFlight
}

export function useAuth(redirectIfLoggedOut = true) {
  const router = useRouter()
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const raw = localStorage.getItem("ecg-user")
    const token = localStorage.getItem("ecg-token")
    
    if (raw && token) {
      const userData = JSON.parse(raw)
      
      // Check if token looks like a valid JWT (should be longer than 100 chars and have 3 parts)
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3 || token.length < 100) {
        localStorage.removeItem("ecg-token")
        localStorage.removeItem("ecg-user")
        if (redirectIfLoggedOut) {
          router.push("/login")
          return
        }
      }
      
      // First, set user from localStorage to prevent redirect loops
      setUser(userData)
      setReady(true)
      
      // Then verify token in background
      verifyAuthToken(token).then(response => {
        if (response && !response.ok) {
          localStorage.removeItem("ecg-token")
          localStorage.removeItem("ecg-user")
          verifiedToken = null
          verifiedAt = 0
          setUser(null)
          if (redirectIfLoggedOut) {
            router.push("/login")
          }
        }
      }).catch(error => {
        console.error('Auth verification network error:', error)
        // Don't auto-logout on network errors, just log
      })
    } else if (redirectIfLoggedOut) {
      router.push("/login")
    } else {
      setReady(true)
    }
  }, [router, redirectIfLoggedOut])

  function logout() {
    localStorage.removeItem("ecg-token")
    localStorage.removeItem("ecg-user")
    router.push("/login")
  }

  return { user, ready, logout }
}
