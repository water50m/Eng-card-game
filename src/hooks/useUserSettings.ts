// english-card-game/src/hooks/useUserSettings.ts
"use client"
import { useState, useEffect, useCallback } from "react"
import { useAuth } from "./useAuth"

export type FontSizeLevel = "sm" | "md" | "lg" | "xl"

const FONT_SIZE_MAP: Record<FontSizeLevel, { base: string; display: string; label: string }> = {
  sm: { base: "14px", display: "0.875rem", label: "เล็ก (S)" },
  md: { base: "16px", display: "1rem",     label: "ปกติ (M)" },
  lg: { base: "18px", display: "1.125rem", label: "ใหญ่ (L)" },
  xl: { base: "20px", display: "1.25rem",  label: "ใหญ่มาก (XL)" },
}

export interface UserSettings {
  theme: string
  fontSize: FontSizeLevel
  preferredCategories: string[]
}

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'default',
  fontSize: 'md',
  preferredCategories: []
}

export function useUserSettings() {
  const { user, ready } = useAuth()
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Load settings from database
  useEffect(() => {
    if (!ready || !user) return
    
    setMounted(true)
    loadSettings()
  }, [ready, user])

  const loadSettings = useCallback(async () => {
    try {
      const token = localStorage.getItem('ecg-token')
      const response = await fetch('/api/user/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const dbSettings = await response.json()
        setSettings({
          theme: dbSettings.theme || DEFAULT_SETTINGS.theme,
          fontSize: dbSettings.font_size || DEFAULT_SETTINGS.fontSize,
          preferredCategories: dbSettings.preferred_categories || DEFAULT_SETTINGS.preferredCategories
        })
      }
    } catch (error) {
      console.log('Failed to load settings from database, using defaults')
    }
  }, [user])

  const saveSettings = useCallback(async (newSettings: Partial<UserSettings>) => {
    if (!user) return
    
    setLoading(true)
    try {
      const token = localStorage.getItem('ecg-token')
      const updatedSettings = { ...settings, ...newSettings }
      
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          theme: updatedSettings.theme,
          fontSize: updatedSettings.fontSize,
          preferredCategories: updatedSettings.preferredCategories
        })
      })
      
      if (response.ok) {
        setSettings(updatedSettings)
        
        // Apply theme and font size immediately
        if (newSettings.theme) {
          // Trigger theme change via ThemeProvider
          localStorage.setItem("ecg-theme-id", newSettings.theme)
          window.dispatchEvent(new CustomEvent('theme-change', { detail: newSettings.theme }))
        }
        
        if (newSettings.fontSize) {
          const { base } = FONT_SIZE_MAP[newSettings.fontSize]
          document.documentElement.style.fontSize = base
          document.documentElement.style.setProperty("--font-scale", FONT_SIZE_MAP[newSettings.fontSize].display)
        }
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
    } finally {
      setLoading(false)
    }
  }, [settings, user])

  // Apply font size on mount and change
  useEffect(() => {
    if (!mounted) return
    const { base, display } = FONT_SIZE_MAP[settings.fontSize]
    document.documentElement.style.fontSize = base
    document.documentElement.style.setProperty("--font-scale", display)
  }, [settings.fontSize, mounted])

  return { 
    settings, 
    setSettings: saveSettings, 
    loading, 
    mounted,
    fontSizes: FONT_SIZE_MAP 
  }
}
