// english-card-game/src/app/theme-editor/page.tsx
"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { NavBar } from "../../components/NavBar"
import { useTheme } from "../../themes/ThemeProvider"
import {
  Theme, BUILTIN_THEMES, saveCustomTheme, deleteCustomTheme,
  loadCustomThemes, getOptionStyle, themeToCSSVars,
} from "../../themes/themes"

const GOOGLE_FONTS = [
  { label:"Outfit (modern)",   import:"https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap",       display:"'Outfit',sans-serif",   body:"'Outfit',sans-serif",   mono:"'Outfit',monospace" },
  { label:"Inter (clean)",     import:"https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap",             display:"'Inter',sans-serif",    body:"'Inter',sans-serif",    mono:"'Inter',monospace" },
  { label:"Quicksand (round)", import:"https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap",    display:"'Quicksand',sans-serif",body:"'Quicksand',sans-serif",mono:"'Quicksand',monospace" },
  { label:"Lora (serif)",      import:"https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&display=swap", display:"'Lora',serif",          body:"'Lora',serif",          mono:"'Lora',monospace" },
  { label:"Space Mono",        import:"https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap",           display:"'Space Mono',monospace",body:"'Space Mono',monospace",mono:"'Space Mono',monospace" },
  { label:"Raleway (elegant)", import:"https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;600;700&display=swap",      display:"'Raleway',sans-serif",  body:"'Raleway',sans-serif",  mono:"'Raleway',monospace" },
  { label:"Exo 2 (tech)",      import:"https://fonts.googleapis.com/css2?family=Exo+2:wght@300;400;700;900&display=swap",       display:"'Exo 2',sans-serif",    body:"'Exo 2',sans-serif",    mono:"'Exo 2',monospace" },
  { label:"Nunito (friendly)", import:"https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap",           display:"'Nunito',sans-serif",   body:"'Nunito',sans-serif",   mono:"'Nunito',monospace" },
]

type CF = { key: keyof Theme["colors"]; label: string; group: string }
const COLOR_FIELDS: CF[] = [
  {key:"bgBase",        label:"Page Background",    group:"Background"},
  {key:"bgSurface",     label:"Card / Panel",        group:"Background"},
  {key:"bgElevated",    label:"Modal / Popup",        group:"Background"},
  {key:"bgSubtle",      label:"Subtle Tint",          group:"Background"},
  {key:"borderDefault", label:"Border Default",       group:"Border"},
  {key:"borderStrong",  label:"Border Strong",        group:"Border"},
  {key:"textPrimary",   label:"Text Primary",         group:"Text"},
  {key:"textSecondary", label:"Text Secondary",       group:"Text"},
  {key:"textMuted",     label:"Text Muted",           group:"Text"},
  {key:"textOnAccent",  label:"Text on Accent",       group:"Text"},
  {key:"accentPrimary", label:"Accent Primary",       group:"Accent"},
  {key:"accentSecondary",label:"Accent Secondary",    group:"Accent"},
  {key:"success",       label:"Success",              group:"Semantic"},
  {key:"successBg",     label:"Success Background",   group:"Semantic"},
  {key:"danger",        label:"Danger",               group:"Semantic"},
  {key:"dangerBg",      label:"Danger Background",    group:"Semantic"},
  {key:"warning",       label:"Warning",              group:"Semantic"},
  {key:"warningBg",     label:"Warning Background",   group:"Semantic"},
  {key:"cardBg",        label:"Word Card BG",         group:"Game"},
  {key:"cardBorder",    label:"Word Card Border",     group:"Game"},
  {key:"optionBg",      label:"Option Default BG",    group:"Game"},
  {key:"optionCorrect", label:"Option Correct",       group:"Game"},
  {key:"optionWrong",   label:"Option Wrong",         group:"Game"},
  {key:"streakColor",   label:"Streak / Fire",        group:"Game"},
  {key:"masteredColor", label:"Mastered Badge",       group:"Game"},
  {key:"xpColor",       label:"XP Counter",           group:"Game"},
  {key:"option0Bg",     label:"Option A BG",          group:"Per-Option"},
  {key:"option0Border", label:"Option A Border",      group:"Per-Option"},
  {key:"option0Text",   label:"Option A Text",        group:"Per-Option"},
  {key:"option1Bg",     label:"Option B BG",          group:"Per-Option"},
  {key:"option1Border", label:"Option B Border",      group:"Per-Option"},
  {key:"option1Text",   label:"Option B Text",        group:"Per-Option"},
  {key:"option2Bg",     label:"Option C BG",          group:"Per-Option"},
  {key:"option2Border", label:"Option C Border",      group:"Per-Option"},
  {key:"option2Text",   label:"Option C Text",        group:"Per-Option"},
  {key:"option3Bg",     label:"Option D BG",          group:"Per-Option"},
  {key:"option3Border", label:"Option D Border",      group:"Per-Option"},
  {key:"option3Text",   label:"Option D Text",        group:"Per-Option"},
]
const GROUPS = [...new Set(COLOR_FIELDS.map(f=>f.group))]

