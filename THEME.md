# How to Add a New Theme

> **TL;DR:** Edit ONE file → `src/themes/themes.ts`

---

## Step-by-step

### 1. Open `src/themes/themes.ts`

Scroll to the bottom of the `THEMES` array.  
You'll see a comment block that says:

```
// ✨ ADD YOUR THEME HERE
```

### 2. Add a new theme object

Copy this template and fill in the values:

```typescript
{
  id:     "my-theme",       // unique kebab-case ID
  name:   "My Theme",       // display name in the picker
  emoji:  "🎨",             // emoji shown in the picker
  isDark: true,             // true = dark bg, false = light bg

  colors: {
    // Backgrounds
    bgBase:          "#...",   // page background
    bgSurface:       "#...",   // cards / panels
    bgElevated:      "#...",   // modals / popovers
    bgSubtle:        "#...",   // inputs / badge backgrounds

    // Borders
    borderDefault:   "#...",
    borderStrong:    "#...",

    // Text
    textPrimary:     "#...",
    textSecondary:   "#...",
    textMuted:       "#...",
    textOnAccent:    "#fff",   // text ON top of accent-colored button

    // Accent (buttons, active states, streak glow)
    accentPrimary:   "#...",
    accentSecondary: "#...",
    accentGlow:      "rgba(r,g,b,0.3)",

    // Semantic
    success:         "#...",
    successBg:       "#...",
    danger:          "#...",
    dangerBg:        "#...",
    warning:         "#...",
    warningBg:       "#...",

    // Game-specific
    cardBg:          "#...",
    cardBorder:      "#...",
    optionBg:        "#...",     // answer option background
    optionHover:     "#...",
    optionCorrect:   "#...",     // green tint when answer is correct
    optionWrong:     "#...",     // red tint when answer is wrong
    streakColor:     "#...",     // flame / streak counter color
    masteredColor:   "#...",     // "mastered" badge color
    xpColor:         "#...",     // XP counter color
  },

  fonts: {
    // Full Google Fonts URL (or empty string if not using Google Fonts)
    googleImport: "https://fonts.googleapis.com/css2?family=YourFont:wght@400;700&display=swap",
    display: "'YourFont', sans-serif",    // headings / card words
    body:    "'YourFont', sans-serif",    // body text
    mono:    "'YourFont', monospace",     // numbers / stats
  },

  // Optional: raw CSS injected into the page for this theme
  extraCSS: `
    h1, h2 { letter-spacing: 0.05em; }
  `,
},
```

### 3. Done!

- Your theme appears in the **theme picker** dropdown immediately.
- No other files need to change.
- The theme is saved in `localStorage` — users' choice persists across sessions.

---

## Quick tips

| Goal | Which token |
|------|-------------|
| Change button / highlight color | `accentPrimary` |
| Change correct answer flash | `optionCorrect` + `color-success` |
| Change wrong answer flash | `optionWrong` + `color-danger` |
| Change streak fire color | `streakColor` |
| Change mastered badge color | `masteredColor` |
| Change XP counter color | `xpColor` |

## Built-in themes (for reference)

| ID | Name | Style |
|----|------|-------|
| `midnight-ink` | Midnight Ink 🌙 | Dark blue-black, purple accent |
| `paper-light`  | Paper Light 📄 | Warm cream, amber accent |
| `neon-dojo`    | Neon Dojo ⚡ | Dark cyberpunk, neon green |
| `sakura`       | Sakura 🌸 | Light pink, hot-pink accent |
| `ocean-deep`   | Ocean Deep 🌊 | Dark navy, teal accent |
