// english-card-game/src/app/my-words/page.tsx
"use client"
import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { NavBar } from "../../components/NavBar"
import { useAuth } from "../../hooks/useAuth"
import { VocabWord, Difficulty } from "../../types/game"

const DIFF_LABEL: Record<Difficulty,string> = {1:"Beginner",2:"Easy",3:"Medium",4:"Hard",5:"Expert"}

const DEFAULT_WORDS: VocabWord[] = [
  { id:"u1", english:"resilient", thai:"ยืดหยุ่น", phonetic:"rih-ZIL-yent", example:"She is resilient under pressure.", category:"adjectives", difficulty:3, isUserWord:true, showInAllQuiz:true },
  { id:"u2", english:"ephemeral", thai:"ชั่วคราว",  phonetic:"ih-FEM-er-ul",  example:"Beauty is ephemeral.",           category:"adjectives", difficulty:4, isUserWord:true, showInAllQuiz:false },
]

type ShowMode = "all" | "sometimes" | "personal-only"
const SHOW_OPTIONS: { id:ShowMode; label:string; desc:string }[] = [
  { id:"all",           label:"ทุก Quiz",        desc:"แสดงใน quiz ทั้งหมดเหมือนคำปกติ" },
  { id:"sometimes",     label:"บางครั้ง",         desc:"แสดงใน quiz ทั่วไปแค่ 30%" },
  { id:"personal-only", label:"เฉพาะ Quiz ส่วนตัว", desc:"ไม่นับสถิติ leaderboard" },
]