function blankTheme(): Theme {
  return {
    id:"custom-"+Date.now(), name:"My Theme", emoji:"🎨", isDark:true, isCustom:true,
    colors:{
      bgBase:"#0D0F1A",bgSurface:"#161928",bgElevated:"#1E2236",bgSubtle:"#252A42",
      borderDefault:"#2D3354",borderStrong:"#4A5280",
      textPrimary:"#EEF0FF",textSecondary:"#9AA3C8",textMuted:"#5C6490",textOnAccent:"#FFFFFF",
      accentPrimary:"#7C6DFA",accentSecondary:"#A78BFA",accentGlow:"rgba(124,109,250,0.35)",
      success:"#34D399",successBg:"#0D2E23",danger:"#F87171",dangerBg:"#2E1111",
      warning:"#FBBF24",warningBg:"#2E2100",
      cardBg:"#1A1E32",cardBorder:"#353A60",
      optionBg:"#1E2236",optionHover:"#252A46",optionCorrect:"#0D2E23",optionWrong:"#2E1111",
      streakColor:"#FBBF24",masteredColor:"#34D399",xpColor:"#A78BFA",
    },
    fonts:GOOGLE_FONTS[0],
  }
}

function ColorRow({field,value,onChange}:{field:CF;value:string;onChange:(v:string)=>void}) {
  const isRgba = value?.startsWith("rgba")
  return (
    <div style={{display:"flex",alignItems:"center",gap:"10px",padding:"7px 0",
      borderBottom:"1px solid var(--border-default)"}}>
      <div style={{width:"28px",height:"28px",borderRadius:"6px",flexShrink:0,
        background:value||"#888",border:"1px solid var(--border-strong)"}}/>
      <span style={{flex:1,fontFamily:"var(--font-body)",fontSize:"13px",color:"var(--text-primary)"}}>{field.label}</span>
      {!isRgba && (
        <input type="color" value={value?.startsWith("#")?value:"#888888"}
          onChange={e=>onChange(e.target.value)}
          style={{width:"36px",height:"28px",borderRadius:"6px",border:"1px solid var(--border-default)",
            cursor:"pointer",padding:"2px",background:"transparent"}}/>
      )}
      <input type="text" value={value??""} onChange={e=>onChange(e.target.value)}
        placeholder="#000 or rgba(...)"
        style={{width:"130px",padding:"5px 8px",borderRadius:"7px",
          border:"1px solid var(--border-default)",background:"var(--bg-subtle)",
          color:"var(--text-primary)",fontFamily:"var(--font-mono)",fontSize:"11px",outline:"none"}}/>
    </div>
  )
}

