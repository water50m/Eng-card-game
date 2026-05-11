// english-card-game/src/components/FontSizeInit.tsx
"use client"
import { useEffect } from "react"

export function FontSizeInit() {
  useEffect(() => {
    // Apply saved font size on mount
    try {
      const saved = localStorage.getItem("ecg-font-size")
      const sizeMap: Record<string,string> = { sm:"14px", md:"16px", lg:"18px", xl:"20px" }
      if (saved && sizeMap[saved]) {
        document.documentElement.style.fontSize = sizeMap[saved]
        document.documentElement.style.setProperty("--font-scale", sizeMap[saved])
      }
    } catch {}
  }, [])
  return null
}
