# English Card Game 🃏

> Vocabulary learning platform — Next.js 16, TypeScript, Tailwind, Framer Motion, Chart.js

## Quick Start

```bash
cd english-card-game
npm install
npm run dev
# Open http://localhost:3000
```

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | **Next.js 16** (App Router, Turbopack) |
| Language | **TypeScript** (strict mode) |
| Styling | **Tailwind CSS v3** + CSS custom properties |
| Animation | **Framer Motion v11** |
| Charts | **Chart.js v4** + react-chartjs-2 |
| Responsive | Single codebase — no separate mobile app |

## Theme System

Add a new theme by editing **one file**: `src/themes/themes.ts`

See [HOW_TO_ADD_THEME.md](./HOW_TO_ADD_THEME.md) for full details.

Built-in themes: 🌙 Midnight Ink · 📄 Paper Light · ⚡ Neon Dojo · 🌸 Sakura · 🌊 Ocean Deep

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          Root layout + ThemeProvider
│   ├── globals.css         Base styles (colors come from CSS vars)
│   ├── page.tsx            Redirects to /game
│   └── game/
│       └── page.tsx        Main game page
├── themes/
│   ├── themes.ts           ← ADD NEW THEMES HERE (only file needed)
│   └── ThemeProvider.tsx   Context + CSS var injection
├── components/
│   ├── ThemePicker.tsx     Dropdown theme switcher
│   ├── GameStats.tsx       Session stats grid
│   └── ConfettiCanvas.tsx  Mastery celebration animation
├── types/
│   └── game.ts             TypeScript interfaces
├── lib/
│   └── gameLogic.ts        Mastery rules, XP calc, word selection
└── data/
    └── vocabulary.ts       50+ seed words (animals, food, colors, verbs…)
```

## Game Modes

| Mode | Description |
|------|-------------|
| **Multiple Choice** | 4 Thai translation options |
| **Think & Reveal** | Guess mentally, then self-assess |
| **Timed** | 15-second countdown per word |

## Mastery Rules

- 4 consecutive correct answers **AND** ≤ 10 total attempts → **MASTERED**
- OR accuracy ≥ 90% **AND** ≥ 5 attempts → **MASTERED**
- Wrong answer → streak resets to 0

## Scripts

```bash
npm run dev          # Dev server (Turbopack)
npm run build        # Production build
npm run type-check   # TypeScript check only
npm run lint         # ESLint
```
