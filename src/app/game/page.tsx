// english-card-game/src/app/game/page.tsx
"use client"
import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  VocabWord, WordProgress, GameMode, MarkLevel,
  MARK_LABELS, MARK_ICONS, QUIZ_CATEGORIES, QUIZ_SIZES, QuizCategory, QuizConfig,
} from "../../types/game"
import { SEED_VOCABULARY } from "../../data/vocabulary"
import { updateProgress, calcXP, pickRandomWord, buildOptions } from "../../lib/gameLogic"
import { NavBar } from "../../components/NavBar"
import { useTheme } from "../../themes/ThemeProvider"
import { ConfettiCanvas } from "../../components/ConfettiCanvas"
import { getOptionStyle } from "../../themes/themes"

const TIMED_SECONDS = 15
const MODES: { id: GameMode; label: string; emoji: string }[] = [
  { id:"multiple-choice", label:"Multiple Choice", emoji:"🔤" },
  { id:"think-reveal",    label:"Think & Reveal",  emoji:"🧠" },
  { id:"timed",           label:"Timed",           emoji:"⏱️" },
  { id:"typing",          label:"Typing",          emoji:"⌨️" },
  { id:"invert",          label:"TH→EN Invert",    emoji:"🔄" },
]

const Ico = {
  flame:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 3z"/></svg>,
  check:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>,
  x:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>,
  eye:<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  star:<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>,
  cog:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
}

