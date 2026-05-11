// english-card-game/src/app/layout.tsx
import type { Metadata, Viewport } from "next"
import "./globals.css"
import { ThemeProvider } from "../themes/ThemeProvider"
import { FontSizeInit } from "../components/FontSizeInit"

export const metadata: Metadata = {
  title: "English Card Game",
  description: "Master English vocabulary with flashcards",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default" },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // Suppress hydration warning on html — ThemeProvider adds/removes "dark" class client-side
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Inline default CSS vars so first paint matches server render */}
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --bg-base:#0D0F1A;--bg-surface:#161928;--bg-elevated:#1E2236;--bg-subtle:#252A42;
            --border-default:#2D3354;--border-strong:#4A5280;
            --text-primary:#EEF0FF;--text-secondary:#9AA3C8;--text-muted:#5C6490;--text-on-accent:#FFFFFF;
            --accent-primary:#7C6DFA;--accent-secondary:#A78BFA;--accent-glow:rgba(124,109,250,0.35);
            --color-success:#34D399;--color-success-bg:#0D2E23;
            --color-danger:#F87171;--color-danger-bg:#2E1111;
            --color-warning:#FBBF24;--color-warning-bg:#2E2100;
            --card-bg:#1A1E32;--card-border:#353A60;
            --option-bg:#1E2236;--option-hover:#252A46;--option-correct:#0D2E23;--option-wrong:#2E1111;
            --streak-color:#FBBF24;--mastered-color:#34D399;--xp-color:#A78BFA;
            --font-display:"Outfit",sans-serif;--font-body:"Outfit",sans-serif;--font-mono:"Space Mono",monospace;
          }
        ` }}/>
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <FontSizeInit/>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
