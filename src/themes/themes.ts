// english-card-game/src/themes/themes.ts
export interface ThemeColors {
  bgBase: string; bgSurface: string; bgElevated: string; bgSubtle: string
  borderDefault: string; borderStrong: string
  textPrimary: string; textSecondary: string; textMuted: string; textOnAccent: string
  accentPrimary: string; accentSecondary: string; accentGlow: string
  success: string; successBg: string; danger: string; dangerBg: string
  warning: string; warningBg: string
  cardBg: string; cardBorder: string
  optionBg: string; optionHover: string; optionCorrect: string; optionWrong: string
  streakColor: string; masteredColor: string; xpColor: string
  option0Bg?: string; option0Border?: string; option0Text?: string
  option1Bg?: string; option1Border?: string; option1Text?: string
  option2Bg?: string; option2Border?: string; option2Text?: string
  option3Bg?: string; option3Border?: string; option3Text?: string
}

export interface ThemeFonts {
  googleImport: string; display: string; body: string; mono: string
}

export interface Theme {
  id: string; name: string; emoji: string; isDark: boolean
  colors: ThemeColors; fonts: ThemeFonts; extraCSS?: string; isCustom?: boolean
}

export function getOptionStyle(theme: Theme, index: 0|1|2|3) {
  const c = theme.colors
  return {
    bg:     (c[`option${index}Bg`     as keyof ThemeColors] ?? c.optionBg) as string,
    border: (c[`option${index}Border` as keyof ThemeColors] ?? c.borderDefault) as string,
    text:   (c[`option${index}Text`   as keyof ThemeColors] ?? c.textPrimary) as string,
  }
}

