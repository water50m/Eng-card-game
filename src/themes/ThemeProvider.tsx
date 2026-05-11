// english-card-game/src/themes/ThemeProvider.tsx
"use client"
import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import {
  Theme, BUILTIN_THEMES, DEFAULT_THEME_ID,
  loadCustomThemes, getThemeById, themeToCSSVars,
} from "./themes"

interface ThemeContextValue {
  theme: Theme
  allThemes: Theme[]
  setTheme: (id: string) => void
  reloadCustomThemes: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId]       = useState<string>(DEFAULT_THEME_ID)
  const [customThemes, setCustom]   = useState<Theme[]>([])
  const [mounted, setMounted]       = useState(false)

  const reloadCustomThemes = useCallback(() => {
    setCustom(loadCustomThemes())
  }, [])

  // Only run on client — fixes hydration mismatch
  useEffect(() => {
    setMounted(true)
    reloadCustomThemes()
    try {
      const saved = localStorage.getItem("ecg-theme-id")
      const all = [...BUILTIN_THEMES, ...loadCustomThemes()]
      if (saved && all.find(t => t.id === saved)) setThemeId(saved)
    } catch {}
  }, [reloadCustomThemes])

  const theme = getThemeById(themeId, customThemes)
  const allThemes = [...BUILTIN_THEMES, ...customThemes]

  useEffect(() => {
    if (!mounted) return
    const root = document.documentElement
    Object.entries(themeToCSSVars(theme)).forEach(([k, v]) => root.style.setProperty(k, v))
    theme.isDark ? root.classList.add("dark") : root.classList.remove("dark")

    const old = document.getElementById("theme-font-link")
    if (old) old.remove()
    if (theme.fonts.googleImport) {
      const link = Object.assign(document.createElement("link"), {
        id: "theme-font-link", rel: "stylesheet", href: theme.fonts.googleImport,
      })
      document.head.appendChild(link)
    }

    const oldCSS = document.getElementById("theme-extra-css")
    if (oldCSS) oldCSS.remove()
    if (theme.extraCSS) {
      const style = Object.assign(document.createElement("style"), {
        id: "theme-extra-css", textContent: theme.extraCSS,
      })
      document.head.appendChild(style)
    }
  }, [theme, mounted])

  const setTheme = useCallback((id: string) => {
    setThemeId(id)
    try { localStorage.setItem("ecg-theme-id", id) } catch {}
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, allThemes, setTheme, reloadCustomThemes }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be inside <ThemeProvider>")
  return ctx
}
