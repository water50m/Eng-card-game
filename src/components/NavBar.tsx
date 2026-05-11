// english-card-game/src/components/NavBar.tsx
"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { ThemePicker } from "./ThemePicker"
import { useAuth } from "../hooks/useAuth"

const NAV = [
  { href:"/game",        label:"Game",       icon:"🃏" },
  { href:"/dashboard",   label:"Dashboard",  icon:"📊" },
  { href:"/vocabulary",  label:"Words",      icon:"📖" },
  { href:"/leaderboard", label:"Ranks",      icon:"🏆" },
  { href:"/my-words",    label:"Mine",       icon:"✏️" },
]

const ADMIN_NAV = [
  { href:"/admin",       label:"Admin",      icon:"🛡️" },
  { href:"/admin-vocab", label:"Vocab DB",   icon:"📚" },
  { href:"/theme-editor",label:"Themes",     icon:"🎨" },
]

export function NavBar() {
  const pathname = usePathname()
  const { user, logout } = useAuth(false)
  const allNav = user?.isAdmin ? [...NAV, ...ADMIN_NAV] : NAV

  return (
    <>
      {/* Desktop top bar */}
      <header style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"10px 24px", borderBottom:"1px solid var(--border-default)",
        background:"var(--bg-surface)", position:"sticky", top:0, zIndex:30,
      }}>
        <Link href="/game" style={{fontFamily:"var(--font-display)",fontSize:"18px",fontWeight:700,
          color:"var(--accent-primary)",textDecoration:"none",letterSpacing:"-0.02em"}}>
          🃏 English Card
        </Link>

        {/* Desktop links */}
        <nav style={{display:"flex",gap:"2px",alignItems:"center",overflowX:"auto"}}>
          {allNav.map(n=>{
            const active = pathname.startsWith(n.href)
            return (
              <Link key={n.href} href={n.href} style={{
                display:"flex",alignItems:"center",gap:"5px",padding:"6px 12px",
                borderRadius:"9999px",textDecoration:"none",fontSize:"13px",
                fontFamily:"var(--font-body)",fontWeight:active?600:400,
                color:active?"var(--accent-primary)":"var(--text-secondary)",
                background:active?"var(--bg-subtle)":"transparent",transition:"all 0.15s",
                whiteSpace:"nowrap",
              }}>
                <span style={{fontSize:"14px"}}>{n.icon}</span>
                <span className="hidden sm:inline">{n.label}</span>
              </Link>
            )
          })}
        </nav>

        <div style={{display:"flex",alignItems:"center",gap:"10px",flexShrink:0}}>
          {user && (
            <button onClick={logout} title="Logout" style={{
              display:"flex",alignItems:"center",gap:"5px",padding:"5px 10px",
              borderRadius:"9999px",border:"1px solid var(--border-default)",
              background:"transparent",color:"var(--text-secondary)",
              fontFamily:"var(--font-body)",fontSize:"12px",cursor:"pointer",
            }}>
              {user.emoji} {user.name}
            </button>
          )}
          <ThemePicker/>
        </div>
      </header>

      {/* Mobile bottom tab bar — show main 5 only */}
      <nav aria-label="Mobile navigation" style={{
        display:"grid", gridTemplateColumns:`repeat(${NAV.length},1fr)`,
        position:"fixed", bottom:0, left:0, right:0, zIndex:40,
        background:"var(--bg-surface)", borderTop:"1px solid var(--border-default)",
        padding:"6px 0 env(safe-area-inset-bottom)",
      }}>
        {NAV.map(n=>{
          const active = pathname.startsWith(n.href)
          return (
            <Link key={n.href} href={n.href} style={{
              display:"flex", flexDirection:"column", alignItems:"center",
              gap:"2px", padding:"4px 0", textDecoration:"none",
              color:active?"var(--accent-primary)":"var(--text-muted)",
              fontFamily:"var(--font-body)", fontSize:"9px", fontWeight:active?600:400,
              position:"relative",
            }}>
              {active && (
                <motion.div layoutId="tab-ind" style={{
                  position:"absolute",top:0,width:"28px",height:"2px",
                  borderRadius:"9999px",background:"var(--accent-primary)",
                }}/>
              )}
              <span style={{fontSize:"18px"}}>{n.icon}</span>
              {n.label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