// ── Quiz Setup Modal ──────────────────────────────────────────
function QuizSetupModal({ config, onChange, onStart, onClose }:{
  config:QuizConfig; onChange:(c:QuizConfig)=>void; onStart:()=>void; onClose:()=>void
}) {
  const tag=(active:boolean):React.CSSProperties=>({
    padding:"10px 6px",borderRadius:"12px",border:"1px solid",
    borderColor:active?"var(--accent-primary)":"var(--border-default)",
    background:active?"var(--accent-primary)":"var(--bg-subtle)",
    color:active?"var(--text-on-accent)":"var(--text-secondary)",
    fontFamily:"var(--font-body)",fontSize:"12px",cursor:"pointer",transition:"all 0.15s",
    display:"flex",flexDirection:"column" as const,alignItems:"center" as const,gap:"4px",
  })
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}}
      onClick={onClose}>
      <motion.div initial={{scale:0.92,y:16}} animate={{scale:1,y:0}}
        style={{background:"var(--bg-elevated)",border:"1px solid var(--border-default)",borderRadius:"20px",padding:"28px",width:"100%",maxWidth:"460px",maxHeight:"90vh",overflowY:"auto" as const}}
        onClick={e=>e.stopPropagation()}>
        <h2 style={{fontFamily:"var(--font-display)",fontSize:"20px",fontWeight:700,color:"var(--text-primary)",margin:"0 0 20px"}}>⚙️ ตั้งค่า Quiz</h2>
        <p style={{fontFamily:"var(--font-body)",fontSize:"11px",color:"var(--text-muted)",textTransform:"uppercase" as const,letterSpacing:"0.07em",margin:"0 0 10px"}}>หมวดคำศัพท์</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px",marginBottom:"20px"}}>
          {QUIZ_CATEGORIES.map(c=>(
            <button key={c.id} onClick={()=>onChange({...config,category:c.id})} style={tag(config.category===c.id)}>
              <span style={{fontSize:"18px"}}>{c.emoji}</span>
              <span style={{fontWeight:config.category===c.id?600:400,textAlign:"center" as const,lineHeight:"1.3"}}>{c.label}</span>
            </button>
          ))}
        </div>
        <p style={{fontFamily:"var(--font-body)",fontSize:"11px",color:"var(--text-muted)",textTransform:"uppercase" as const,letterSpacing:"0.07em",margin:"0 0 10px"}}>จำนวนคำ</p>
        <div style={{display:"flex",gap:"8px",flexWrap:"wrap" as const,marginBottom:"20px"}}>
          {QUIZ_SIZES.map(n=>(
            <button key={n} onClick={()=>onChange({...config,size:n})} style={{
              padding:"8px 16px",borderRadius:"9999px",border:"1px solid",
              borderColor:config.size===n?"var(--accent-primary)":"var(--border-default)",
              background:config.size===n?"var(--accent-primary)":"transparent",
              color:config.size===n?"var(--text-on-accent)":"var(--text-secondary)",
              fontFamily:"var(--font-mono)",fontSize:"14px",fontWeight:600,cursor:"pointer",transition:"all 0.15s",
            }}>{n}</button>
          ))}
        </div>
        <p style={{fontFamily:"var(--font-body)",fontSize:"11px",color:"var(--text-muted)",textTransform:"uppercase" as const,letterSpacing:"0.07em",margin:"0 0 10px"}}>โหมดเกม</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"20px"}}>
          {MODES.map(m=>(
            <button key={m.id} onClick={()=>onChange({...config,mode:m.id})} style={{
              padding:"10px",borderRadius:"12px",border:"1px solid",
              borderColor:config.mode===m.id?"var(--accent-primary)":"var(--border-default)",
              background:config.mode===m.id?"var(--accent-primary)":"var(--bg-subtle)",
              color:config.mode===m.id?"var(--text-on-accent)":"var(--text-secondary)",
              fontFamily:"var(--font-body)",fontSize:"13px",fontWeight:config.mode===m.id?600:400,
              cursor:"pointer",transition:"all 0.15s",display:"flex",alignItems:"center",gap:"6px",justifyContent:"center" as const,
            }}><span>{m.emoji}</span>{m.label}</button>
          ))}
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"24px",
          padding:"12px 16px",borderRadius:"12px",border:"1px solid var(--border-default)",background:"var(--bg-subtle)"}}>
          <span style={{fontFamily:"var(--font-body)",fontSize:"14px",color:"var(--text-primary)"}}>💡 เปิดคำใบ้ (phonetic + ตัวอย่าง)</span>
          <button onClick={()=>onChange({...config,hintsEnabled:!config.hintsEnabled})} style={{
            width:"44px",height:"24px",borderRadius:"9999px",border:"none",cursor:"pointer",position:"relative",
            background:config.hintsEnabled?"var(--accent-primary)":"var(--border-strong)",transition:"background 0.2s",
          }}>
            <motion.div animate={{x:config.hintsEnabled?20:2}} transition={{type:"spring",stiffness:500,damping:30}}
              style={{width:"20px",height:"20px",borderRadius:"50%",background:"#fff",position:"absolute",top:"2px"}}/>
          </button>
        </div>
        <div style={{display:"flex",gap:"10px"}}>
          <button onClick={onClose} style={{flex:1,padding:"12px",borderRadius:"12px",border:"1px solid var(--border-default)",background:"transparent",color:"var(--text-secondary)",fontFamily:"var(--font-body)",fontSize:"14px",cursor:"pointer"}}>ยกเลิก</button>
          <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}} onClick={onStart} style={{flex:2,padding:"12px",borderRadius:"12px",border:"none",background:"var(--accent-primary)",color:"var(--text-on-accent)",fontFamily:"var(--font-body)",fontSize:"14px",fontWeight:700,cursor:"pointer"}}>เริ่ม Quiz →</motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Typing Input ──────────────────────────────────────────────