function WordForm({ initial, onSave, onCancel }:{
  initial?:Partial<VocabWord>; onSave:(w:VocabWord,show:ShowMode)=>void; onCancel:()=>void
}) {
  const [form,setForm]     = useState({ english:initial?.english??"",thai:initial?.thai??"",phonetic:initial?.phonetic??"",example:initial?.example??"",category:"user-words",difficulty:"2" })
  const [showMode,setShowMode] = useState<ShowMode>(initial?.showInAllQuiz===false?"personal-only":"all")
  const inp:React.CSSProperties={width:"100%",padding:"9px 12px",borderRadius:"9px",border:"1px solid var(--border-default)",background:"var(--bg-elevated)",color:"var(--text-primary)",fontFamily:"var(--font-body)",fontSize:"14px",outline:"none",boxSizing:"border-box"}
  const label:React.CSSProperties={display:"block",fontSize:"11px",color:"var(--text-muted)",marginBottom:"3px",fontFamily:"var(--font-body)",textTransform:"uppercase",letterSpacing:"0.06em"}

  function submit(e:React.FormEvent){
    e.preventDefault()
    if(!form.english||!form.thai)return
    onSave({
      id:initial?.id??"u-"+Date.now(),
      english:form.english.trim(),thai:form.thai.trim(),
      phonetic:form.phonetic.trim()||undefined,
      example:form.example.trim()||undefined,
      category:"user-words",
      difficulty:parseInt(form.difficulty) as Difficulty,
      isUserWord:true,
      showInAllQuiz:showMode!=="personal-only",
    }, showMode)
  }

  return (
    <form onSubmit={submit} style={{display:"flex",flexDirection:"column",gap:"12px"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
        <div><label style={label}>English *</label><input style={inp} required value={form.english} onChange={e=>setForm(p=>({...p,english:e.target.value}))} placeholder="e.g. resilient"/></div>
        <div><label style={label}>Thai *</label><input style={inp} required value={form.thai} onChange={e=>setForm(p=>({...p,thai:e.target.value}))} placeholder="e.g. ยืดหยุ่น"/></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
        <div><label style={label}>Phonetic</label><input style={inp} value={form.phonetic} onChange={e=>setForm(p=>({...p,phonetic:e.target.value}))} placeholder="rih-ZIL-yent"/></div>
        <div><label style={label}>Difficulty</label>
          <select style={inp} value={form.difficulty} onChange={e=>setForm(p=>({...p,difficulty:e.target.value}))}>
            {[1,2,3,4,5].map(d=><option key={d} value={d}>{DIFF_LABEL[d as Difficulty]}</option>)}
          </select>
        </div>
      </div>
      <div><label style={label}>Example Sentence</label><input style={inp} value={form.example} onChange={e=>setForm(p=>({...p,example:e.target.value}))} placeholder="She is resilient under pressure."/></div>

      {/* Show mode selector */}
      <div>
        <label style={{...label,marginBottom:"8px"}}>แสดงใน Quiz ไหนบ้าง?</label>
        <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
          {SHOW_OPTIONS.map(opt=>(
            <button key={opt.id} type="button" onClick={()=>setShowMode(opt.id)} style={{
              padding:"10px 14px",borderRadius:"10px",border:"1px solid",
              borderColor:showMode===opt.id?"var(--accent-primary)":"var(--border-default)",
              background:showMode===opt.id?"var(--bg-subtle)":"transparent",
              color:showMode===opt.id?"var(--accent-primary)":"var(--text-secondary)",
              fontFamily:"var(--font-body)",fontSize:"13px",textAlign:"left",cursor:"pointer",
              display:"flex",justifyContent:"space-between",alignItems:"center",
            }}>
              <div>
                <div style={{fontWeight:showMode===opt.id?600:400}}>{opt.label}</div>
                <div style={{fontSize:"11px",color:"var(--text-muted)",marginTop:"2px"}}>{opt.desc}</div>
              </div>
              {showMode===opt.id&&<span style={{color:"var(--accent-primary)"}}>✓</span>}
            </button>
          ))}
        </div>
      </div>

      <div style={{display:"flex",gap:"10px",marginTop:"4px"}}>
        <button type="button" onClick={onCancel} style={{flex:1,padding:"10px",borderRadius:"10px",border:"1px solid var(--border-default)",background:"transparent",color:"var(--text-secondary)",fontFamily:"var(--font-body)",fontSize:"14px",cursor:"pointer"}}>ยกเลิก</button>
        <button type="submit" style={{flex:2,padding:"10px",borderRadius:"10px",border:"none",background:"var(--accent-primary)",color:"var(--text-on-accent)",fontFamily:"var(--font-body)",fontSize:"14px",fontWeight:600,cursor:"pointer"}}>บันทึก</button>
      </div>
    </form>
  )
}

// ── Personal Quiz stats (not linked to leaderboard) ───────────
function PersonalStats({ words }:{ words:VocabWord[] }) {
  return (
    <div style={{background:"var(--bg-surface)",border:"1px solid var(--border-default)",borderRadius:"14px",padding:"16px"}}>
      <h3 style={{fontFamily:"var(--font-display)",fontSize:"15px",fontWeight:600,color:"var(--text-primary)",margin:"0 0 12px"}}>📊 สถิติส่วนตัว</h3>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px"}}>
        {[
          { label:"คำทั้งหมด",   value:words.length },
          { label:"ทุก Quiz",     value:words.filter(w=>w.showInAllQuiz).length },
          { label:"ส่วนตัวเท่านั้น", value:words.filter(w=>!w.showInAllQuiz).length },
        ].map((s,i)=>(
          <div key={i} style={{textAlign:"center",padding:"10px",borderRadius:"10px",background:"var(--bg-subtle)"}}>
            <div style={{fontFamily:"var(--font-mono)",fontSize:"20px",fontWeight:700,color:"var(--accent-primary)"}}>{s.value}</div>
            <div style={{fontFamily:"var(--font-body)",fontSize:"11px",color:"var(--text-muted)",marginTop:"2px"}}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{marginTop:"12px",padding:"10px 14px",borderRadius:"10px",background:"var(--bg-subtle)",fontFamily:"var(--font-body)",fontSize:"12px",color:"var(--text-muted)"}}>
        ℹ️ สถิติจาก Quiz ส่วนตัว ไม่นำไปเปรียบเทียบกับผู้อื่นใน Leaderboard
      </div>
    </div>
  )
}

export default function MyWordsPage() {
  const { user, ready } = useAuth()
  const [words,setWords]       = useState<VocabWord[]>(DEFAULT_WORDS)
  const [adding,setAdding]     = useState(false)
  const [editId,setEditId]     = useState<string|null>(null)
  const [search,setSearch]     = useState("")
  const [filterShow,setFilterShow] = useState<"all"|ShowMode>("all")
  const [toast,setToast]       = useState("")

  type ShowMode = "all" | "sometimes" | "personal-only"

  function toast2(msg:string){ setToast(msg); setTimeout(()=>setToast(""),2500) }

  const filtered = useMemo(()=>words.filter(w=>{
    const ms = !search||(w.english.toLowerCase().includes(search.toLowerCase())||w.thai.includes(search))
    return ms
  }),[words,search])

  function saveWord(w:VocabWord, show:string){
    setWords(prev=>editId ? prev.map(x=>x.id===editId?w:x) : [...prev,w])
    setAdding(false); setEditId(null)
    toast2(editId?"แก้ไขแล้ว ✓":"เพิ่มคำใหม่แล้ว ✓")
  }
  function deleteWord(id:string){ setWords(prev=>prev.filter(w=>w.id!==id)); toast2("ลบแล้ว") }

  if(!ready) return null

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

      <main style={{maxWidth:"760px",margin:"0 auto",padding:"24px 16px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"20px",flexWrap:"wrap",gap:"12px"}}>
          <div>
            <h1 style={{fontFamily:"var(--font-display)",fontSize:"26px",fontWeight:700,color:"var(--text-primary)",margin:"0 0 4px",letterSpacing:"-0.02em"}}>
              👤 คำศัพท์ของฉัน
            </h1>
            <p style={{fontFamily:"var(--font-body)",fontSize:"14px",color:"var(--text-muted)",margin:0}}>
              สวัสดี {user?.emoji} {user?.name} · {words.length} คำ
            </p>
          </div>
          <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}} onClick={()=>{setAdding(true);setEditId(null)}}
            style={{padding:"10px 18px",borderRadius:"11px",border:"none",background:"var(--accent-primary)",color:"var(--text-on-accent)",fontFamily:"var(--font-body)",fontSize:"13px",fontWeight:600,cursor:"pointer"}}>
            ➕ เพิ่มคำ
          </motion.button>
        </div>

        <PersonalStats words={words}/>

        {/* Add form */}
        <AnimatePresence>
          {adding&&(
            <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}} style={{overflow:"hidden",margin:"16px 0"}}>
              <div style={{background:"var(--bg-surface)",border:"1px solid var(--accent-primary)",borderRadius:"16px",padding:"20px"}}>
                <h2 style={{fontFamily:"var(--font-display)",fontSize:"16px",fontWeight:600,color:"var(--text-primary)",margin:"0 0 16px"}}>➕ เพิ่มคำใหม่</h2>
                <WordForm onSave={saveWord} onCancel={()=>setAdding(false)}/>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <input type="search" placeholder="🔍  ค้นหาคำของฉัน..." value={search} onChange={e=>setSearch(e.target.value)}
          style={{width:"100%",padding:"11px 16px",borderRadius:"11px",border:"1px solid var(--border-default)",background:"var(--bg-surface)",color:"var(--text-primary)",fontFamily:"var(--font-body)",fontSize:"14px",outline:"none",boxSizing:"border-box",margin:"16px 0 12px"}}/>

        {/* Word list */}
        <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
          {filtered.map((w,i)=>(
            <motion.div key={w.id} layout initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:Math.min(i*0.03,0.3)}}
              style={{background:"var(--bg-surface)",border:"1px solid var(--border-default)",borderRadius:"12px",padding:"12px 16px"}}>
              {editId===w.id ? (
                <div>
                  <p style={{fontFamily:"var(--font-body)",fontSize:"12px",color:"var(--accent-primary)",fontWeight:600,margin:"0 0 12px"}}>✏️ แก้ไข: {w.english}</p>
                  <WordForm initial={w} onSave={saveWord} onCancel={()=>setEditId(null)}/>
                </div>
              ) : (
                <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap"}}>
                      <span style={{fontFamily:"var(--font-body)",fontSize:"15px",fontWeight:600,color:"var(--text-primary)"}}>{w.english}</span>
                      {w.phonetic&&<span style={{fontFamily:"var(--font-mono)",fontSize:"12px",color:"var(--text-muted)"}}>/{w.phonetic}/</span>}
                      <span style={{fontSize:"11px",padding:"2px 8px",borderRadius:"9999px",
                        background:w.showInAllQuiz?"var(--successBg)":"var(--bg-subtle)",
                        border:`1px solid ${w.showInAllQuiz?"var(--color-success)":"var(--border-default)"}`,
                        color:w.showInAllQuiz?"var(--color-success)":"var(--text-muted)"}}>
                        {w.showInAllQuiz?"🌐 ทุก Quiz":"👤 ส่วนตัว"}
                      </span>
                    </div>
                    <span style={{fontFamily:"var(--font-body)",fontSize:"13px",color:"var(--text-secondary)"}}>{w.thai}</span>
                    {w.example&&<p style={{fontFamily:"var(--font-body)",fontSize:"12px",color:"var(--text-muted)",fontStyle:"italic",margin:"3px 0 0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>"{w.example}"</p>}
                  </div>
                  <div style={{display:"flex",gap:"6px",flexShrink:0}}>
                    <button onClick={()=>setEditId(w.id)} style={{padding:"6px 10px",borderRadius:"8px",border:"1px solid var(--border-default)",background:"transparent",color:"var(--text-secondary)",fontFamily:"var(--font-body)",fontSize:"12px",cursor:"pointer"}}>✏️</button>
                    <button onClick={()=>deleteWord(w.id)} style={{padding:"6px 10px",borderRadius:"8px",border:"1px solid var(--color-danger)",background:"transparent",color:"var(--color-danger)",fontFamily:"var(--font-body)",fontSize:"12px",cursor:"pointer"}}>🗑️</button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
          {filtered.length===0&&(
            <div style={{textAlign:"center",padding:"40px 0",color:"var(--text-muted)",fontFamily:"var(--font-body)"}}>
              <div style={{fontSize:"32px",marginBottom:"8px"}}>📚</div>
              {words.length===0?"กดปุ่ม + เพื่อเพิ่มคำแรกของคุณ":"ไม่พบคำที่ค้นหา"}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
