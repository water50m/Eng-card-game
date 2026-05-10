// english-card-game/src/themes/themes.ts
// ═══════════════════════════════════════════════════════════
// THEME SYSTEM — Add a new theme by adding ONE entry here
// ═══════════════════════════════════════════════════════════
//
// Each theme defines:
//   id        — unique key used in localStorage
//   name      — display name in theme picker
//   emoji     — icon shown in picker
//   colors    — full design token set (CSS variables)
//   fonts     — Google Fonts import + font family names
//
// To add a new theme:
//   1. Copy an existing theme object below
//   2. Change id, name, emoji, colors, fonts
//   3. Done. No other files need to change.
//
// ═══════════════════════════════════════════════════════════

export interface ThemeColors {
  // Backgrounds
  bgBase: string        // page background
  bgSurface: string     // card / panel background
  bgElevated: string    // modal / popover background
  bgSubtle: string      // subtle tint (input, badge bg)

  // Borders
  borderDefault: string
  borderStrong: string

  // Text
  textPrimary: string
  textSecondary: string
  textMuted: string
  textOnAccent: string  // text on accent-colored bg

  // Accent (buttons, highlights, streaks)
  accentPrimary: string
  accentSecondary: string
  accentGlow: string    // box-shadow glow color (rgba)

  // Semantic
  success: string
  successBg: string
  danger: string
  dangerBg: string
  warning: string
  warningBg: string

  // Game-specific
  cardBg: string
  cardBorder: string
  optionBg: string
  optionHover: string
  optionCorrect: string
  optionWrong: string
  streakColor: string
  masteredColor: string
  xpColor: string
}

export interface ThemeFonts {
  googleImport: string   // full @import URL string
  display: string        // font-family for headings / cards
  body: string           // font-family for body text
  mono: string           // font-family for stats/numbers
}

export interface Theme {
  id: string
  name: string
  emoji: string
  isDark: boolean
  colors: ThemeColors
  fonts: ThemeFonts
  // Optional: custom CSS injected into :root
  extraCSS?: string
}

// ═══════════════════════════════════════════════════════════
// BUILT-IN THEMES
// ═══════════════════════════════════════════════════════════