function TypingInput({ word, pool, inverted, onAnswer }:{
  word:VocabWord; pool:string[]; inverted:boolean; onAnswer:(correct:boolean,typed:string)=>void
}) {
  const [typed,setTyped]       = useState("")
  const [sugs,setSugs]         = useState<string[]>([])
  const [submitted,setSubmitted] = useState(false)
  const ref = useRef<HTMLInputElement>(null)
  useEffect(()=>{ setTyped(""); setSubmitted(false); setSugs([]); setTimeout(()=>ref.current?.focus(),100) },[word.id])

  const target = inverted ? word.english : word.thai

  function onInput(v:string){
    setTyped(v)
    if(!v){setSugs([]);return}
    setSugs(pool.filter(s=>s.toLowerCase().startsWith(v.toLowerCase())).slice(0,5))
  }
  function submit(val=typed){
    if(submitted)return
    setSubmitted(true); setSugs([])
    const correct = val.trim().toLowerCase()===target.toLowerCase()
    onAnswer(correct,val)
  }
  return (
    <div style={{width:"100%",position:"relative"}}>
      <div style={{padding:"10px",borderRadius:"10px",background:"var(--bg-subtle)",fontFamily:"var(--font-body)",fontSize:"13px",color:"var(--text-muted)",marginBottom:"10px",textAlign:"center" as const}}>
        {inverted?"พิมพ์คำภาษาอังกฤษ":"พิมพ์คำแปลภาษาไทย"}
      </div>
      <div style={{position:"relative"}}>
        <input ref={ref} value={typed} onChange={e=>onInput(e.target.value)}
          onKeyDown={e=>{if(e.key==="Enter")submit()}} disabled={submitted}
          placeholder={inverted?"Type English...":"พิมพ์คำแปล..."}
          style={{
            width:"100%",padding:"16px 20px",borderRadius:"14px",
            border:`2px solid ${submitted?(typed.trim().toLowerCase()===target.toLowerCase()?"var(--color-success)":"var(--color-danger)"):"var(--border-default)"}`,
            background:"var(--bg-surface)",color:"var(--text-primary)",
            fontFamily:"var(--font-display)",fontSize:"20px",outline:"none",boxSizing:"border-box" as const,transition:"border-color 0.2s",
          }}/>
        <AnimatePresence>
          {sugs.length>0&&!submitted&&(
            <motion.div initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} exit={{opacity:0}}
              style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,zIndex:50,
                background:"var(--bg-elevated)",border:"1px solid var(--border-default)",
                borderRadius:"12px",overflow:"hidden",boxShadow:"0 8px 24px rgba(0,0,0,0.2)"}}>
              {sugs.map(s=>(
                <button key={s} onClick={()=>{setTyped(s);setSugs([]);submit(s)}}
                  style={{display:"block",width:"100%",padding:"10px 16px",border:"none",background:"transparent",
                    color:"var(--text-primary)",fontFamily:"var(--font-body)",fontSize:"15px",textAlign:"left" as const,cursor:"pointer"}}
                  onMouseEnter={e=>(e.currentTarget.style.background="var(--bg-subtle)")}
                  onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>{s}</button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {submitted&&(
        <motion.p initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} style={{marginTop:"10px",textAlign:"center" as const,fontFamily:"var(--font-body)",fontSize:"15px",fontWeight:600,
          color:typed.trim().toLowerCase()===target.toLowerCase()?"var(--color-success)":"var(--color-danger)"}}>
          {typed.trim().toLowerCase()===target.toLowerCase() ? "✓ ถูกต้อง!" : `✗ คำตอบที่ถูก: ${target}`}
        </motion.p>
      )}
      {!submitted&&(
        <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}} onClick={()=>submit()}
          style={{width:"100%",marginTop:"12px",padding:"14px",borderRadius:"12px",border:"none",
            background:"var(--accent-primary)",color:"var(--text-on-accent)",fontFamily:"var(--font-body)",
            fontSize:"15px",fontWeight:600,cursor:"pointer"}}>ยืนยัน ↵</motion.button>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════
export default function GamePage() {
  const { theme } = useTheme()
  const [mounted,setMounted] = useState(false)
  useEffect(()=>setMounted(true),[])

  const allWords = SEED_VOCABULARY
  const [config,setConfig]     = useState<QuizConfig>({category:"all",size:20,mode:"multiple-choice",hintsEnabled:false})
  const [showSetup,setShowSetup] = useState(false)
  const [quizActive,setQuizActive] = useState(false)
  const [quizQueue,setQuizQueue]   = useState<VocabWord[]>([])
  const [quizIndex,setQuizIndex]   = useState(0)
  const [progress,setProgress]     = useState<Map<string,WordProgress>>(new Map())
  const [currentWord,setCurrentWord] = useState<VocabWord|null>(null)
  const [options,setOptions]         = useState<string[]>([])
  const [selected,setSelected]       = useState<string|null>(null)
  const [revealed,setRevealed]       = useState(false)
  const [feedback,setFeedback]       = useState<"correct"|"wrong"|null>(null)
  const [totalXP,setTotalXP]         = useState(0)
  const [sessionStreak,setSessionStreak] = useState(0)
  const [masteredNow,setMasteredNow] = useState(false)
  const [showConfetti,setShowConfetti] = useState(false)
  const [timeLeft,setTimeLeft]       = useState(TIMED_SECONDS)
  const [timerActive,setTimerActive] = useState(false)
  const [showMarkPicker,setShowMarkPicker] = useState(false)
  const timerRef  = useRef<ReturnType<typeof setInterval>|null>(null)
  const wordStart = useRef<number>(0)

  const allThai    = useMemo(()=>allWords.map(w=>w.thai),[allWords])
  const allEnglish = useMemo(()=>allWords.map(w=>w.english),[allWords])
  const inverted   = config.mode==="invert"
  const isTyping   = config.mode==="typing"||inverted

  function startQuiz(){
    const eligible = allWords.filter(w=>{
      const p = progress.get(w.id)
      const m = (p?.markLevel??0) as MarkLevel
      if(m===3)return false
      if(m===2)return Math.random()<0.05
      if(m===1)return Math.random()<0.2
      return true
    })
    const pool = [...eligible].sort(()=>Math.random()-0.5).slice(0,config.size)
    const queue = pool.length>0?pool:[...allWords].sort(()=>Math.random()-0.5).slice(0,config.size)
    setQuizQueue(queue); setQuizIndex(0); setQuizActive(true); setShowSetup(false)
    if(queue.length>0) loadWord(queue[0],queue)
  }

  function loadWord(word:VocabWord, queue?:VocabWord[]){
    setCurrentWord(word)
    setOptions(buildOptions(word,allWords))
    setSelected(null); setRevealed(false); setFeedback(null); setMasteredNow(false); setShowMarkPicker(false)
    wordStart.current = Date.now()
    if(config.mode==="timed"){ setTimeLeft(TIMED_SECONDS); setTimerActive(true) }
  }

  function nextWord(){
    const next=quizIndex+1
    if(next>=quizQueue.length){ setQuizActive(false); return }
    setQuizIndex(next); loadWord(quizQueue[next])
  }

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

  function handleAnswer(chosen:string, correct:boolean){
    if(selected!==null||!currentWord)return
    clearInterval(timerRef.current!); setTimerActive(false)
    const timeMs = Date.now()-wordStart.current
    setSelected(chosen); setFeedback(correct?"correct":"wrong")
    const prev = progress.get(currentWord.id) ?? {wordId:currentWord.id,streakCount:0,attemptCount:0,correctCount:0,isMastered:false,markLevel:0 as MarkLevel}
    const newP = updateProgress(prev,{wordId:currentWord.id,selectedOption:chosen,correct,timeMs})
    const xp   = calcXP({wordId:currentWord.id,selectedOption:chosen,correct,timeMs},prev.streakCount)
    setProgress(p=>new Map(p).set(currentWord.id,newP))
    setTotalXP(x=>x+xp); setSessionStreak(s=>correct?s+1:0)
    if(!prev.isMastered&&newP.isMastered){ setMasteredNow(true); setShowConfetti(true); setTimeout(()=>setShowConfetti(false),3500) }
    setTimeout(()=>setShowMarkPicker(true),600)
    setTimeout(nextWord, correct?1800:2400)
  }

  function setMarkLevel(lv:MarkLevel){
    if(!currentWord)return
    setProgress(p=>{
      const prev=p.get(currentWord.id)??{wordId:currentWord.id,streakCount:0,attemptCount:0,correctCount:0,isMastered:false,markLevel:0 as MarkLevel}
      return new Map(p).set(currentWord.id,{...prev,markLevel:lv})
    })
    setShowMarkPicker(false)
  }

  const wordP   = currentWord?progress.get(currentWord.id):undefined
  const markLv  = (wordP?.markLevel??0) as MarkLevel
  const streak  = wordP?.streakCount??0
  const mastered= [...progress.values()].filter(p=>p.isMastered).length
  const timerPct= timeLeft/TIMED_SECONDS
  const timerColor= timerPct>0.5?"var(--color-success)":timerPct>0.25?"var(--color-warning)":"var(--color-danger)"

  if(!mounted) return <div style={{minHeight:"100vh",background:"var(--bg-base)"}}><NavBar/></div>

  // ── Start screen ──
  if(!quizActive||!currentWord){
    const total   = [...progress.values()].reduce((a,p)=>a+p.attemptCount,0)
    const correct = [...progress.values()].reduce((a,p)=>a+p.correctCount,0)
    const acc     = total?Math.round((correct/total)*100):0
    return (
      <div style={{minHeight:"100vh",background:"var(--bg-base)",paddingBottom:"80px"}}>
        <NavBar/>
        <AnimatePresence>{showSetup&&<QuizSetupModal config={config} onChange={setConfig} onStart={startQuiz} onClose={()=>setShowSetup(false)}/>}</AnimatePresence>
        <main style={{maxWidth:"560px",margin:"0 auto",padding:"40px 16px",display:"flex",flexDirection:"column",alignItems:"center",gap:"24px"}}>
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} style={{textAlign:"center" as const}}>
            <div style={{fontSize:"56px",marginBottom:"12px"}}>🃏</div>
            <h1 style={{fontFamily:"var(--font-display)",fontSize:"28px",fontWeight:700,color:"var(--text-primary)",margin:"0 0 6px",letterSpacing:"-0.02em"}}>English Card Game</h1>
            <p style={{fontFamily:"var(--font-body)",fontSize:"14px",color:"var(--text-muted)",margin:0}}>เลือกหมวดและโหมดที่ต้องการ แล้วเริ่มเลย</p>
          </motion.div>
          {progress.size>0&&(
            <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.1}} style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"10px",width:"100%"}}>
              {[{label:"Mastered",value:mastered,color:"var(--mastered-color)"},{label:"Accuracy",value:`${acc}%`,color:"var(--accent-primary)"},{label:"XP",value:totalXP,color:"var(--xp-color)"}].map((s,i)=>(
                <div key={i} style={{background:"var(--bg-surface)",border:"1px solid var(--border-default)",borderRadius:"14px",padding:"14px",textAlign:"center" as const}}>
                  <div style={{fontFamily:"var(--font-mono)",fontSize:"22px",fontWeight:700,color:s.color}}>{s.value}</div>
                  <div style={{fontFamily:"var(--font-body)",fontSize:"11px",color:"var(--text-muted)",marginTop:"2px",textTransform:"uppercase" as const,letterSpacing:"0.06em"}}>{s.label}</div>
                </div>
              ))}
            </motion.div>
          )}
          <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.12}} style={{width:"100%",background:"var(--bg-surface)",border:"1px solid var(--border-default)",borderRadius:"16px",padding:"16px 20px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
              <span style={{fontFamily:"var(--font-body)",fontSize:"13px",color:"var(--text-muted)"}}>การตั้งค่าปัจจุบัน</span>
              <button onClick={()=>setShowSetup(true)} style={{display:"flex",alignItems:"center",gap:"4px",padding:"4px 10px",borderRadius:"8px",border:"1px solid var(--border-default)",background:"transparent",color:"var(--text-secondary)",fontFamily:"var(--font-body)",fontSize:"12px",cursor:"pointer"}}>
                {Ico.cog} แก้ไข
              </button>
            </div>
            <div style={{display:"flex",gap:"8px",flexWrap:"wrap" as const}}>
              {[
                (QUIZ_CATEGORIES.find(c=>c.id===config.category)?.emoji??"")+" "+(QUIZ_CATEGORIES.find(c=>c.id===config.category)?.label??""),
                `📝 ${config.size} คำ`,
                (MODES.find(m=>m.id===config.mode)?.emoji??"")+" "+(MODES.find(m=>m.id===config.mode)?.label??""),
                config.hintsEnabled?"💡 มีคำใบ้":"🚫 ไม่มีคำใบ้",
              ].map((tag,i)=>(
                <span key={i} style={{padding:"4px 12px",borderRadius:"9999px",background:"var(--bg-subtle)",border:"1px solid var(--border-default)",fontFamily:"var(--font-body)",fontSize:"12px",color:"var(--text-secondary)"}}>{tag}</span>
              ))}
            </div>
          </motion.div>
          <motion.button initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.18}}
            whileHover={{scale:1.03}} whileTap={{scale:0.97}} onClick={startQuiz}
            style={{width:"100%",padding:"18px",borderRadius:"16px",border:"none",background:"var(--accent-primary)",color:"var(--text-on-accent)",fontFamily:"var(--font-display)",fontSize:"18px",fontWeight:700,cursor:"pointer",boxShadow:"0 0 32px var(--accent-glow)"}}>
            เริ่ม Quiz →
          </motion.button>
        </main>
      </div>
    )
  }

  // ── Active quiz ──
  return (
    <div style={{minHeight:"100vh",background:"var(--bg-base)",paddingBottom:"80px"}}>
      <ConfettiCanvas active={showConfetti}/>
      <NavBar/>
      <div style={{height:"3px",background:"var(--border-default)"}}>
        <motion.div animate={{width:`${((quizIndex+1)/quizQueue.length)*100}%`}} style={{height:"100%",background:"var(--accent-primary)"}} transition={{duration:0.4}}/>
      </div>
      <main style={{maxWidth:"680px",margin:"0 auto",padding:"16px 16px 40px"}}>
        {/* Header row */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"16px",gap:"12px"}}>
          <span style={{fontFamily:"var(--font-mono)",fontSize:"13px",color:"var(--text-muted)"}}>{quizIndex+1}/{quizQueue.length}</span>
          <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
            {Ico.flame}
            <motion.span key={streak} initial={{scale:1.5}} animate={{scale:1}} transition={{type:"spring",stiffness:500,damping:20}}
              style={{fontFamily:"var(--font-mono)",fontSize:"15px",fontWeight:700,color:streak>0?"var(--streak-color)":"var(--text-muted)"}}>
              {streak}
            </motion.span>
            <div style={{display:"flex",gap:"4px",marginLeft:"4px"}}>
              {[0,1,2,3].map(i=>(
                <motion.div key={i} animate={{background:streak>i?"var(--accent-primary)":"var(--border-strong)"}}
                  style={{width:"7px",height:"7px",borderRadius:"50%"}}/>
              ))}
            </div>
          </div>
          {config.mode==="timed"
            ? <span style={{fontFamily:"var(--font-mono)",fontSize:"20px",fontWeight:700,color:timerColor}}>{timeLeft}s</span>
            : <div style={{display:"flex",alignItems:"center",gap:"4px",fontFamily:"var(--font-mono)",fontSize:"13px",color:"var(--xp-color)"}}>{Ico.star}{totalXP}</div>
          }
        </div>
        {config.mode==="timed"&&(
          <div style={{height:"5px",borderRadius:"9999px",background:"var(--border-default)",marginBottom:"12px",overflow:"hidden"}}>
            <motion.div animate={{width:`${timerPct*100}%`}} transition={{duration:1,ease:"linear"}}
              style={{height:"100%",borderRadius:"9999px",background:timerColor,transition:"background 0.3s"}}/>
          </div>
        )}

        {/* Word card */}
        <AnimatePresence mode="wait">
          <motion.div key={currentWord.id}
            initial={{opacity:0,y:24,scale:0.97}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-16,scale:0.97}}
            transition={{type:"spring",stiffness:320,damping:28}}
            style={{
              width:"100%",background:"var(--card-bg)",border:"1px solid var(--card-border)",
              borderRadius:"20px",padding:"clamp(24px,5vw,40px) clamp(20px,5vw,36px)",
              textAlign:"center" as const,marginBottom:"20px",position:"relative",
              boxShadow:feedback==="correct"?"0 0 32px var(--color-success)44":feedback==="wrong"?"0 0 32px var(--color-danger)44":"0 0 48px var(--accent-glow)",
            }}>
            <div style={{position:"absolute",top:"12px",left:"14px",display:"flex",alignItems:"center",gap:"5px"}}>
              <span style={{fontSize:"10px",color:"var(--text-muted)",textTransform:"capitalize" as const,fontFamily:"var(--font-body)"}}>{currentWord.category}</span>
              <span>{MARK_ICONS[markLv]}</span>
            </div>
            <div style={{position:"absolute",top:"14px",right:"14px",display:"flex",gap:"3px"}}>
              {[1,2,3,4,5].map(d=><div key={d} style={{width:"5px",height:"5px",borderRadius:"50%",background:d<=currentWord.difficulty?"var(--accent-secondary)":"var(--border-default)"}}/>)}
            </div>
            <h1 style={{fontFamily:"var(--font-display)",fontSize:"clamp(2rem,8vw,3.5rem)",fontWeight:700,color:"var(--text-primary)",margin:"8px 0 6px",lineHeight:1.1,letterSpacing:"-0.02em"}}>
              {inverted ? currentWord.thai : currentWord.english}
            </h1>
            {config.hintsEnabled&&!inverted&&currentWord.phonetic&&(
              <p style={{fontFamily:"var(--font-mono)",fontSize:"14px",color:"var(--text-muted)",margin:"0 0 8px"}}>/{currentWord.phonetic}/</p>
            )}
            {config.hintsEnabled&&!inverted&&currentWord.example&&(
              <p style={{fontFamily:"var(--font-body)",fontSize:"13px",color:"var(--text-secondary)",fontStyle:"italic",margin:0}}>"{currentWord.example}"</p>
            )}
            <AnimatePresence>
              {masteredNow&&(
                <motion.div initial={{opacity:0,scale:0.8}} animate={{opacity:1,scale:1}} exit={{opacity:0}}
                  style={{position:"absolute",top:"-14px",left:"50%",transform:"translateX(-50%)",background:"var(--mastered-color)",color:"#fff",padding:"4px 18px",borderRadius:"9999px",fontSize:"12px",fontWeight:700,fontFamily:"var(--font-body)",whiteSpace:"nowrap" as const,letterSpacing:"0.06em",textTransform:"uppercase" as const}}>
                  ⭐ Word Mastered!
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>

        {/* Options: 2x2 grid for multiple-choice & timed */}
        {(config.mode==="multiple-choice"||config.mode==="timed")&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
            {options.map((opt,i)=>{
              const os = getOptionStyle(theme, i as 0|1|2|3)
              const isSelected=selected===opt
              const isCorrect=opt===currentWord.thai
              let bg=os.bg,border=os.border,color=os.text
              if(selected!==null){
                if(isCorrect){bg="var(--option-correct)";border="var(--color-success)";color="var(--color-success)"}
                else if(isSelected){bg="var(--option-wrong)";border="var(--color-danger)";color="var(--color-danger)"}
              }
              return (
                <motion.button key={i} onClick={()=>{if(selected!==null)return;handleAnswer(opt,opt===currentWord.thai)}}
                  initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}
                  whileHover={selected===null?{scale:1.02}:{}} whileTap={selected===null?{scale:0.97}:{}}
                  style={{padding:"16px 12px",borderRadius:"14px",border:`1.5px solid ${border}`,background:bg,color,
                    fontFamily:"var(--font-display)",fontSize:"clamp(14px,3vw,18px)",fontWeight:600,
                    cursor:selected===null?"pointer":"default",display:"flex",alignItems:"center",
                    justifyContent:"space-between",transition:"all 0.2s",textAlign:"left" as const,minHeight:"64px"}}>
                  <span style={{flex:1}}>{opt}</span>
                  {selected!==null&&isCorrect&&<span style={{color:"var(--color-success)",flexShrink:0}}>{Ico.check}</span>}
                  {selected!==null&&isSelected&&!isCorrect&&<span style={{color:"var(--color-danger)",flexShrink:0}}>{Ico.x}</span>}
                </motion.button>
              )
            })}
          </div>
        )}

        {/* Think & Reveal */}
        {config.mode==="think-reveal"&&(
          <div style={{width:"100%",display:"flex",flexDirection:"column",gap:"10px"}}>
            {!revealed
              ? <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}} onClick={()=>setRevealed(true)}
                  style={{width:"100%",padding:"20px",borderRadius:"14px",border:"1px solid var(--accent-primary)",
                    background:"transparent",color:"var(--accent-primary)",fontFamily:"var(--font-display)",fontSize:"18px",
                    fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"10px"}}>
                  {Ico.eye} Reveal Answer
                </motion.button>
              : <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}>
                  <div style={{textAlign:"center" as const,padding:"20px",borderRadius:"14px",border:"1px solid var(--border-default)",background:"var(--bg-subtle)",marginBottom:"12px"}}>
                    <span style={{fontFamily:"var(--font-display)",fontSize:"32px",fontWeight:700,color:"var(--text-primary)"}}>{currentWord.thai}</span>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
                    <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}} onClick={()=>handleAnswer("__correct__",true)}
                      style={{padding:"14px",borderRadius:"12px",border:"1px solid var(--color-success)",background:"var(--option-correct)",color:"var(--color-success)",fontFamily:"var(--font-body)",fontSize:"15px",fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"8px"}}>
                      {Ico.check} ถูก
                    </motion.button>
                    <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}} onClick={()=>handleAnswer("__wrong__",false)}
                      style={{padding:"14px",borderRadius:"12px",border:"1px solid var(--color-danger)",background:"var(--option-wrong)",color:"var(--color-danger)",fontFamily:"var(--font-body)",fontSize:"15px",fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"8px"}}>
                      {Ico.x} ผิด
                    </motion.button>
                  </div>
                </motion.div>
            }
          </div>
        )}

        {/* Typing / Invert */}
        {isTyping&&(
          <TypingInput word={currentWord} pool={inverted?allEnglish:allThai} inverted={inverted}
            onAnswer={(correct,typed)=>handleAnswer(typed,correct)}/>
        )}

        {/* Feedback */}
        <AnimatePresence>
          {feedback&&(
            <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0}}
              style={{marginTop:"16px",padding:"10px 24px",borderRadius:"9999px",display:"flex",justifyContent:"center",
                background:feedback==="correct"?"var(--color-success)":"var(--color-danger)",
                color:"#fff",fontFamily:"var(--font-body)",fontSize:"14px",fontWeight:600}}>
              {feedback==="correct"?"✓ ถูกต้อง!":("✗ คำตอบที่ถูก: "+(inverted?currentWord.english:currentWord.thai))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mark level picker */}
        <AnimatePresence>
          {showMarkPicker&&(
            <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}} style={{marginTop:"16px"}}>
              <p style={{fontFamily:"var(--font-body)",fontSize:"11px",color:"var(--text-muted)",textAlign:"center" as const,margin:"0 0 8px",textTransform:"uppercase" as const,letterSpacing:"0.07em"}}>ทำเครื่องหมายคำนี้</p>
              <div style={{display:"flex",gap:"6px",justifyContent:"center",flexWrap:"wrap" as const}}>
                {([0,1,2,3] as MarkLevel[]).map(lv=>(
                  <motion.button key={lv} whileHover={{scale:1.06}} whileTap={{scale:0.94}} onClick={()=>setMarkLevel(lv)}
                    style={{padding:"6px 12px",borderRadius:"9999px",border:"1px solid",
                      borderColor:markLv===lv?"var(--accent-primary)":"var(--border-default)",
                      background:markLv===lv?"var(--accent-primary)":"var(--bg-subtle)",
                      color:markLv===lv?"var(--text-on-accent)":"var(--text-secondary)",
                      fontFamily:"var(--font-body)",fontSize:"12px",cursor:"pointer",
                      display:"flex",alignItems:"center",gap:"4px",transition:"all 0.15s"}}>
                    {MARK_ICONS[lv]} {MARK_LABELS[lv]}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