function PreviewCard({t}:{t:Theme}) {
  const opts=["แมว","สุนัข","ช้าง","เสือ"]
  return (
    <div style={{background:t.colors.cardBg,border:`1px solid ${t.colors.cardBorder}`,
      borderRadius:"14px",padding:"18px",fontFamily:t.fonts.display}}>
      <p style={{color:t.colors.textMuted,fontSize:"10px",margin:"0 0 6px",
        textTransform:"uppercase",letterSpacing:"0.07em"}}>Preview · {t.emoji} {t.name}</p>
      <h2 style={{color:t.colors.textPrimary,fontSize:"26px",fontWeight:700,margin:"0 0 14px",letterSpacing:"-0.02em"}}>cat</h2>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"7px",marginBottom:"12px"}}>
        {opts.map((o,i)=>{
          const os=getOptionStyle(t,i as 0|1|2|3)
          return <div key={i} style={{padding:"9px 11px",borderRadius:"9px",
            background:os.bg,border:`1.5px solid ${os.border}`,
            color:os.text,fontSize:"13px",fontWeight:600}}>{o}</div>
        })}
      </div>
      <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
        <span style={{padding:"3px 10px",borderRadius:"9999px",background:t.colors.accentPrimary,color:t.colors.textOnAccent,fontSize:"11px",fontWeight:600}}>🔥 streak</span>
        <span style={{padding:"3px 10px",borderRadius:"9999px",background:t.colors.successBg,color:t.colors.masteredColor,fontSize:"11px",fontWeight:600}}>⭐ mastered</span>
        <span style={{padding:"3px 10px",borderRadius:"9999px",background:t.colors.bgSubtle,color:t.colors.xpColor,fontSize:"11px",fontWeight:600}}>💎 XP</span>
      </div>
    </div>
  )
}

