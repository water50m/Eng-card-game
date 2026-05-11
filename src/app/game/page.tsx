// english-card-game/src/app/game/page.tsx
"use client"
import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  VocabWord, WordProgress, GameMode, MarkLevel,
  MARK_LABELS, MARK_ICONS, QUIZ_CATEGORIES, QUIZ_SIZES, QuizConfig,
} from "../../types/game"
import {
  QuizTemplate, DEFAULT_TEMPLATES, loadUserTemplates,
  saveUserTemplate, deleteUserTemplate,
} from "../../types/template"
import { SEED_VOCABULARY } from "../../data/vocabulary"
import { updateProgress, calcXP, buildOptions } from "../../lib/gameLogic"
import { NavBar } from "../../components/NavBar"
import { useTheme } from "../../themes/ThemeProvider"
import { ConfettiCanvas } from "../../components/ConfettiCanvas"
import { getOptionStyle } from "../../themes/themes"

// ─── constants ───────────────────────────────────────────────
const TIMED_SECONDS = 15
const MODES: { id:GameMode; label:string; emoji:string }[] = [
  {id:"multiple-choice",label:"Multiple Choice",emoji:"🔤"},
  {id:"think-reveal",   label:"Think & Reveal", emoji:"🧠"},
  {id:"timed",          label:"Timed",          emoji:"⏱️"},
  {id:"typing",         label:"Typing",         emoji:"⌨️"},
  {id:"invert",         label:"TH→EN Invert",   emoji:"🔄"},
]

// ─── tiny icons ───────────────────────────────────────────────
const Ico = {
  check:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>,
  x:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>,
  eye:  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  star: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>,
  flame:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 3z"/></svg>,
  cog:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  play: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>,
  save: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
}

