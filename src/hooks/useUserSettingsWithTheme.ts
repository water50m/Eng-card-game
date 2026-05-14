// english-card-game/src/hooks/useUserSettingsWithTheme.ts
"use client"
import { useState, useEffect, useCallback } from "react"
import { useAuth } from "./useAuth"
import { useUserSettings } from "./useUserSettings"
import { ThemeProvider } from "../themes/ThemeProvider"

export function useUserSettingsWithTheme() {
  const { user, ready } = useAuth()
  const { settings, setSettings, loading, mounted, fontSizes } = useUserSettings()
  const [themeId, setThemeId] = useState<string>('default')

  // Load theme from settings
  useEffect(() => {
    if (!mounted || !settings) return
    setThemeId(settings.theme)
  }, [mounted, settings])

  // Apply theme when it changes
  useEffect(() => {
    if (!mounted) return
    
    // Apply theme via localStorage (ThemeProvider will pick it up)
    localStorage.setItem("ecg-theme-id", themeId)
    
    // Trigger theme change event
    window.dispatchEvent(new CustomEvent('theme-change', { detail: themeId }))
  }, [themeId, mounted])

  const updateTheme = useCallback((newThemeId: string) => {
    setThemeId(newThemeId)
    setSettings({ theme: newThemeId })
  }, [setSettings])

  const updateFontSize = useCallback((fontSize: 'sm' | 'md' | 'lg' | 'xl') => {
    setSettings({ fontSize })
  }, [setSettings])

  const updatePreferredCategories = useCallback((preferredCategories: string[]) => {
    setSettings({ preferredCategories })
  }, [setSettings])

  return {
    themeId,
    settings,
    setTheme: updateTheme,
    setFontSize: updateFontSize,
    setPreferredCategories: updatePreferredCategories,
    loading,
    mounted,
    fontSizes
  }
}
