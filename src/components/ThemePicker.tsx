"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useState } from "react"
import { useTheme } from "../themes/ThemeProvider"

export function ThemePicker() {
  const { theme, allThemes, setTheme } = useTheme()
  const [open, setOpen] = useState(false)

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Choose theme"
        style={{
          display:        "flex",
          alignItems:     "center",
          gap:            "6px",
          padding:        "6px 12px",
          borderRadius:   "9999px",
          border:         "1px solid var(--border-default)",
          background:     "var(--bg-surface)",
          color:          "var(--text-secondary)",
          cursor:         "pointer",
          fontSize:       "13px",
          fontFamily:     "var(--font-body)",
          transition:     "border-color 0.2s",
        }}
      >
        <span style={{ fontSize: "16px" }}>{theme.emoji}</span>
        <span>{theme.name}</span>
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              style={{
                position: "fixed", inset: 0, zIndex: 40,
              }}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              style={{
                position:    "absolute",
                top:         "calc(100% + 8px)",
                right:       0,
                zIndex:      50,
                background:  "var(--bg-elevated)",
                border:      "1px solid var(--border-default)",
                borderRadius: "12px",
                padding:     "8px",
                minWidth:    "200px",
                boxShadow:   "0 8px 32px rgba(0,0,0,0.25)",
              }}
            >
              <p style={{
                fontSize: "11px",
                fontFamily: "var(--font-body)",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                padding: "4px 8px 8px",
                margin: 0,
              }}>
                Theme
              </p>
              {allThemes.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setTheme(t.id); setOpen(false) }}
                  style={{
                    display:      "flex",
                    alignItems:   "center",
                    gap:          "10px",
                    width:        "100%",
                    padding:      "8px 10px",
                    borderRadius: "8px",
                    border:       "none",
                    background:   t.id === theme.id ? "var(--bg-subtle)" : "transparent",
                    color:        t.id === theme.id ? "var(--accent-primary)" : "var(--text-primary)",
                    cursor:       "pointer",
                    fontFamily:   "var(--font-body)",
                    fontSize:     "14px",
                    textAlign:    "left",
                    transition:   "background 0.15s",
                  }}
                  onMouseEnter={e => {
                    if (t.id !== theme.id)
                      (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-subtle)"
                  }}
                  onMouseLeave={e => {
                    if (t.id !== theme.id)
                      (e.currentTarget as HTMLButtonElement).style.background = "transparent"
                  }}
                >
                  <span style={{ fontSize: "18px" }}>{t.emoji}</span>
                  <span style={{ flex: 1 }}>{t.name}</span>
                  {t.id === theme.id && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7l4 4 6-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