export const THEMES: Theme[] = [

  // ─────────────────────────────────────────────
  // 1. MIDNIGHT INK  (dark, deep blue-black)
  // ─────────────────────────────────────────────
  {
    id: "midnight-ink",
    name: "Midnight Ink",
    emoji: "🌙",
    isDark: true,
    colors: {
      bgBase:          "#0D0F1A",
      bgSurface:       "#161928",
      bgElevated:      "#1E2236",
      bgSubtle:        "#252A42",

      borderDefault:   "#2D3354",
      borderStrong:    "#4A5280",

      textPrimary:     "#EEF0FF",
      textSecondary:   "#9AA3C8",
      textMuted:       "#5C6490",
      textOnAccent:    "#FFFFFF",

      accentPrimary:   "#7C6DFA",
      accentSecondary: "#A78BFA",
      accentGlow:      "rgba(124,109,250,0.35)",

      success:         "#34D399",
      successBg:       "#0D2E23",
      danger:          "#F87171",
      dangerBg:        "#2E1111",
      warning:         "#FBBF24",
      warningBg:       "#2E2100",

      cardBg:          "#1A1E32",
      cardBorder:      "#353A60",
      optionBg:        "#1E2236",
      optionHover:     "#252A46",
      optionCorrect:   "#0D2E23",
      optionWrong:     "#2E1111",
      streakColor:     "#FBBF24",
      masteredColor:   "#34D399",
      xpColor:         "#A78BFA",
    },
    fonts: {
      googleImport: "https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Outfit:wght@300;400;600;700&display=swap",
      display: "'Outfit', sans-serif",
      body:    "'Outfit', sans-serif",
      mono:    "'Space Mono', monospace",
    },
  },

  // ─────────────────────────────────────────────
  // 2. PAPER LIGHT  (light, warm cream)
  // ─────────────────────────────────────────────
  {
    id: "paper-light",
    name: "Paper Light",
    emoji: "📄",
    isDark: false,
    colors: {
      bgBase:          "#FAF8F3",
      bgSurface:       "#FFFFFF",
      bgElevated:      "#FFFFFF",
      bgSubtle:        "#F0EDE5",

      borderDefault:   "#E2DDD3",
      borderStrong:    "#C9C4B8",

      textPrimary:     "#1C1A16",
      textSecondary:   "#4A4640",
      textMuted:       "#9C9589",
      textOnAccent:    "#FFFFFF",

      accentPrimary:   "#B45309",
      accentSecondary: "#D97706",
      accentGlow:      "rgba(180,83,9,0.18)",

      success:         "#15803D",
      successBg:       "#F0FDF4",
      danger:          "#B91C1C",
      dangerBg:        "#FEF2F2",
      warning:         "#B45309",
      warningBg:       "#FFFBEB",

      cardBg:          "#FFFFFF",
      cardBorder:      "#E2DDD3",
      optionBg:        "#FAF8F3",
      optionHover:     "#F0EDE5",
      optionCorrect:   "#F0FDF4",
      optionWrong:     "#FEF2F2",
      streakColor:     "#D97706",
      masteredColor:   "#15803D",
      xpColor:         "#7C3AED",
    },
    fonts: {
      googleImport: "https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=Inter:wght@400;500;600&display=swap",
      display: "'Lora', Georgia, serif",
      body:    "'Inter', sans-serif",
      mono:    "'Inter', monospace",
    },
  },

  // ─────────────────────────────────────────────
  // 3. NEON DOJO  (dark, cyberpunk green)
  // ─────────────────────────────────────────────
  {
    id: "neon-dojo",
    name: "Neon Dojo",
    emoji: "⚡",
    isDark: true,
    colors: {
      bgBase:          "#050A05",
      bgSurface:       "#0A120A",
      bgElevated:      "#0F1A0F",
      bgSubtle:        "#142014",

      borderDefault:   "#1A3A1A",
      borderStrong:    "#225522",

      textPrimary:     "#CCFFCC",
      textSecondary:   "#7ABF7A",
      textMuted:       "#3A7A3A",
      textOnAccent:    "#020802",

      accentPrimary:   "#00FF41",
      accentSecondary: "#39FF14",
      accentGlow:      "rgba(0,255,65,0.4)",

      success:         "#00FF41",
      successBg:       "#002208",
      danger:          "#FF1744",
      dangerBg:        "#220008",
      warning:         "#FFEA00",
      warningBg:       "#221C00",

      cardBg:          "#0A120A",
      cardBorder:      "#1A3A1A",
      optionBg:        "#0D160D",
      optionHover:     "#112211",
      optionCorrect:   "#002208",
      optionWrong:     "#220008",
      streakColor:     "#FFEA00",
      masteredColor:   "#00FF41",
      xpColor:         "#00E5FF",
    },
    fonts: {
      googleImport: "https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Exo+2:wght@300;400;700;900&display=swap",
      display: "'Exo 2', sans-serif",
      body:    "'Exo 2', sans-serif",
      mono:    "'Share Tech Mono', monospace",
    },
    extraCSS: `
      * { letter-spacing: 0.02em; }
      h1, h2, h3 { text-transform: uppercase; letter-spacing: 0.08em; }
    `,
  },

  // ─────────────────────────────────────────────
  // 4. SAKURA  (light, Japanese pink)
  // ─────────────────────────────────────────────
  {
    id: "sakura",
    name: "Sakura",
    emoji: "🌸",
    isDark: false,
    colors: {
      bgBase:          "#FFF5F7",
      bgSurface:       "#FFFFFF",
      bgElevated:      "#FFFFFF",
      bgSubtle:        "#FFE8ED",

      borderDefault:   "#FBBDD0",
      borderStrong:    "#F48BB0",

      textPrimary:     "#2D1A22",
      textSecondary:   "#6D3A52",
      textMuted:       "#B08090",
      textOnAccent:    "#FFFFFF",

      accentPrimary:   "#E91E8C",
      accentSecondary: "#F06292",
      accentGlow:      "rgba(233,30,140,0.2)",

      success:         "#388E3C",
      successBg:       "#F1F8E9",
      danger:          "#D32F2F",
      dangerBg:        "#FFEBEE",
      warning:         "#F57C00",
      warningBg:       "#FFF8E1",

      cardBg:          "#FFFFFF",
      cardBorder:      "#FBBDD0",
      optionBg:        "#FFF5F7",
      optionHover:     "#FFE8ED",
      optionCorrect:   "#F1F8E9",
      optionWrong:     "#FFEBEE",
      streakColor:     "#F57C00",
      masteredColor:   "#388E3C",
      xpColor:         "#7B1FA2",
    },
    fonts: {
      googleImport: "https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;600&family=Nunito:wght@400;600;700&display=swap",
      display: "'Nunito', sans-serif",
      body:    "'Nunito', sans-serif",
      mono:    "'Nunito', monospace",
    },
  },

  // ─────────────────────────────────────────────
  // 5. OCEAN DEEP  (dark, teal/navy)
  // ─────────────────────────────────────────────
  {
    id: "ocean-deep",
    name: "Ocean Deep",
    emoji: "🌊",
    isDark: true,
    colors: {
      bgBase:          "#040E1A",
      bgSurface:       "#071828",
      bgElevated:      "#0B2238",
      bgSubtle:        "#0E2C47",

      borderDefault:   "#134063",
      borderStrong:    "#1E5F8E",

      textPrimary:     "#D0EEF8",
      textSecondary:   "#7BBDD8",
      textMuted:       "#3A7A9A",
      textOnAccent:    "#FFFFFF",

      accentPrimary:   "#00BCD4",
      accentSecondary: "#26C6DA",
      accentGlow:      "rgba(0,188,212,0.3)",

      success:         "#26A69A",
      successBg:       "#01201E",
      danger:          "#EF5350",
      dangerBg:        "#201010",
      warning:         "#FFA726",
      warningBg:       "#201500",

      cardBg:          "#071828",
      cardBorder:      "#134063",
      optionBg:        "#0B2238",
      optionHover:     "#0E2C47",
      optionCorrect:   "#01201E",
      optionWrong:     "#201010",
      streakColor:     "#FFA726",
      masteredColor:   "#26A69A",
      xpColor:         "#AB47BC",
    },
    fonts: {
      googleImport: "https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500;700&display=swap",
      display: "'DM Sans', sans-serif",
      body:    "'DM Sans', sans-serif",
      mono:    "'DM Mono', monospace",
    },
  },

  // ─────────────────────────────────────────────
  // ✨ ADD YOUR THEME HERE
  // Just copy the block above, change the values, done!
  // ─────────────────────────────────────────────

]

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

