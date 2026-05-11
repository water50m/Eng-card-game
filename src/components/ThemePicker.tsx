// english-card-game/src/components/ThemePicker.tsx
"use client"
import { AnimatePresence, motion } from "framer-motion"
import { useState } from "react"
import { useTheme } from "../themes/ThemeProvider"

export function ThemePicker() {
  const { theme, allThemes, setTheme } = useTheme()
  const [open, setOpen] = useState(false)

  const builtins = allThemes.filter(t => !t.isCustom)
  const customs  = allThemes.filter(t => t.isCustom)

  return (
    <div style={{ position:"relative" }}>
      <button onClick={() => setOpen(o => !o)} aria-label="Choose theme" style={{
        display:"flex", alignItems:"center", gap:"5px", padding:"5px 11px",
        borderRadius:"9999px", border:"1px solid var(--border-default)",
        background:"var(--bg-surface)", color:"var(--text-secondary)",
        cursor:"pointer", fontSize:"13px", fontFamily:"var(--font-body)", transition:"border-color 0.2s",
      }}>
        <span style={{fontSize:"15px"}}>{theme.emoji}</span>
        <span className="hidden sm:inline">{theme.name}</span>
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none"
          style={{transform:open?"rotate(180deg)":"none",transition:"transform 0.2s",flexShrink:0}}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              onClick={() => setOpen(false)}
              style={{position:"fixed",inset:0,zIndex:40}}/>
            <motion.div
              initial={{opacity:0,y:-8,scale:0.96}} animate={{opacity:1,y:0,scale:1}}
              exit={{opacity:0,y:-8,scale:0.96}}
              transition={{type:"spring",stiffness:400,damping:30}}
              style={{
                position:"absolute", top:"calc(100% + 8px)", right:0, zIndex:50,
                background:"var(--bg-elevated)", border:"1px solid var(--border-default)",
                borderRadius:"14px", padding:"8px", minWidth:"210px",
                boxShadow:"0 8px 32px rgba(0,0,0,0.25)", maxHeight:"70vh", overflowY:"auto",
              }}>
              {/* Built-in */}
              <p style={{fontSize:"10px",fontFamily:"var(--font-body)",color:"var(--text-muted)",
                textTransform:"uppercase",letterSpacing:"0.08em",padding:"4px 8px 6px",margin:0}}>
                Built-in
              </p>
              {builtins.map(t => (
                <ThemeRow key={t.id} t={t} active={t.id===theme.id}
                  onClick={()=>{setTheme(t.id);setOpen(false)}}/>
              ))}

              {/* Custom */}
              {customs.length > 0 && (
                <>
                  <div style={{height:"1px",background:"var(--border-default)",margin:"6px 8px"}}/>
                  <p style={{fontSize:"10px",fontFamily:"var(--font-body)",color:"var(--text-muted)",
                    textTransform:"uppercase",letterSpacing:"0.08em",padding:"4px 8px 6px",margin:0}}>
                    Custom ({customs.length})
                  </p>
                  {customs.map(t => (
                    <ThemeRow key={t.id} t={t} active={t.id===theme.id}
                      onClick={()=>{setTheme(t.id);setOpen(false)}}/>
                  ))}
                </>
              )}

              {/* Link to editor */}
              <div style={{height:"1px",background:"var(--border-default)",margin:"6px 8px"}}/>
              <a href="/theme-editor" onClick={()=>setOpen(false)} style={{
                display:"flex",alignItems:"center",gap:"8px",padding:"8px 10px",
                borderRadius:"8px",textDecoration:"none",
                color:"var(--accent-primary)",fontFamily:"var(--font-body)",fontSize:"13px",
              }}>
                <span>🎨</span> สร้าง theme ใหม่
              </a>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function ThemeRow({ t, active, onClick }:{ t:any; active:boolean; onClick:()=>void }) {
  return (
    <button onClick={onClick} style={{
      display:"flex", alignItems:"center", gap:"9px", width:"100%",
      padding:"7px 10px", borderRadius:"8px", border:"none",
      background:active?"var(--bg-subtle)":"transparent",
      color:active?"var(--accent-primary)":"var(--text-primary)",
      cursor:"pointer", fontFamily:"var(--font-body)", fontSize:"13px", textAlign:"left",
      transition:"background 0.12s",
    }}
    onMouseEnter={e=>{ if(!active)(e.currentTarget as HTMLButtonElement).style.background="var(--bg-subtle)" }}
    onMouseLeave={e=>{ if(!active)(e.currentTarget as HTMLButtonElement).style.background="transparent" }}
    >
      <span style={{fontSize:"16px"}}>{t.emoji}</span>
      <span style={{flex:1}}>{t.name}</span>
      {active && (
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
          <path d="M2 7l4 4 6-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </button>
  )
}