export default function ThemeEditorPage() {
  const { setTheme, reloadCustomThemes, theme } = useTheme()
  const [mounted,setMounted]     = useState(false)
  const [isPreviewing,setIsPreviewing] = useState(false)
  const [editing,setEditing]     = useState<Theme>(blankTheme())
  const [customList,setCustomList] = useState<Theme[]>([])
  const [group,setGroup]         = useState("Background")
  const [toast,setToast]         = useState("")
  const [tab,setTab]             = useState<"create"|"manage">("create")
  const [inputMode,setInputMode] = useState<"visual"|"json">("visual")
  const [jsonText,setJsonText]   = useState("")
  const [jsonError,setJsonError] = useState("")

  useEffect(()=>{ setMounted(true); setCustomList(loadCustomThemes()) },[])

  function toast2(msg:string){ setToast(msg); setTimeout(()=>setToast(""),2500) }

  function setColor(key:keyof Theme["colors"],val:string){
    setEditing(p=>({...p,colors:{...p.colors,[key]:val}}))
  }

  function saveTheme(){
    if(!editing.name.trim()){ toast2("❌ กรุณาใส่ชื่อ"); return }
    const t:Theme={...editing,id:editing.id||"custom-"+Date.now(),isCustom:true}
    saveCustomTheme(t)
    reloadCustomThemes()
    setCustomList(loadCustomThemes())
    setTheme(t.id)
    toast2("✓ บันทึกและใช้งานแล้ว!")
  }

  function applyJson(){
    setJsonError("")
    try {
      const raw = jsonText.trim()
      // Accept both full Theme object and just colors object
      let parsed = JSON.parse(raw)
      if(parsed.colors){ // full theme
        setEditing(prev=>({...prev,...parsed,colors:{...prev.colors,...parsed.colors},fonts:parsed.fonts??prev.fonts}))
      } else { // just colors
        setEditing(prev=>({...prev,colors:{...prev.colors,...parsed}}))
      }
      setInputMode("visual")
      toast2("✓ นำเข้า JSON สำเร็จ")
    } catch(e:any){
      setJsonError("JSON ไม่ถูกต้อง: " + e.message)
    }
  }

  function exportJson(){
    return JSON.stringify({
      id:editing.id, name:editing.name, emoji:editing.emoji, isDark:editing.isDark,
      colors:editing.colors, fonts:editing.fonts,
    }, null, 2)
  }

  function previewNow(){
    const root=document.documentElement
    Object.entries(themeToCSSVars(editing)).forEach(([k,v])=>root.style.setProperty(k,v))
    setIsPreviewing(true)
  }
  function unpreview(){
    if(!theme) return
    const root=document.documentElement
    Object.entries(themeToCSSVars(theme as unknown as Theme)).forEach(([k,v])=>root.style.setProperty(k,v))
    setIsPreviewing(false)
  }

  function cloneBuiltin(t:Theme){
    setEditing({...t,id:"custom-"+Date.now(),name:`${t.name} (copy)`,isCustom:true})
    setTab("create")
    toast2(`คัดลอก "${t.name}" แล้ว`)
  }

  function removeCustom(id:string){
    deleteCustomTheme(id); reloadCustomThemes(); setCustomList(loadCustomThemes()); toast2("ลบแล้ว")
  }

  if(!mounted) return <div style={{minHeight:"100vh",background:"var(--bg-base)"}}><NavBar/></div>

  const inp:React.CSSProperties={
    width:"100%",padding:"9px 12px",borderRadius:"9px",
    border:"1px solid var(--border-default)",background:"var(--bg-elevated)",
    color:"var(--text-primary)",fontFamily:"var(--font-body)",fontSize:"14px",
    outline:"none",boxSizing:"border-box",
  }

  return (
    <div style={{minHeight:"100vh",background:"var(--bg-base)",paddingBottom:"80px"}}>
      <NavBar/>
      <AnimatePresence>
        {toast&&<motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-20}}
          style={{position:"fixed",top:"72px",left:"50%",transform:"translateX(-50%)",
            background:"var(--color-success)",color:"#fff",padding:"10px 24px",borderRadius:"9999px",
            fontFamily:"var(--font-body)",fontSize:"14px",fontWeight:600,zIndex:200,whiteSpace:"nowrap"}}>
          {toast}
        </motion.div>}
      </AnimatePresence>

      <main style={{maxWidth:"1100px",margin:"0 auto",padding:"24px 16px"}}>
        <div style={{marginBottom:"20px"}}>
          <h1 style={{fontFamily:"var(--font-display)",fontSize:"26px",fontWeight:700,color:"var(--text-primary)",margin:"0 0 4px",letterSpacing:"-0.02em"}}>🎨 Theme Editor</h1>
          <p style={{fontFamily:"var(--font-body)",fontSize:"14px",color:"var(--text-muted)",margin:0}}>สร้าง theme ใหม่ผ่านหน้าเว็บ — บันทึกแล้วใช้ได้ทันที</p>
        </div>

        <div style={{display:"flex",gap:"8px",marginBottom:"20px"}}>
          {(["create","manage"] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{
              padding:"8px 20px",borderRadius:"9999px",border:"1px solid",
              borderColor:tab===t?"var(--accent-primary)":"var(--border-default)",
              background:tab===t?"var(--accent-primary)":"transparent",
              color:tab===t?"var(--text-on-accent)":"var(--text-secondary)",
              fontFamily:"var(--font-body)",fontSize:"13px",fontWeight:tab===t?600:400,cursor:"pointer",
            }}>{t==="create"?"✏️ สร้าง / แก้ไข":"📋 จัดการ"}</button>
          ))}
        </div>

        {tab==="create" && (
          <div style={{display:"grid",gridTemplateColumns:"1fr min(360px,42%)",gap:"20px",alignItems:"start"}}>
            {/* Left controls */}
            <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>

              {/* Input mode toggle */}
              <div style={{display:"flex",gap:"8px",marginBottom:"4px"}}>
                {(["visual","json"] as const).map(m=>(
                  <button key={m} onClick={()=>{
                    if(m==="json") setJsonText(exportJson())
                    setInputMode(m)
                  }} style={{
                    flex:1,padding:"8px",borderRadius:"10px",border:"1px solid",
                    borderColor:inputMode===m?"var(--accent-primary)":"var(--border-default)",
                    background:inputMode===m?"var(--accent-primary)":"transparent",
                    color:inputMode===m?"var(--text-on-accent)":"var(--text-secondary)",
                    fontFamily:"var(--font-body)",fontSize:"13px",fontWeight:inputMode===m?600:400,cursor:"pointer",
                    display:"flex",alignItems:"center",justifyContent:"center",gap:"6px",
                  }}>
                    {m==="visual"?"🎨 Visual":"{ } JSON / Code"}
                  </button>
                ))}
              </div>

              {/* JSON input panel */}
              {inputMode==="json" && (
                <div style={{background:"var(--bg-surface)",border:"1px solid var(--border-default)",borderRadius:"14px",padding:"16px"}}>
                  <p style={{fontFamily:"var(--font-body)",fontSize:"12px",color:"var(--text-muted)",margin:"0 0 8px"}}>
                    วาง JSON ของ theme (full Theme object หรือแค่ colors object ก็ได้)
                  </p>
                  <textarea value={jsonText} onChange={e=>setJsonText(e.target.value)}
                    rows={18} spellCheck={false}
                    style={{width:"100%",padding:"12px",borderRadius:"10px",
                      border:`1px solid ${jsonError?"var(--color-danger)":"var(--border-default)"}`,
                      background:"var(--bg-elevated)",color:"var(--text-primary)",
                      fontFamily:"monospace",fontSize:"12px",outline:"none",
                      boxSizing:"border-box",resize:"vertical",lineHeight:1.5,
                    }}/>
                  {jsonError && <p style={{fontFamily:"var(--font-body)",fontSize:"12px",color:"var(--color-danger)",margin:"6px 0 0"}}>{jsonError}</p>}
                  <div style={{display:"flex",gap:"8px",marginTop:"10px"}}>
                    <button onClick={()=>setInputMode("visual")} style={{flex:1,padding:"9px",borderRadius:"9px",border:"1px solid var(--border-default)",background:"transparent",color:"var(--text-secondary)",fontFamily:"var(--font-body)",fontSize:"13px",cursor:"pointer"}}>ยกเลิก</button>
                    <button onClick={applyJson} style={{flex:2,padding:"9px",borderRadius:"9px",border:"none",background:"var(--accent-primary)",color:"var(--text-on-accent)",fontFamily:"var(--font-body)",fontSize:"13px",fontWeight:700,cursor:"pointer"}}>✓ นำเข้า JSON</button>
                  </div>
                </div>
              )}

              {inputMode==="visual" && <>

              {/* Basic */}
              <div style={{background:"var(--bg-surface)",border:"1px solid var(--border-default)",borderRadius:"16px",padding:"18px"}}>
                <h2 style={{fontFamily:"var(--font-display)",fontSize:"15px",fontWeight:600,color:"var(--text-primary)",margin:"0 0 12px"}}>ข้อมูลพื้นฐาน</h2>
                <div style={{display:"grid",gridTemplateColumns:"1fr 70px",gap:"10px",marginBottom:"10px"}}>
                  <div>
                    <label style={{display:"block",fontSize:"11px",color:"var(--text-muted)",marginBottom:"3px",fontFamily:"var(--font-body)",textTransform:"uppercase",letterSpacing:"0.06em"}}>ชื่อ</label>
                    <input style={inp} value={editing.name} onChange={e=>setEditing(p=>({...p,name:e.target.value}))} placeholder="My Awesome Theme"/>
                  </div>
                  <div>
                    <label style={{display:"block",fontSize:"11px",color:"var(--text-muted)",marginBottom:"3px",fontFamily:"var(--font-body)",textTransform:"uppercase",letterSpacing:"0.06em"}}>Emoji</label>
                    <input style={inp} value={editing.emoji} onChange={e=>setEditing(p=>({...p,emoji:e.target.value}))} maxLength={2}/>
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 12px",borderRadius:"9px",border:"1px solid var(--border-default)",background:"var(--bg-subtle)"}}>
                  <span style={{fontFamily:"var(--font-body)",fontSize:"13px",color:"var(--text-primary)"}}>Dark Mode</span>
                  <button onClick={()=>setEditing(p=>({...p,isDark:!p.isDark}))} style={{width:"40px",height:"22px",borderRadius:"9999px",border:"none",cursor:"pointer",position:"relative",background:editing.isDark?"var(--accent-primary)":"var(--border-strong)",transition:"background 0.2s"}}>
                    <motion.div animate={{x:editing.isDark?18:2}} transition={{type:"spring",stiffness:500,damping:30}}
                      style={{width:"18px",height:"18px",borderRadius:"50%",background:"#fff",position:"absolute",top:"2px"}}/>
                  </button>
                </div>
              </div>

              {/* Font */}
              <div style={{background:"var(--bg-surface)",border:"1px solid var(--border-default)",borderRadius:"16px",padding:"18px"}}>
                <h2 style={{fontFamily:"var(--font-display)",fontSize:"15px",fontWeight:600,color:"var(--text-primary)",margin:"0 0 12px"}}>Font</h2>
                <div style={{display:"flex",flexDirection:"column",gap:"5px"}}>
                  {GOOGLE_FONTS.map((f,i)=>(
                    <button key={i} onClick={()=>setEditing(p=>({...p,fonts:f}))} style={{
                      padding:"9px 12px",borderRadius:"9px",border:"1px solid",
                      borderColor:editing.fonts.import===f.import?"var(--accent-primary)":"var(--border-default)",
                      background:editing.fonts.import===f.import?"var(--bg-subtle)":"transparent",
                      color:editing.fonts.import===f.import?"var(--accent-primary)":"var(--text-secondary)",
                      fontFamily:"var(--font-body)",fontSize:"13px",textAlign:"left",cursor:"pointer",
                      display:"flex",justifyContent:"space-between",alignItems:"center",
                    }}>
                      <span>{f.label}</span>
                      {editing.fonts.import===f.import&&<span style={{fontSize:"10px",opacity:0.7}}>✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div style={{background:"var(--bg-surface)",border:"1px solid var(--border-default)",borderRadius:"16px",padding:"18px"}}>
                <h2 style={{fontFamily:"var(--font-display)",fontSize:"15px",fontWeight:600,color:"var(--text-primary)",margin:"0 0 12px"}}>Colors</h2>
                <div style={{display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"14px"}}>
                  {GROUPS.map(g=>(
                    <button key={g} onClick={()=>setGroup(g)} style={{
                      padding:"4px 11px",borderRadius:"9999px",border:"1px solid",
                      borderColor:group===g?"var(--accent-primary)":"var(--border-default)",
                      background:group===g?"var(--accent-primary)":"transparent",
                      color:group===g?"var(--text-on-accent)":"var(--text-secondary)",
                      fontFamily:"var(--font-body)",fontSize:"12px",cursor:"pointer",transition:"all 0.15s",
                    }}>{g}</button>
                  ))}
                </div>
                {COLOR_FIELDS.filter(f=>f.group===group).map(field=>(
                  <ColorRow key={String(field.key)} field={field}
                    value={(editing.colors[field.key] as string)??""}
                    onChange={v=>setColor(field.key,v)}/>
                ))}
              </div>

              {/* Clone from builtin */}
              <div style={{background:"var(--bg-surface)",border:"1px solid var(--border-default)",borderRadius:"16px",padding:"18px"}}>
                <h2 style={{fontFamily:"var(--font-display)",fontSize:"15px",fontWeight:600,color:"var(--text-primary)",margin:"0 0 12px"}}>เริ่มจาก theme สำเร็จรูป</h2>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"7px"}}>
                  {BUILTIN_THEMES.map(t=>(
                    <button key={t.id} onClick={()=>cloneBuiltin(t)} style={{
                      padding:"9px 12px",borderRadius:"10px",border:"1px solid var(--border-default)",
                      background:"var(--bg-subtle)",color:"var(--text-primary)",
                      fontFamily:"var(--font-body)",fontSize:"13px",cursor:"pointer",
                      display:"flex",alignItems:"center",gap:"8px",
                    }}>
                      <span style={{fontSize:"16px"}}>{t.emoji}</span><span>{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              </>
              }
            </div>

            {/* Right: preview sticky */}
            <div style={{position:"sticky",top:"80px",display:"flex",flexDirection:"column",gap:"12px"}}>
              <PreviewCard t={editing}/>
              <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}} onClick={isPreviewing ? unpreview : previewNow}
                style={{width:"100%",padding:"11px",borderRadius:"12px",border:"1px solid var(--accent-primary)",
                  background:"transparent",color:"var(--accent-primary)",fontFamily:"var(--font-body)",fontSize:"14px",fontWeight:600,cursor:"pointer"}}>
                {isPreviewing ? "🙈 Unpreview" : "👁️ Preview ทันที"}
              </motion.button>
              {isPreviewing && (
                <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}} onClick={unpreview}
                  style={{width:"100%",padding:"11px",borderRadius:"12px",border:"1px solid var(--border-default)",
                    background:"transparent",color:"var(--text-secondary)",fontFamily:"var(--font-body)",fontSize:"13px",cursor:"pointer"}}>
                  🔄 Restore Current Theme
                </motion.button>
              )}
              <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}} onClick={saveTheme}
                style={{width:"100%",padding:"14px",borderRadius:"12px",border:"none",
                  background:"var(--accent-primary)",color:"var(--text-on-accent)",
                  fontFamily:"var(--font-body)",fontSize:"15px",fontWeight:700,cursor:"pointer",
                  boxShadow:"0 0 24px var(--accent-glow)"}}>
                💾 บันทึกและใช้งาน
              </motion.button>
              <p style={{fontFamily:"var(--font-body)",fontSize:"12px",color:"var(--text-muted)",textAlign:"center",margin:0}}>
                บันทึกใน localStorage — ใช้ได้ทันที ไม่ต้องแก้โค้ด
              </p>
            </div>
          </div> /* <-- THIS WAS THE MISSING CLOSING DIV */
        )}

        {tab==="manage" && (
          <div>
            <h2 style={{fontFamily:"var(--font-display)",fontSize:"18px",fontWeight:600,color:"var(--text-primary)",margin:"0 0 16px"}}>Custom Themes ({customList.length})</h2>
            {customList.length===0 ? (
              <div style={{textAlign:"center",padding:"60px 0",color:"var(--text-muted)",fontFamily:"var(--font-body)"}}>
                <div style={{fontSize:"40px",marginBottom:"12px"}}>🎨</div>
                <p>ยังไม่มี — สร้างได้ที่แท็บ "สร้าง / แก้ไข"</p>
              </div>
            ) : (
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:"16px"}}>
                {customList.map(t=>(
                  <motion.div key={t.id} layout initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
                    style={{background:"var(--bg-surface)",border:"1px solid var(--border-default)",borderRadius:"16px",padding:"16px"}}>
                    <PreviewCard t={t}/>
                    <div style={{display:"flex",gap:"8px",marginTop:"12px"}}>
                      <button onClick={()=>{setEditing({...t});setTab("create")}} style={{flex:1,padding:"8px",borderRadius:"9px",border:"1px solid var(--accent-primary)",background:"transparent",color:"var(--accent-primary)",fontFamily:"var(--font-body)",fontSize:"13px",cursor:"pointer"}}>✏️ แก้ไข</button>
                      <button onClick={()=>setTheme(t.id)} style={{flex:1,padding:"8px",borderRadius:"9px",border:"none",background:"var(--accent-primary)",color:"var(--text-on-accent)",fontFamily:"var(--font-body)",fontSize:"13px",fontWeight:600,cursor:"pointer"}}>✓ ใช้</button>
                      <button onClick={()=>removeCustom(t.id)} style={{padding:"8px 12px",borderRadius:"9px",border:"1px solid var(--color-danger)",background:"transparent",color:"var(--color-danger)",fontFamily:"var(--font-body)",fontSize:"13px",cursor:"pointer"}}>🗑️</button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