// ─────────────────────────────────────────────────────────────
// QUIZ CONFIG MODAL
// ─────────────────────────────────────────────────────────────
function ConfigModal({ config, onChange, onUseNow, onSaveNew, onClose, isFirstWord }: {
  config: QuizConfig; onChange:(c:QuizConfig)=>void
  onUseNow:()=>void; onSaveNew:()=>void; onClose:()=>void; isFirstWord:boolean
}) {
  const pill=(active:boolean):React.CSSProperties=>({
    padding:"9px 5px",borderRadius:"11px",border:"1px solid",
    borderColor:active?"var(--accent-primary)":"var(--border-default)",
    background:active?"var(--accent-primary)":"var(--bg-subtle)",
    color:active?"var(--text-on-accent)":"var(--text-secondary)",
    fontFamily:"var(--font-body)",fontSize:"12px",cursor:"pointer",transition:"all 0.15s",
    display:"flex",flexDirection:"column" as const,alignItems:"center" as const,gap:"4px",
  })
  const sizeBtn=(active:boolean):React.CSSProperties=>({
    padding:"7px 14px",borderRadius:"9999px",border:"1px solid",
    borderColor:active?"var(--accent-primary)":"var(--border-default)",
    background:active?"var(--accent-primary)":"transparent",
    color:active?"var(--text-on-accent)":"var(--text-secondary)",
    fontFamily:"var(--font-mono)",fontSize:"13px",fontWeight:600,cursor:"pointer",transition:"all 0.15s",
  })
  const modeBtn=(active:boolean):React.CSSProperties=>({
    padding:"9px",borderRadius:"11px",border:"1px solid",
    borderColor:active?"var(--accent-primary)":"var(--border-default)",
    background:active?"var(--accent-primary)":"var(--bg-subtle)",
    color:active?"var(--text-on-accent)":"var(--text-secondary)",
    fontFamily:"var(--font-body)",fontSize:"12px",fontWeight:active?600:400,
    cursor:"pointer",transition:"all 0.15s",display:"flex",alignItems:"center" as const,gap:"5px",justifyContent:"center" as const,
  })

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}}
      onClick={onClose}>
      <motion.div initial={{scale:0.92,y:16}} animate={{scale:1,y:0}}
        onClick={e=>e.stopPropagation()}
        style={{background:"var(--bg-elevated)",border:"1px solid var(--border-default)",borderRadius:"20px",
          padding:"24px",width:"100%",maxWidth:"480px",maxHeight:"92vh",overflowY:"auto" as const}}>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px"}}>
          <h2 style={{fontFamily:"var(--font-display)",fontSize:"18px",fontWeight:700,color:"var(--text-primary)",margin:0}}>
            ⚙️ ตั้งค่า Quiz
          </h2>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-muted)",fontSize:"18px"}}>✕</button>
        </div>

        <Label>หมวดคำศัพท์</Label>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"7px",marginBottom:"18px"}}>
          {QUIZ_CATEGORIES.map(c=>(
            <button key={c.id} onClick={()=>onChange({...config,category:c.id})} style={pill(config.category===c.id)} title={c.desc}>
              <span style={{fontSize:"17px"}}>{c.emoji}</span>
              <span style={{textAlign:"center" as const,lineHeight:"1.3",fontWeight:config.category===c.id?600:400}}>{c.label}</span>
            </button>
          ))}
        </div>

        <Label>จำนวนคำ</Label>
        <div style={{display:"flex",gap:"7px",flexWrap:"wrap" as const,marginBottom:"18px"}}>
          {QUIZ_SIZES.map(n=><button key={n} onClick={()=>onChange({...config,size:n})} style={sizeBtn(config.size===n)}>{n}</button>)}
        </div>

        <Label>โหมดเกม</Label>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"7px",marginBottom:"18px"}}>
          {MODES.map(m=><button key={m.id} onClick={()=>onChange({...config,mode:m.id})} style={modeBtn(config.mode===m.id)}><span>{m.emoji}</span>{m.label}</button>)}
        </div>

        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"22px",
          padding:"11px 14px",borderRadius:"11px",border:"1px solid var(--border-default)",background:"var(--bg-subtle)"}}>
          <span style={{fontFamily:"var(--font-body)",fontSize:"13px",color:"var(--text-primary)"}}>💡 เปิดคำใบ้</span>
          <Toggle on={config.hintsEnabled} onToggle={()=>onChange({...config,hintsEnabled:!config.hintsEnabled})}/>
        </div>

        <div style={{display:"flex",gap:"9px",flexDirection:"column" as const}}>
          <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}} onClick={onUseNow}
            style={{width:"100%",padding:"13px",borderRadius:"12px",border:"none",
              background:"var(--accent-primary)",color:"var(--text-on-accent)",
              fontFamily:"var(--font-body)",fontSize:"14px",fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center" as const,justifyContent:"center" as const,gap:"6px"}}>
            {Ico.play} ใช้การตั้งค่านี้ (Round นี้เท่านั้น)
          </motion.button>
          {isFirstWord && (
            <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}} onClick={onSaveNew}
              style={{width:"100%",padding:"13px",borderRadius:"12px",
                border:"1px solid var(--accent-primary)",background:"transparent",
                color:"var(--accent-primary)",fontFamily:"var(--font-body)",fontSize:"14px",fontWeight:600,
                cursor:"pointer",display:"flex",alignItems:"center" as const,justifyContent:"center" as const,gap:"6px"}}>
              {Ico.save} บันทึกเป็น Template ใหม่
            </motion.button>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────
// SAVE TEMPLATE POPUP
// ─────────────────────────────────────────────────────────────
function SaveTemplatePopup({ config, onSave, onCancel }:{
  config:QuizConfig; onSave:(name:string,emoji:string,restartNow:boolean)=>void; onCancel:()=>void
}) {
  const [name,setName] = useState("")
  const [emoji,setEmoji] = useState("⭐")
  const inp: React.CSSProperties = {
    width:"100%",padding:"10px 12px",borderRadius:"10px",
    border:"1px solid var(--border-default)",background:"var(--bg-elevated)",
    color:"var(--text-primary)",fontFamily:"var(--font-body)",fontSize:"14px",
    outline:"none",boxSizing:"border-box" as const,
  }
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}}>
      <motion.div initial={{scale:0.9,y:20}} animate={{scale:1,y:0}}
        style={{background:"var(--bg-elevated)",border:"1px solid var(--border-default)",borderRadius:"18px",padding:"24px",width:"100%",maxWidth:"360px"}}>
        <h3 style={{fontFamily:"var(--font-display)",fontSize:"18px",fontWeight:700,color:"var(--text-primary)",margin:"0 0 18px"}}>
          💾 บันทึก Template ใหม่
        </h3>
        <div style={{display:"flex",gap:"10px",marginBottom:"12px"}}>
          <input value={emoji} onChange={e=>setEmoji(e.target.value)} maxLength={2}
            style={{...inp,width:"60px",textAlign:"center" as const,fontSize:"20px"}}/>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="ชื่อ template..."
            style={inp} autoFocus/>
        </div>
        <p style={{fontFamily:"var(--font-body)",fontSize:"12px",color:"var(--text-muted)",margin:"0 0 18px"}}>
          เริ่ม round ด้วย template ใหม่นี้เลยไหม?
        </p>
        <div style={{display:"flex",gap:"8px"}}>
          <button onClick={onCancel} style={{flex:1,padding:"11px",borderRadius:"10px",border:"1px solid var(--border-default)",background:"transparent",color:"var(--text-secondary)",fontFamily:"var(--font-body)",fontSize:"13px",cursor:"pointer"}}>ยกเลิก</button>
          <button onClick={()=>onSave(name||"My Template",emoji,false)}
            style={{flex:1,padding:"11px",borderRadius:"10px",border:"1px solid var(--border-default)",background:"var(--bg-subtle)",color:"var(--text-primary)",fontFamily:"var(--font-body)",fontSize:"13px",cursor:"pointer"}}>
            บันทึก (ไม่ restart)
          </button>
          <button onClick={()=>onSave(name||"My Template",emoji,true)}
            style={{flex:1.4,padding:"11px",borderRadius:"10px",border:"none",background:"var(--accent-primary)",color:"var(--text-on-accent)",fontFamily:"var(--font-body)",fontSize:"13px",fontWeight:700,cursor:"pointer"}}>
            บันทึก + Restart
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────
// QUIZ RESULT SCREEN
// ─────────────────────────────────────────────────────────────
function ResultScreen({ queue, progress, totalXP, onRestart }:{
  queue:VocabWord[]; progress:Map<string,WordProgress>; totalXP:number;
  onRestart:(mode:"same"|"partial"|"random")=>void
}) {
  const correct = queue.filter(w=>progress.get(w.id)?.correctCount??0 > 0).length
  const acc = queue.length ? Math.round((correct/queue.length)*100) : 0
  const mastered = [...progress.values()].filter(p=>p.isMastered).length

  return (
    <motion.div initial={{opacity:0,scale:0.96}} animate={{opacity:1,scale:1}}
      style={{textAlign:"center" as const,padding:"40px 24px",maxWidth:"500px",margin:"0 auto"}}>
      <div style={{fontSize:"56px",marginBottom:"16px"}}>
        {acc>=90?"🏆":acc>=70?"🎉":acc>=50?"👍":"💪"}
      </div>
      <h2 style={{fontFamily:"var(--font-display)",fontSize:"26px",fontWeight:700,color:"var(--text-primary)",margin:"0 0 8px",letterSpacing:"-0.02em"}}>
        จบ Quiz แล้ว!
      </h2>
      <p style={{fontFamily:"var(--font-body)",fontSize:"14px",color:"var(--text-muted)",margin:"0 0 28px"}}>
        {queue.length} คำ · ถูก {correct} · XP +{totalXP}
      </p>

      {/* Stats row */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"10px",marginBottom:"32px"}}>
        {[
          {label:"Accuracy", value:`${acc}%`,      color:"var(--accent-primary)"},
          {label:"Mastered", value:mastered,         color:"var(--mastered-color)"},
          {label:"XP ได้รับ",value:`+${totalXP}`,   color:"var(--xp-color)"},
        ].map((s,i)=>(
          <div key={i} style={{background:"var(--bg-surface)",border:"1px solid var(--border-default)",borderRadius:"14px",padding:"14px",textAlign:"center" as const}}>
            <div style={{fontFamily:"var(--font-mono)",fontSize:"22px",fontWeight:700,color:s.color}}>{s.value}</div>
            <div style={{fontFamily:"var(--font-body)",fontSize:"11px",color:"var(--text-muted)",marginTop:"3px",textTransform:"uppercase" as const,letterSpacing:"0.06em"}}>{s.label}</div>
          </div>
        ))}
      </div>

      <p style={{fontFamily:"var(--font-body)",fontSize:"13px",color:"var(--text-secondary)",marginBottom:"14px"}}>เล่นต่อ?</p>
      <div style={{display:"flex",flexDirection:"column" as const,gap:"10px"}}>
        {[
          {mode:"same"    as const, label:"🔁 เริ่มด้วยคำเดิมทั้งหมด",  desc:"ทุกคำใน round นี้"},
          {mode:"partial" as const, label:"🎯 สุ่มบางคำ (คำที่ยัง)",    desc:"เฉพาะคำที่ยังไม่ mastered"},
          {mode:"random"  as const, label:"🎲 สุ่มทั้งหมดใหม่",         desc:"สุ่มจากคำทั้งหมด"},
        ].map(opt=>(
          <motion.button key={opt.mode} whileHover={{scale:1.02}} whileTap={{scale:0.97}}
            onClick={()=>onRestart(opt.mode)}
            style={{
              width:"100%",padding:"14px 18px",borderRadius:"13px",
              border:"1px solid var(--border-default)",background:"var(--bg-surface)",
              color:"var(--text-primary)",fontFamily:"var(--font-body)",fontSize:"14px",
              cursor:"pointer",textAlign:"left" as const,transition:"all 0.15s",
              display:"flex",justifyContent:"space-between",alignItems:"center" as const,
            }}>
            <span style={{fontWeight:600}}>{opt.label}</span>
            <span style={{fontSize:"12px",color:"var(--text-muted)"}}>{opt.desc}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────
// TEMPLATE CARD LIST (Start Screen)
// ─────────────────────────────────────────────────────────────
function TemplateGrid({ onSelect }:{ onSelect:(t:QuizTemplate)=>void }) {
  const [userTpls, setUserTpls] = useState<QuizTemplate[]>([])
  const [filter, setFilter]     = useState<"all"|"global"|"mine">("all")
  const [search, setSearch]     = useState("")
  const [tag, setTag]           = useState("")

  useEffect(()=>{ setUserTpls(loadUserTemplates()) },[])

  const allTpls = [...userTpls, ...DEFAULT_TEMPLATES]
  const filtered = allTpls.filter(t=>{
    if(filter==="global" && !t.isGlobal) return false
    if(filter==="mine"   &&  t.isGlobal) return false
    if(search && !t.name.toLowerCase().includes(search.toLowerCase())) return false
    if(tag && !t.tags.includes(tag)) return false
    return true
  })
  const allTags = [...new Set(allTpls.flatMap(t=>t.tags))].slice(0,12)

  const modeLabel: Record<GameMode,string> = {
    "multiple-choice":"MC","think-reveal":"T&R","timed":"Timed","typing":"Type","invert":"Invert",
  }
  const catEmoji = Object.fromEntries(QUIZ_CATEGORIES.map(c=>[c.id,c.emoji]))

  return (
    <div style={{width:"100%"}}>
      {/* Filter bar */}
      <div style={{display:"flex",gap:"8px",marginBottom:"14px",alignItems:"center",flexWrap:"wrap" as const}}>
        {(["all","global","mine"] as const).map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{
            padding:"5px 14px",borderRadius:"9999px",border:"1px solid",
            borderColor:filter===f?"var(--accent-primary)":"var(--border-default)",
            background:filter===f?"var(--accent-primary)":"transparent",
            color:filter===f?"var(--text-on-accent)":"var(--text-secondary)",
            fontFamily:"var(--font-body)",fontSize:"12px",cursor:"pointer",transition:"all 0.15s",
          }}>
            {f==="all"?"ทั้งหมด":f==="global"?"🌍 Global":"👤 ของฉัน"}
          </button>
        ))}
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="ค้นหา template..."
          style={{flex:1,minWidth:"120px",padding:"5px 12px",borderRadius:"9999px",
            border:"1px solid var(--border-default)",background:"var(--bg-surface)",
            color:"var(--text-primary)",fontFamily:"var(--font-body)",fontSize:"12px",outline:"none"}}/>
      </div>

      {/* Tag chips */}
      <div style={{display:"flex",gap:"6px",marginBottom:"16px",overflowX:"auto" as const,paddingBottom:"4px"}}>
        <button onClick={()=>setTag("")} style={{
          padding:"3px 10px",borderRadius:"9999px",border:"1px solid",flexShrink:0,
          borderColor:!tag?"var(--accent-primary)":"var(--border-default)",
          background:!tag?"var(--bg-subtle)":"transparent",
          color:!tag?"var(--accent-primary)":"var(--text-muted)",
          fontFamily:"var(--font-body)",fontSize:"11px",cursor:"pointer",
        }}>All tags</button>
        {allTags.map(t=>(
          <button key={t} onClick={()=>setTag(t===tag?"":t)} style={{
            padding:"3px 10px",borderRadius:"9999px",border:"1px solid",flexShrink:0,
            borderColor:tag===t?"var(--accent-primary)":"var(--border-default)",
            background:tag===t?"var(--bg-subtle)":"transparent",
            color:tag===t?"var(--accent-primary)":"var(--text-muted)",
            fontFamily:"var(--font-body)",fontSize:"11px",cursor:"pointer",
          }}>{t}</button>
        ))}
      </div>

      {/* Cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:"12px"}}>
        {filtered.map((t,i)=>(
          <motion.div key={t.id}
            initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:i*0.03}}
            whileHover={{y:-3,boxShadow:"0 8px 24px var(--accent-glow)"}}
            onClick={()=>onSelect(t)}
            style={{
              background:"var(--bg-surface)",border:"1px solid var(--border-default)",
              borderRadius:"16px",padding:"16px",cursor:"pointer",transition:"all 0.2s",
              position:"relative",
            }}>
            {!t.isGlobal && (
              <span style={{position:"absolute",top:"10px",right:"10px",fontSize:"10px",
                padding:"2px 7px",borderRadius:"9999px",background:"var(--bg-subtle)",
                color:"var(--accent-primary)",fontFamily:"var(--font-body)",
                border:"1px solid var(--accent-primary)"}}>
                ของฉัน
              </span>
            )}
            <div style={{fontSize:"28px",marginBottom:"8px"}}>{t.emoji}</div>
            <h3 style={{fontFamily:"var(--font-display)",fontSize:"16px",fontWeight:700,
              color:"var(--text-primary)",margin:"0 0 4px",lineHeight:1.2}}>
              {t.name}
            </h3>
            <p style={{fontFamily:"var(--font-body)",fontSize:"12px",color:"var(--text-muted)",
              margin:"0 0 12px",lineHeight:1.4}}>{t.desc}</p>
            <div style={{display:"flex",gap:"6px",flexWrap:"wrap" as const}}>
              <Chip>{catEmoji[t.config.category]??""} {QUIZ_CATEGORIES.find(c=>c.id===t.config.category)?.label}</Chip>
              <Chip>📝 {t.config.size} คำ</Chip>
              <Chip>{modeLabel[t.config.mode]}</Chip>
              {t.config.hintsEnabled && <Chip>💡</Chip>}
            </div>
            <div style={{marginTop:"10px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span style={{fontFamily:"var(--font-mono)",fontSize:"11px",color:"var(--text-muted)"}}>
                ▶ {t.playCount.toLocaleString()} ครั้ง
              </span>
              <motion.div whileHover={{scale:1.08}} style={{
                padding:"5px 14px",borderRadius:"9999px",background:"var(--accent-primary)",
                color:"var(--text-on-accent)",fontFamily:"var(--font-body)",fontSize:"12px",fontWeight:600,
              }}>เล่น</motion.div>
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length===0 && (
        <div style={{textAlign:"center" as const,padding:"48px 0",color:"var(--text-muted)",fontFamily:"var(--font-body)"}}>
          ไม่พบ template ที่ตรงกัน
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// TYPING INPUT
// ─────────────────────────────────────────────────────────────
function TypingInput({ word, pool, inverted, onAnswer }:{
  word:VocabWord; pool:string[]; inverted:boolean; onAnswer:(correct:boolean,typed:string)=>void
}) {
  const [typed,setTyped]           = useState("")
  const [sugs,setSugs]             = useState<string[]>([])
  const [submitted,setSubmitted]   = useState(false)
  const ref = useRef<HTMLInputElement>(null)
  useEffect(()=>{ setTyped(""); setSubmitted(false); setSugs([]); setTimeout(()=>ref.current?.focus(),80) },[word.id])
  const target = inverted ? word.english : word.thai

  function onInput(v:string){
    setTyped(v)
    setSugs(v ? pool.filter(s=>s.toLowerCase().startsWith(v.toLowerCase())).slice(0,5) : [])
  }
  function submit(val=typed){
    if(submitted) return
    setSubmitted(true); setSugs([])
    onAnswer(val.trim().toLowerCase()===target.toLowerCase(), val)
  }
  return (
    <div style={{width:"100%",position:"relative"}}>
      <div style={{padding:"9px",borderRadius:"10px",background:"var(--bg-subtle)",fontFamily:"var(--font-body)",fontSize:"12px",color:"var(--text-muted)",marginBottom:"9px",textAlign:"center" as const}}>
        {inverted?"พิมพ์คำภาษาอังกฤษ":"พิมพ์คำแปลภาษาไทย"}
      </div>
      <div style={{position:"relative"}}>
        <input ref={ref} value={typed} onChange={e=>onInput(e.target.value)}
          onKeyDown={e=>{ if(e.key==="Enter") submit() }} disabled={submitted}
          placeholder={inverted?"Type English...":"พิมพ์คำแปล..."}
          style={{
            width:"100%",padding:"15px 18px",borderRadius:"13px",outline:"none",boxSizing:"border-box" as const,
            border:`2px solid ${submitted?(typed.trim().toLowerCase()===target.toLowerCase()?"var(--color-success)":"var(--color-danger)"):"var(--border-default)"}`,
            background:"var(--bg-surface)",color:"var(--text-primary)",
            fontFamily:"var(--font-display)",fontSize:"19px",transition:"border-color 0.2s",
          }}/>
        <AnimatePresence>
          {sugs.length>0 && !submitted && (
            <motion.div initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} exit={{opacity:0}}
              style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,zIndex:50,
                background:"var(--bg-elevated)",border:"1px solid var(--border-default)",
                borderRadius:"11px",overflow:"hidden",boxShadow:"0 8px 24px rgba(0,0,0,0.2)"}}>
              {sugs.map(s=>(
                <button key={s} onClick={()=>{ setTyped(s); setSugs([]); submit(s) }}
                  style={{display:"block",width:"100%",padding:"9px 14px",border:"none",background:"transparent",
                    color:"var(--text-primary)",fontFamily:"var(--font-body)",fontSize:"14px",textAlign:"left" as const,cursor:"pointer"}}
                  onMouseEnter={e=>(e.currentTarget.style.background="var(--bg-subtle)")}
                  onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                  {s}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {submitted && (
        <motion.p initial={{opacity:0,y:5}} animate={{opacity:1,y:0}} style={{marginTop:"9px",textAlign:"center" as const,fontFamily:"var(--font-body)",fontSize:"14px",fontWeight:600,color:typed.trim().toLowerCase()===target.toLowerCase()?"var(--color-success)":"var(--color-danger)"}}>
          {typed.trim().toLowerCase()===target.toLowerCase() ? "✓ ถูกต้อง!" : `✗ คำตอบที่ถูก: ${target}`}
        </motion.p>
      )}
      {!submitted && (
        <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}} onClick={()=>submit()}
          style={{width:"100%",marginTop:"10px",padding:"13px",borderRadius:"11px",border:"none",
            background:"var(--accent-primary)",color:"var(--text-on-accent)",
            fontFamily:"var(--font-body)",fontSize:"14px",fontWeight:600,cursor:"pointer"}}>
          ยืนยัน ↵
        </motion.button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MARK LEVEL BAR (always visible)
// ─────────────────────────────────────────────────────────────
const MARK_DESCS: Record<MarkLevel,string> = {
  0:"แสดงปกติ (Active)",
  1:"รู้จักแล้ว — โผล่น้อยลง (20%)",
  2:"Mastered — โผล่นาน (5%)",
  3:"ซ่อน — ไม่โผล่อีก",
}
function MarkBar({ current, onChange }:{ current:MarkLevel; onChange:(l:MarkLevel)=>void }) {
  const [tooltip,setTooltip] = useState<MarkLevel|null>(null)
  return (
    <div style={{display:"flex",gap:"6px",justifyContent:"center",flexWrap:"wrap" as const,position:"relative"}}>
      {([0,1,2,3] as MarkLevel[]).map(lv=>(
        <div key={lv} style={{position:"relative"}}>
          <motion.button whileHover={{scale:1.08}} whileTap={{scale:0.93}}
            onClick={()=>onChange(lv)}
            onMouseEnter={()=>setTooltip(lv)}
            onMouseLeave={()=>setTooltip(null)}
            style={{
              padding:"6px 12px",borderRadius:"9999px",border:"1px solid",
              borderColor:current===lv?"var(--accent-primary)":"var(--border-default)",
              background:current===lv?"var(--accent-primary)":"var(--bg-subtle)",
              color:current===lv?"var(--text-on-accent)":"var(--text-secondary)",
              fontFamily:"var(--font-body)",fontSize:"12px",cursor:"pointer",
              display:"flex",alignItems:"center" as const,gap:"4px",transition:"all 0.15s",
            }}>
            {MARK_ICONS[lv]} {MARK_LABELS[lv]}
          </motion.button>
          <AnimatePresence>
            {tooltip===lv && (
              <motion.div initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                style={{
                  position:"absolute",bottom:"calc(100% + 6px)",left:"50%",transform:"translateX(-50%)",
                  background:"var(--bg-elevated)",border:"1px solid var(--border-default)",
                  borderRadius:"8px",padding:"6px 10px",whiteSpace:"nowrap" as const,
                  fontFamily:"var(--font-body)",fontSize:"11px",color:"var(--text-secondary)",
                  boxShadow:"0 4px 12px rgba(0,0,0,0.2)",zIndex:50,
                }}>
                {MARK_DESCS[lv]}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// TINY HELPERS
// ─────────────────────────────────────────────────────────────
function Label({ children }:{ children:React.ReactNode }) {
  return <p style={{fontFamily:"var(--font-body)",fontSize:"11px",color:"var(--text-muted)",textTransform:"uppercase" as const,letterSpacing:"0.07em",margin:"0 0 8px"}}>{children}</p>
}
function Chip({ children }:{ children:React.ReactNode }) {
  return <span style={{padding:"3px 9px",borderRadius:"9999px",background:"var(--bg-subtle)",border:"1px solid var(--border-default)",fontFamily:"var(--font-body)",fontSize:"11px",color:"var(--text-muted)"}}>{children}</span>
}
function Toggle({ on, onToggle }:{ on:boolean; onToggle:()=>void }) {
  return (
    <button onClick={onToggle} style={{width:"42px",height:"22px",borderRadius:"9999px",border:"none",cursor:"pointer",position:"relative",background:on?"var(--accent-primary)":"var(--border-strong)",transition:"background 0.2s",flexShrink:0}}>
      <motion.div animate={{x:on?19:2}} transition={{type:"spring",stiffness:500,damping:30}}
        style={{width:"18px",height:"18px",borderRadius:"50%",background:"#fff",position:"absolute",top:"2px"}}/>
    </button>
  )
}

// ═════════════════════════════════════════════════════════════
// MAIN PAGE
// ═════════════════════════════════════════════════════════════
export default function GamePage() {
  const { theme } = useTheme()
  const [mounted,setMounted] = useState(false)
  useEffect(()=>setMounted(true),[])

  const allWords = SEED_VOCABULARY
  const allThai    = useMemo(()=>allWords.map(w=>w.thai),[allWords])
  const allEnglish = useMemo(()=>allWords.map(w=>w.english),[allWords])

  // Template / config
  const [config,setConfig]         = useState<QuizConfig>({category:"all",size:20,mode:"multiple-choice",hintsEnabled:false})
  const [showConfig,setShowConfig] = useState(false)
  const [showSaveTpl,setShowSaveTpl] = useState(false)
  const [showTemplates,setShowTemplates] = useState(true)

  // Quiz state
  const [quizActive,setQuizActive]   = useState(false)
  const [quizQueue,setQuizQueue]     = useState<VocabWord[]>([])
  const [quizIndex,setQuizIndex]     = useState(0)
  const [progress,setProgress]       = useState<Map<string,WordProgress>>(new Map())
  const [currentWord,setCurrentWord] = useState<VocabWord|null>(null)
  const [options,setOptions]         = useState<string[]>([])
  const [selected,setSelected]       = useState<string|null>(null)
  const [revealed,setRevealed]       = useState(false)
  const [feedback,setFeedback]       = useState<"correct"|"wrong"|null>(null)
  const [totalXP,setTotalXP]         = useState(0)
  const [timeLeft,setTimeLeft]       = useState(TIMED_SECONDS)
  const [timerActive,setTimerActive] = useState(false)
  const [masteredNow,setMasteredNow] = useState(false)
  const [showConfetti,setShowConfetti] = useState(false)
  const [quizDone,setQuizDone]       = useState(false)
  const timerRef  = useRef<ReturnType<typeof setInterval>|null>(null)
  const wordStart = useRef<number>(0)

  const inverted = config.mode==="invert"
  const isTyping = config.mode==="typing"||inverted
  const isFirst  = quizIndex===0 && selected===null

  // mark levels
  const wordP  = currentWord ? progress.get(currentWord.id) : undefined
  const markLv = (wordP?.markLevel??0) as MarkLevel
  const streak = wordP?.streakCount??0
  const mastered= [...progress.values()].filter(p=>p.isMastered).length
  const timerPct = timeLeft/TIMED_SECONDS
  const timerColor = timerPct>0.5?"var(--color-success)":timerPct>0.25?"var(--color-warning)":"var(--color-danger)"

  // Build queue
  function buildQueue(cfg:QuizConfig, words:VocabWord[], prog:Map<string,WordProgress>):VocabWord[] {
    const eligible = words.filter(w=>{
      const p=prog.get(w.id); const m=(p?.markLevel??0) as MarkLevel
      if(m===3)return false; if(m===2)return Math.random()<0.05; if(m===1)return Math.random()<0.2; return true
    })
    const pool = eligible.length>=3 ? eligible : words
    return [...pool].sort(()=>Math.random()-0.5).slice(0,cfg.size)
  }

  function startQuiz(cfg:QuizConfig=config, words?:VocabWord[]) {
    const queue = buildQueue(cfg, words??allWords, progress)
    setQuizQueue(queue); setQuizIndex(0); setQuizActive(true); setQuizDone(false)
    setShowTemplates(false); setShowConfig(false)
    if(queue.length>0) loadWord(queue[0],cfg)
  }

  function loadWord(word:VocabWord, cfg:QuizConfig=config) {
    setCurrentWord(word); setOptions(buildOptions(word,allWords))
    setSelected(null); setRevealed(false); setFeedback(null); setMasteredNow(false)
    wordStart.current=Date.now()
    if(cfg.mode==="timed"){ setTimeLeft(TIMED_SECONDS); setTimerActive(true) }
    else { clearInterval(timerRef.current!); setTimerActive(false) }
  }

  function nextWord() {
    const next=quizIndex+1
    if(next>=quizQueue.length){ setQuizDone(true); setQuizActive(false); return }
    setQuizIndex(next); loadWord(quizQueue[next])
  }

  // Timer
  useEffect(()=>{
    if(!timerActive)return
    timerRef.current=setInterval(()=>{
      setTimeLeft(t=>{
        if(t<=1){ clearInterval(timerRef.current!); setTimerActive(false); if(currentWord)handleAnswer("",false); return 0 }
        return t-1
      })
    },1000)
    return ()=>clearInterval(timerRef.current!)
  },[timerActive]) // eslint-disable-line

  function handleAnswer(chosen:string, correct:boolean) {
    if(selected!==null||!currentWord)return
    clearInterval(timerRef.current!); setTimerActive(false)
    const timeMs=Date.now()-wordStart.current
    setSelected(chosen); setFeedback(correct?"correct":"wrong")
    const prev=progress.get(currentWord.id)??{wordId:currentWord.id,streakCount:0,attemptCount:0,correctCount:0,isMastered:false,markLevel:0 as MarkLevel}
    const newP=updateProgress(prev,{wordId:currentWord.id,selectedOption:chosen,correct,timeMs})
    const xp=calcXP({wordId:currentWord.id,selectedOption:chosen,correct,timeMs},prev.streakCount)
    setProgress(p=>new Map(p).set(currentWord.id,newP))
    setTotalXP(x=>x+xp)
    if(!prev.isMastered&&newP.isMastered){ setMasteredNow(true); setShowConfetti(true); setTimeout(()=>setShowConfetti(false),3500) }
    setTimeout(nextWord, correct?1700:2200)
  }

  function setMarkLevel(lv:MarkLevel) {
    if(!currentWord)return
    const prev=progress.get(currentWord.id)??{wordId:currentWord.id,streakCount:0,attemptCount:0,correctCount:0,isMastered:false,markLevel:0 as MarkLevel}
    setProgress(p=>new Map(p).set(currentWord.id,{...prev,markLevel:lv}))
    // if hidden or known → skip to next immediately
    if(lv===3||lv===1){ setTimeout(nextWord,400) }
  }

  function handleRestart(mode:"same"|"partial"|"random") {
    setQuizDone(false); setQuizActive(false)
    if(mode==="same"){
      startQuiz(config, quizQueue)
    } else if(mode==="partial"){
      const unmastered = quizQueue.filter(w=>!progress.get(w.id)?.isMastered)
      startQuiz(config, unmastered.length>0?unmastered:quizQueue)
    } else {
      startQuiz(config)
    }
  }

  function handleSaveTemplate(name:string, emoji:string, restartNow:boolean) {
    const tpl:QuizTemplate = {
      id:`u-${Date.now()}`, name, emoji, desc:"My custom template",
      config, isGlobal:false, createdAt:new Date().toISOString(), playCount:0, tags:["custom"],
    }
    saveUserTemplate(tpl)
    setShowSaveTpl(false)
    if(restartNow) startQuiz(config)
    else setShowConfig(false)
  }

  function handleUseConfig() {
    setShowConfig(false)
    // Restart from word 1 with new config if still on first word
    if(isFirst) { startQuiz(config) }
    // else just continue (config used from next round)
  }

  if(!mounted) return <div style={{minHeight:"100vh",background:"var(--bg-base)"}}><NavBar/></div>

  // ── RESULT ──
  if(quizDone) return (
    <div style={{minHeight:"100vh",background:"var(--bg-base)",paddingBottom:"80px"}}>
      <NavBar/>
      <ResultScreen queue={quizQueue} progress={progress} totalXP={totalXP} onRestart={handleRestart}/>
    </div>
  )

  // ── START SCREEN ──
  if(!quizActive||!currentWord) return (
    <div style={{minHeight:"100vh",background:"var(--bg-base)",paddingBottom:"80px"}}>
      <NavBar/>
      <AnimatePresence>{showConfig&&(
        <ConfigModal config={config} onChange={setConfig}
          onUseNow={handleUseConfig} onSaveNew={()=>{setShowConfig(false);setShowSaveTpl(true)}}
          onClose={()=>setShowConfig(false)} isFirstWord={true}/>
      )}</AnimatePresence>
      <AnimatePresence>{showSaveTpl&&(
        <SaveTemplatePopup config={config} onSave={handleSaveTemplate} onCancel={()=>setShowSaveTpl(false)}/>
      )}</AnimatePresence>

      <main style={{maxWidth:"900px",margin:"0 auto",padding:"24px 16px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"24px",gap:"12px",flexWrap:"wrap" as const}}>
          <div>
            <h1 style={{fontFamily:"var(--font-display)",fontSize:"26px",fontWeight:700,color:"var(--text-primary)",margin:"0 0 4px",letterSpacing:"-0.02em"}}>
              🃏 เลือก Template
            </h1>
            <p style={{fontFamily:"var(--font-body)",fontSize:"14px",color:"var(--text-muted)",margin:0}}>
              กดเล่นได้เลย หรือ&nbsp;
              <button onClick={()=>setShowConfig(true)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--accent-primary)",fontFamily:"var(--font-body)",fontSize:"14px",padding:0,textDecoration:"underline"}}>
                ตั้งค่าเอง
              </button>
            </p>
          </div>
          <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}}
            onClick={()=>startQuiz()}
            style={{padding:"11px 22px",borderRadius:"12px",border:"none",background:"var(--accent-primary)",
              color:"var(--text-on-accent)",fontFamily:"var(--font-body)",fontSize:"14px",fontWeight:700,
              cursor:"pointer",display:"flex",alignItems:"center" as const,gap:"6px",boxShadow:"0 0 20px var(--accent-glow)"}}>
            {Ico.play} เริ่มเลย!
          </motion.button>
        </div>
        <TemplateGrid onSelect={t=>{ setConfig(t.config); startQuiz(t.config) }}/>
      </main>
    </div>
  )

  // ── ACTIVE QUIZ ──
  return (
    <div style={{minHeight:"100vh",background:"var(--bg-base)",paddingBottom:"80px"}}>
      <ConfettiCanvas active={showConfetti}/>
      <NavBar/>
      <AnimatePresence>{showConfig&&(
        <ConfigModal config={config} onChange={setConfig}
          onUseNow={handleUseConfig} onSaveNew={()=>{setShowConfig(false);setShowSaveTpl(true)}}
          onClose={()=>setShowConfig(false)} isFirstWord={isFirst}/>
      )}</AnimatePresence>
      <AnimatePresence>{showSaveTpl&&(
        <SaveTemplatePopup config={config} onSave={handleSaveTemplate} onCancel={()=>setShowSaveTpl(false)}/>
      )}</AnimatePresence>

      {/* Progress bar */}
      <div style={{height:"3px",background:"var(--border-default)"}}>
        <motion.div animate={{width:`${((quizIndex+1)/quizQueue.length)*100}%`}}
          style={{height:"100%",background:"var(--accent-primary)"}} transition={{duration:0.4}}/>
      </div>

      <main style={{maxWidth:"680px",margin:"0 auto",padding:"14px 16px 40px"}}>
        {/* Top row */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"14px",gap:"8px"}}>
          <span style={{fontFamily:"var(--font-mono)",fontSize:"13px",color:"var(--text-muted)"}}>{quizIndex+1}/{quizQueue.length}</span>
          <div style={{display:"flex",alignItems:"center",gap:"5px"}}>
            {Ico.flame}
            <motion.span key={streak} initial={{scale:1.5}} animate={{scale:1}} transition={{type:"spring",stiffness:500,damping:20}}
              style={{fontFamily:"var(--font-mono)",fontSize:"14px",fontWeight:700,color:streak>0?"var(--streak-color)":"var(--text-muted)"}}>
              {streak}
            </motion.span>
            <div style={{display:"flex",gap:"4px",marginLeft:"4px"}}>
              {[0,1,2,3].map(i=>(
                <motion.div key={i} animate={{background:streak>i?"var(--accent-primary)":"var(--border-strong)"}}
                  style={{width:"7px",height:"7px",borderRadius:"50%"}}/>
              ))}
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
            {config.mode==="timed"
              ? <span style={{fontFamily:"var(--font-mono)",fontSize:"19px",fontWeight:700,color:timerColor}}>{timeLeft}s</span>
              : <span style={{fontFamily:"var(--font-mono)",fontSize:"12px",color:"var(--xp-color)",display:"flex",alignItems:"center" as const,gap:"3px"}}>{Ico.star}{totalXP}</span>
            }
            {/* Settings button — only on first word or between words */}
            <motion.button whileHover={{scale:1.1}} whileTap={{scale:0.9}}
              onClick={()=>setShowConfig(true)}
              style={{padding:"5px",borderRadius:"8px",border:"1px solid var(--border-default)",background:"var(--bg-surface)",color:"var(--text-secondary)",cursor:"pointer",display:"flex",alignItems:"center" as const}}>
              {Ico.cog}
            </motion.button>
          </div>
        </div>

        {/* Timer bar */}
        {config.mode==="timed" && (
          <div style={{height:"4px",borderRadius:"9999px",background:"var(--border-default)",marginBottom:"12px",overflow:"hidden"}}>
            <motion.div animate={{width:`${timerPct*100}%`}} transition={{duration:1,ease:"linear"}}
              style={{height:"100%",borderRadius:"9999px",background:timerColor,transition:"background 0.3s"}}/>
          </div>
        )}

        {/* Word card */}
        <AnimatePresence mode="wait">
          <motion.div key={currentWord.id}
            initial={{opacity:0,y:22,scale:0.97}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-14,scale:0.97}}
            transition={{type:"spring",stiffness:320,damping:28}}
            style={{
              width:"100%",background:"var(--card-bg)",border:"1px solid var(--card-border)",
              borderRadius:"20px",padding:"clamp(20px,5vw,38px) clamp(18px,5vw,34px)",
              textAlign:"center" as const,marginBottom:"18px",position:"relative",
              boxShadow:feedback==="correct"?"0 0 28px var(--color-success)44":feedback==="wrong"?"0 0 28px var(--color-danger)44":"0 0 40px var(--accent-glow)",
            }}>
            <div style={{position:"absolute",top:"11px",left:"13px",display:"flex",alignItems:"center" as const,gap:"5px"}}>
              <span style={{fontSize:"10px",color:"var(--text-muted)",textTransform:"capitalize" as const,fontFamily:"var(--font-body)"}}>{currentWord.category}</span>
              <span style={{fontSize:"12px"}}>{MARK_ICONS[markLv]}</span>
            </div>
            <div style={{position:"absolute",top:"13px",right:"13px",display:"flex",gap:"3px"}}>
              {[1,2,3,4,5].map(d=><div key={d} style={{width:"5px",height:"5px",borderRadius:"50%",background:d<=currentWord.difficulty?"var(--accent-secondary)":"var(--border-default)"}}/>)}
            </div>
            <h1 style={{fontFamily:"var(--font-display)",fontSize:"clamp(1.9rem,7vw,3.2rem)",fontWeight:700,color:"var(--text-primary)",margin:"8px 0 6px",lineHeight:1.1,letterSpacing:"-0.02em"}}>
              {inverted ? currentWord.thai : currentWord.english}
            </h1>
            {config.hintsEnabled&&!inverted&&currentWord.phonetic&&(
              <p style={{fontFamily:"var(--font-mono)",fontSize:"13px",color:"var(--text-muted)",margin:"0 0 7px"}}>/{currentWord.phonetic}/</p>
            )}
            {config.hintsEnabled&&!inverted&&currentWord.example&&(
              <p style={{fontFamily:"var(--font-body)",fontSize:"12px",color:"var(--text-secondary)",fontStyle:"italic",margin:0}}>"{currentWord.example}"</p>
            )}
            <AnimatePresence>
              {masteredNow&&(
                <motion.div initial={{opacity:0,scale:0.8}} animate={{opacity:1,scale:1}} exit={{opacity:0}}
                  style={{position:"absolute",top:"-13px",left:"50%",transform:"translateX(-50%)",
                    background:"var(--mastered-color)",color:"#fff",padding:"3px 16px",borderRadius:"9999px",
                    fontSize:"11px",fontWeight:700,fontFamily:"var(--font-body)",whiteSpace:"nowrap" as const,textTransform:"uppercase" as const}}>
                  ⭐ Word Mastered!
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>

        {/* OPTIONS — 2×2 */}
        {(config.mode==="multiple-choice"||config.mode==="timed")&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"9px"}}>
            {options.map((opt,i)=>{
              const os=getOptionStyle(theme,i as 0|1|2|3)
              const isSel=selected===opt, isCor=opt===currentWord.thai
              let bg=os.bg,border=os.border,color=os.text
              if(selected!==null){
                if(isCor){bg="var(--option-correct)";border="var(--color-success)";color="var(--color-success)"}
                else if(isSel){bg="var(--option-wrong)";border="var(--color-danger)";color="var(--color-danger)"}
              }
              return (
                <motion.button key={i} onClick={()=>{ if(selected===null)handleAnswer(opt,opt===currentWord.thai) }}
                  initial={{opacity:0,y:7}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}
                  whileHover={selected===null?{scale:1.02}:{}} whileTap={selected===null?{scale:0.97}:{}}
                  style={{padding:"15px 11px",borderRadius:"13px",border:`1.5px solid ${border}`,background:bg,color,
                    fontFamily:"var(--font-display)",fontSize:"clamp(13px,3vw,17px)",fontWeight:600,
                    cursor:selected===null?"pointer":"default",display:"flex",alignItems:"center" as const,
                    justifyContent:"space-between",transition:"all 0.18s",textAlign:"left" as const,minHeight:"58px"}}>
                  <span style={{flex:1}}>{opt}</span>
                  {selected!==null&&isCor&&<span style={{color:"var(--color-success)",flexShrink:0}}>{Ico.check}</span>}
                  {selected!==null&&isSel&&!isCor&&<span style={{color:"var(--color-danger)",flexShrink:0}}>{Ico.x}</span>}
                </motion.button>
              )
            })}
          </div>
        )}

        {/* THINK & REVEAL */}
        {config.mode==="think-reveal"&&(
          <div style={{width:"100%",display:"flex",flexDirection:"column" as const,gap:"9px"}}>
            {!revealed
              ? <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}} onClick={()=>setRevealed(true)}
                  style={{width:"100%",padding:"18px",borderRadius:"13px",border:"1px solid var(--accent-primary)",
                    background:"transparent",color:"var(--accent-primary)",fontFamily:"var(--font-display)",fontSize:"17px",
                    fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center" as const,justifyContent:"center" as const,gap:"9px"}}>
                  {Ico.eye} Reveal Answer
                </motion.button>
              : <motion.div initial={{opacity:0,y:9}} animate={{opacity:1,y:0}}>
                  <div style={{textAlign:"center" as const,padding:"18px",borderRadius:"13px",border:"1px solid var(--border-default)",background:"var(--bg-subtle)",marginBottom:"10px"}}>
                    <span style={{fontFamily:"var(--font-display)",fontSize:"30px",fontWeight:700,color:"var(--text-primary)"}}>{currentWord.thai}</span>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"9px"}}>
                    <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}} onClick={()=>handleAnswer("__correct__",true)}
                      style={{padding:"13px",borderRadius:"11px",border:"1px solid var(--color-success)",background:"var(--option-correct)",color:"var(--color-success)",fontFamily:"var(--font-body)",fontSize:"14px",fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center" as const,justifyContent:"center" as const,gap:"7px"}}>
                      {Ico.check} ถูก
                    </motion.button>
                    <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}} onClick={()=>handleAnswer("__wrong__",false)}
                      style={{padding:"13px",borderRadius:"11px",border:"1px solid var(--color-danger)",background:"var(--option-wrong)",color:"var(--color-danger)",fontFamily:"var(--font-body)",fontSize:"14px",fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center" as const,justifyContent:"center" as const,gap:"7px"}}>
                      {Ico.x} ผิด
                    </motion.button>
                  </div>
                </motion.div>
            }
          </div>
        )}

        {/* TYPING / INVERT */}
        {isTyping&&<TypingInput word={currentWord} pool={inverted?allEnglish:allThai} inverted={inverted} onAnswer={(c,t)=>handleAnswer(t,c)}/>}

        {/* Feedback */}
        <AnimatePresence>
          {feedback&&(
            <motion.div initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} exit={{opacity:0}}
              style={{marginTop:"14px",padding:"9px 20px",borderRadius:"9999px",display:"flex",justifyContent:"center",
                background:feedback==="correct"?"var(--color-success)":"var(--color-danger)",
                color:"#fff",fontFamily:"var(--font-body)",fontSize:"13px",fontWeight:600}}>
              {feedback==="correct"?"✓ ถูกต้อง!":"✗ คำตอบที่ถูก: "+(inverted?currentWord.english:currentWord.thai)}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mark bar — always visible */}
        <div style={{marginTop:"18px"}}>
          <p style={{fontFamily:"var(--font-body)",fontSize:"11px",color:"var(--text-muted)",textAlign:"center" as const,margin:"0 0 8px",textTransform:"uppercase" as const,letterSpacing:"0.07em"}}>
            ทำเครื่องหมายคำนี้
          </p>
          <MarkBar current={markLv} onChange={setMarkLevel}/>
        </div>
      </main>
    </div>
  )
}
