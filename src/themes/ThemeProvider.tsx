"use client"

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react"
import {
  Theme,
  THEMES,
  DEFAULT_THEME_ID,
  getThemeById,
  themeToCSSVars,
} from "./themes"

// ─── Context ────────────────────────────────────────────────
interface ThemeContextValue {
  theme: Theme
  allThemes: Theme[]
  setTheme: (id: string) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

// ─── Provider ───────────────────────────────────────────────
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState<string>(DEFAULT_THEME_ID)

  // Load saved theme from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ecg-theme-id")
      if (saved && THEMES.find(t => t.id === saved)) {
        setThemeId(saved)
      }
    } catch {
      // localStorage not available
    }
  }, [])

  const theme = getThemeById(themeId)

  // Apply CSS variables to :root whenever theme changes
  useEffect(() => {
    const root = document.documentElement
    const vars = themeToCSSVars(theme)
    Object.entries(vars).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })

    // Toggle dark class for Tailwind dark: variants
    if (theme.isDark) {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }

    // Inject Google Font
    const existingLink = document.getElementById("theme-font-link")
    if (existingLink) existingLink.remove()
    if (theme.fonts.googleImport) {
      const link = document.createElement("link")
      link.id = "theme-font-link"
      link.rel = "stylesheet"
      link.href = theme.fonts.googleImport
      document.head.appendChild(link)
    }

    // Inject extra CSS
    const existingStyle = document.getElementById("theme-extra-css")
    if (existingStyle) existingStyle.remove()
    if (theme.extraCSS) {
      const style = document.createElement("style")
      style.id = "theme-extra-css"
      style.textContent = theme.extraCSS
      document.head.appendChild(style)
    }
  }, [theme])

  const setTheme = useCallback((id: string) => {
    setThemeId(id)
    try {
      localStorage.setItem("ecg-theme-id", id)
    } catch {
      // ignore
    }
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, allThemes: THEMES, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// ─── Hook ────────────────────────────────────────────────────
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>")
  return ctx
}