export const BUILTIN_THEMES: Theme[] = [
  {
    id:"midnight-ink", name:"Midnight Ink", emoji:"🌙", isDark:true,
    colors:{
      bgBase:"#0D0F1A", bgSurface:"#161928", bgElevated:"#1E2236", bgSubtle:"#252A42",
      borderDefault:"#2D3354", borderStrong:"#4A5280",
      textPrimary:"#EEF0FF", textSecondary:"#9AA3C8", textMuted:"#5C6490", textOnAccent:"#FFFFFF",
      accentPrimary:"#7C6DFA", accentSecondary:"#A78BFA", accentGlow:"rgba(124,109,250,0.35)",
      success:"#34D399", successBg:"#0D2E23", danger:"#F87171", dangerBg:"#2E1111",
      warning:"#FBBF24", warningBg:"#2E2100",
      cardBg:"#1A1E32", cardBorder:"#353A60",
      optionBg:"#1E2236", optionHover:"#252A46", optionCorrect:"#0D2E23", optionWrong:"#2E1111",
      streakColor:"#FBBF24", masteredColor:"#34D399", xpColor:"#A78BFA",
    },
    fonts:{
      googleImport:"https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Outfit:wght@300;400;600;700&display=swap",
      display:"'Outfit', sans-serif", body:"'Outfit', sans-serif", mono:"'Space Mono', monospace",
    },
  },
  {
    id:"paper-light", name:"Paper Light", emoji:"📄", isDark:false,
    colors:{
      bgBase:"#FAF8F3", bgSurface:"#FFFFFF", bgElevated:"#FFFFFF", bgSubtle:"#F0EDE5",
      borderDefault:"#E2DDD3", borderStrong:"#C9C4B8",
      textPrimary:"#1C1A16", textSecondary:"#4A4640", textMuted:"#9C9589", textOnAccent:"#FFFFFF",
      accentPrimary:"#B45309", accentSecondary:"#D97706", accentGlow:"rgba(180,83,9,0.18)",
      success:"#15803D", successBg:"#F0FDF4", danger:"#B91C1C", dangerBg:"#FEF2F2",
      warning:"#B45309", warningBg:"#FFFBEB",
      cardBg:"#FFFFFF", cardBorder:"#E2DDD3",
      optionBg:"#FAF8F3", optionHover:"#F0EDE5", optionCorrect:"#F0FDF4", optionWrong:"#FEF2F2",
      streakColor:"#D97706", masteredColor:"#15803D", xpColor:"#7C3AED",
    },
    fonts:{
      googleImport:"https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=Inter:wght@400;500;600&display=swap",
      display:"'Lora', Georgia, serif", body:"'Inter', sans-serif", mono:"'Inter', monospace",
    },
  },
  {
    id:"neon-dojo", name:"Neon Dojo", emoji:"⚡", isDark:true,
    colors:{
      bgBase:"#050A05", bgSurface:"#0A120A", bgElevated:"#0F1A0F", bgSubtle:"#142014",
      borderDefault:"#1A3A1A", borderStrong:"#225522",
      textPrimary:"#CCFFCC", textSecondary:"#7ABF7A", textMuted:"#3A7A3A", textOnAccent:"#020802",
      accentPrimary:"#00FF41", accentSecondary:"#39FF14", accentGlow:"rgba(0,255,65,0.4)",
      success:"#00FF41", successBg:"#002208", danger:"#FF1744", dangerBg:"#220008",
      warning:"#FFEA00", warningBg:"#221C00",
      cardBg:"#0A120A", cardBorder:"#1A3A1A",
      optionBg:"#0D160D", optionHover:"#112211", optionCorrect:"#002208", optionWrong:"#220008",
      streakColor:"#FFEA00", masteredColor:"#00FF41", xpColor:"#00E5FF",
      option0Bg:"#0D1A16", option0Border:"#00BFA5", option0Text:"#64FFDA",
      option1Bg:"#0D160D", option1Border:"#00FF41", option1Text:"#CCFFCC",
      option2Bg:"#1A0D16", option2Border:"#E040FB", option2Text:"#F8BBD9",
      option3Bg:"#0D1A1A", option3Border:"#00E5FF", option3Text:"#B2EBF2",
    },
    fonts:{
      googleImport:"https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Exo+2:wght@300;400;700;900&display=swap",
      display:"'Exo 2', sans-serif", body:"'Exo 2', sans-serif", mono:"'Share Tech Mono', monospace",
    },
    extraCSS:"* { letter-spacing:0.02em; } h1,h2,h3 { text-transform:uppercase; letter-spacing:0.08em; }",
  },
  {
    id:"sakura", name:"Sakura", emoji:"🌸", isDark:false,
    colors:{
      bgBase:"#FFF5F7", bgSurface:"#FFFFFF", bgElevated:"#FFFFFF", bgSubtle:"#FFE8ED",
      borderDefault:"#FBBDD0", borderStrong:"#F48BB0",
      textPrimary:"#2D1A22", textSecondary:"#6D3A52", textMuted:"#B08090", textOnAccent:"#FFFFFF",
      accentPrimary:"#E91E8C", accentSecondary:"#F06292", accentGlow:"rgba(233,30,140,0.2)",
      success:"#388E3C", successBg:"#F1F8E9", danger:"#D32F2F", dangerBg:"#FFEBEE",
      warning:"#F57C00", warningBg:"#FFF8E1",
      cardBg:"#FFFFFF", cardBorder:"#FBBDD0",
      optionBg:"#FFF5F7", optionHover:"#FFE8ED", optionCorrect:"#F1F8E9", optionWrong:"#FFEBEE",
      streakColor:"#F57C00", masteredColor:"#388E3C", xpColor:"#7B1FA2",
      option0Bg:"#FFF0F5", option0Border:"#F48FB1", option0Text:"#880E4F",
      option1Bg:"#FCE4EC", option1Border:"#F06292", option1Text:"#AD1457",
      option2Bg:"#F3E5F5", option2Border:"#CE93D8", option2Text:"#6A1B9A",
      option3Bg:"#E8F5E9", option3Border:"#A5D6A7", option3Text:"#2E7D32",
    },
    fonts:{
      googleImport:"https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap",
      display:"'Nunito', sans-serif", body:"'Nunito', sans-serif", mono:"'Nunito', monospace",
    },
  },
  {
    id:"ocean-deep", name:"Ocean Deep", emoji:"🌊", isDark:true,
    colors:{
      bgBase:"#040E1A", bgSurface:"#071828", bgElevated:"#0B2238", bgSubtle:"#0E2C47",
      borderDefault:"#134063", borderStrong:"#1E5F8E",
      textPrimary:"#D0EEF8", textSecondary:"#7BBDD8", textMuted:"#3A7A9A", textOnAccent:"#FFFFFF",
      accentPrimary:"#00BCD4", accentSecondary:"#26C6DA", accentGlow:"rgba(0,188,212,0.3)",
      success:"#26A69A", successBg:"#01201E", danger:"#EF5350", dangerBg:"#201010",
      warning:"#FFA726", warningBg:"#201500",
      cardBg:"#071828", cardBorder:"#134063",
      optionBg:"#0B2238", optionHover:"#0E2C47", optionCorrect:"#01201E", optionWrong:"#201010",
      streakColor:"#FFA726", masteredColor:"#26A69A", xpColor:"#AB47BC",
    },
    fonts:{
      googleImport:"https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500;700&display=swap",
      display:"'DM Sans', sans-serif", body:"'DM Sans', sans-serif", mono:"'DM Mono', monospace",
    },
  },
  {
    id:"pastel-dream", name:"Pastel Dream", emoji:"🍬", isDark:false,
    colors:{
      bgBase:"#F8F6FF", bgSurface:"#FFFFFF", bgElevated:"#FFFFFF", bgSubtle:"#EEE9FF",
      borderDefault:"#DDD5F5", borderStrong:"#C4B5F0",
      textPrimary:"#2A1F4A", textSecondary:"#6B5B9A", textMuted:"#A899C8", textOnAccent:"#FFFFFF",
      accentPrimary:"#9B7FE8", accentSecondary:"#BBA4F5", accentGlow:"rgba(155,127,232,0.25)",
      success:"#4CAF50", successBg:"#F1FBF1", danger:"#E57373", dangerBg:"#FFF0F0",
      warning:"#FFB74D", warningBg:"#FFF8F0",
      cardBg:"#FFFFFF", cardBorder:"#DDD5F5",
      optionBg:"#F8F6FF", optionHover:"#EEE9FF", optionCorrect:"#F1FBF1", optionWrong:"#FFF0F0",
      streakColor:"#FF8A65", masteredColor:"#4CAF50", xpColor:"#9B7FE8",
      option0Bg:"#FFF0F8", option0Border:"#F8BBD9", option0Text:"#880E4F",
      option1Bg:"#FFF8E8", option1Border:"#FFE082", option1Text:"#E65100",
      option2Bg:"#F0F8FF", option2Border:"#90CAF9", option2Text:"#0D47A1",
      option3Bg:"#F0FFF4", option3Border:"#A5D6A7", option3Text:"#1B5E20",
    },
    fonts:{
      googleImport:"https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap",
      display:"'Quicksand', sans-serif", body:"'Quicksand', sans-serif", mono:"'Quicksand', monospace",
    },
  },
  {
    id:"forest-night", name:"Forest Night", emoji:"🌲", isDark:true,
    colors:{
      bgBase:"#0A120A", bgSurface:"#101A10", bgElevated:"#162016", bgSubtle:"#1C2A1C",
      borderDefault:"#2A3D2A", borderStrong:"#3D5C3D",
      textPrimary:"#D4EDDA", textSecondary:"#8FBC8F", textMuted:"#4A7A4A", textOnAccent:"#0A120A",
      accentPrimary:"#66BB6A", accentSecondary:"#81C784", accentGlow:"rgba(102,187,106,0.3)",
      success:"#66BB6A", successBg:"#0A1E0A", danger:"#EF9A9A", dangerBg:"#1E0A0A",
      warning:"#FFD54F", warningBg:"#1E1A0A",
      cardBg:"#101A10", cardBorder:"#2A3D2A",
      optionBg:"#131F13", optionHover:"#1C2A1C", optionCorrect:"#0A1E0A", optionWrong:"#1E0A0A",
      streakColor:"#FFD54F", masteredColor:"#66BB6A", xpColor:"#80CBC4",
      option0Bg:"#0F1E14", option0Border:"#2E7D32", option0Text:"#A5D6A7",
      option1Bg:"#141E10", option1Border:"#558B2F", option1Text:"#DCEDC8",
      option2Bg:"#1A1E0F", option2Border:"#9E9D24", option2Text:"#F9FBE7",
      option3Bg:"#0F1A1A", option3Border:"#00796B", option3Text:"#B2DFDB",
    },
    fonts:{
      googleImport:"https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;600;700&display=swap",
      display:"'Raleway', sans-serif", body:"'Raleway', sans-serif", mono:"'Raleway', monospace",
    },
  },
]

