import type { Metadata, Viewport } from "next"
import "./globals.css"
import { ThemeProvider } from "../themes/ThemeProvider"

export const metadata: Metadata = {
  title: "English Card Game",
  description: "Master English vocabulary with flashcards",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default" },
}

export const viewport: Viewport = {
  themeColor: "#0D0F1A",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
