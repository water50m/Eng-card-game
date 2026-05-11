// english-card-game/src/hooks/useFontSize.ts
"use client"
import { useState, useEffect, useCallback } from "react"

export type FontSizeLevel = "sm" | "md" | "lg" | "xl"

const FONT_SIZE_MAP: Record<FontSizeLevel, { base: string; display: string; label: string }> = {
  sm: { base: "14px", display: "0.875rem", label: "เล็ก (S)" },
  md: { base: "16px", display: "1rem",     label: "ปกติ (M)" },
  lg: { base: "18px", display: "1.125rem", label: "ใหญ่ (L)" },
  xl: { base: "20px", display: "1.25rem",  label: "ใหญ่มาก (XL)" },
}

const FS_KEY = "ecg-font-size"

export function useFontSize() {
  const [level, setLevelState] = useState<FontSizeLevel>("md")
  const [mounted, setMounted]  = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem(FS_KEY) as FontSizeLevel | null
      if (saved && FONT_SIZE_MAP[saved]) setLevelState(saved)
    } catch {}
  }, [])

  useEffect(() => {
    if (!mounted) return
    const { base } = FONT_SIZE_MAP[level]
    document.documentElement.style.fontSize = base
    // scale card word size via CSS var
    document.documentElement.style.setProperty("--font-scale", FONT_SIZE_MAP[level].display)
  }, [level, mounted])

  const setLevel = useCallback((l: FontSizeLevel) => {
    setLevelState(l)
    try { localStorage.setItem(FS_KEY, l) } catch {}
  }, [])

  return { level, setLevel, levels: FONT_SIZE_MAP, mounted }
}

// Admin override: set font size for a specific user (stored per-user key)
export function setFontSizeForUser(userId: string, level: FontSizeLevel) {
  try { localStorage.setItem(`ecg-font-size-${userId}`, level) } catch {}
}

export function getFontSizeForUser(userId: string): FontSizeLevel {
  try {
    const v = localStorage.getItem(`ecg-font-size-${userId}`) as FontSizeLevel | null
    return v && FONT_SIZE_MAP[v] ? v : "md"
  } catch { return "md" }
}

export { FONT_SIZE_MAP }