export const THEMES = BUILTIN_THEMES
export const DEFAULT_THEME_ID = "midnight-ink"

const CUSTOM_KEY = "ecg-custom-themes"

export function loadCustomThemes(): Theme[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(CUSTOM_KEY) ?? "[]") as Theme[] }
  catch { return [] }
}

export function saveCustomTheme(theme: Theme): void {
  const list = loadCustomThemes().filter(t => t.id !== theme.id)
  localStorage.setItem(CUSTOM_KEY, JSON.stringify([...list, { ...theme, isCustom: true }]))
}

export function deleteCustomTheme(id: string): void {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(loadCustomThemes().filter(t => t.id !== id)))
}

export function getThemeById(id: string, custom: Theme[] = []): Theme {
  return [...BUILTIN_THEMES, ...custom].find(t => t.id === id) ?? BUILTIN_THEMES[0]
}

export function themeToCSSVars(theme: Theme): Record<string, string> {
  const c = theme.colors; const f = theme.fonts
  return {
    "--bg-base":c.bgBase,"--bg-surface":c.bgSurface,"--bg-elevated":c.bgElevated,"--bg-subtle":c.bgSubtle,
    "--border-default":c.borderDefault,"--border-strong":c.borderStrong,
    "--text-primary":c.textPrimary,"--text-secondary":c.textSecondary,"--text-muted":c.textMuted,"--text-on-accent":c.textOnAccent,
    "--accent-primary":c.accentPrimary,"--accent-secondary":c.accentSecondary,"--accent-glow":c.accentGlow,
    "--color-success":c.success,"--color-success-bg":c.successBg,
    "--color-danger":c.danger,"--color-danger-bg":c.dangerBg,
    "--color-warning":c.warning,"--color-warning-bg":c.warningBg,
    "--card-bg":c.cardBg,"--card-border":c.cardBorder,
    "--option-bg":c.optionBg,"--option-hover":c.optionHover,"--option-correct":c.optionCorrect,"--option-wrong":c.optionWrong,
    "--streak-color":c.streakColor,"--mastered-color":c.masteredColor,"--xp-color":c.xpColor,
    "--font-display":f.display,"--font-body":f.body,"--font-mono":f.mono,
  }
}