export const DEFAULT_THEME_ID = "midnight-ink"

export function getThemeById(id: string): Theme {
  return THEMES.find(t => t.id === id) ?? THEMES[0]
}

/** Convert a Theme into a flat CSS custom properties object */
export function themeToCSSVars(theme: Theme): Record<string, string> {
  const c = theme.colors
  const f = theme.fonts
  return {
    "--bg-base":           c.bgBase,
    "--bg-surface":        c.bgSurface,
    "--bg-elevated":       c.bgElevated,
    "--bg-subtle":         c.bgSubtle,

    "--border-default":    c.borderDefault,
    "--border-strong":     c.borderStrong,

    "--text-primary":      c.textPrimary,
    "--text-secondary":    c.textSecondary,
    "--text-muted":        c.textMuted,
    "--text-on-accent":    c.textOnAccent,

    "--accent-primary":    c.accentPrimary,
    "--accent-secondary":  c.accentSecondary,
    "--accent-glow":       c.accentGlow,

    "--color-success":     c.success,
    "--color-success-bg":  c.successBg,
    "--color-danger":      c.danger,
    "--color-danger-bg":   c.dangerBg,
    "--color-warning":     c.warning,
    "--color-warning-bg":  c.warningBg,

    "--card-bg":           c.cardBg,
    "--card-border":       c.cardBorder,
    "--option-bg":         c.optionBg,
    "--option-hover":      c.optionHover,
    "--option-correct":    c.optionCorrect,
    "--option-wrong":      c.optionWrong,
    "--streak-color":      c.streakColor,
    "--mastered-color":    c.masteredColor,
    "--xp-color":          c.xpColor,

    "--font-display":      f.display,
    "--font-body":         f.body,
    "--font-mono":         f.mono,
  }
}
