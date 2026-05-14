// english-card-game/src/components/ApiStatusPanel.tsx
"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useApiStatus, API_ENDPOINTS } from "../hooks/useApiStatus"

const CAT_LABEL: Record<string,string> = {
  database:"App / Database", dict:"Dictionary", translation:"Translation", tts:"Text-to-Speech",
}
const CAT_ICON: Record<string,string> = {
  database:"🗄️", dict:"📚", translation:"🌐", tts:"🔊",
}

export function ApiStatusPanel() {
  const [open, setOpen] = useState(false)
  const { statuses, checking, checkAll, checkOne } = useApiStatus()

  const allOk   = API_ENDPOINTS.every(e => statuses[e.id]?.status === "ok")
  const anyErr  = API_ENDPOINTS.some(e  => statuses[e.id]?.status === "error")
  const anyChecked = Object.keys(statuses).length > 0

  const dotColor = !anyChecked ? "var(--text-muted)"
    : anyErr  ? "var(--color-danger)"
    : allOk   ? "var(--color-success)"
    : "var(--color-warning)"

  return (
    <div style={{position:"relative"}}>
      <button
        onClick={() => { setOpen(o=>!o); if(!open && !anyChecked) checkAll() }}
        title="API Status"
        style={{
          display:"flex",alignItems:"center",gap:"5px",padding:"5px 10px",
          borderRadius:"9999px",border:"1px solid var(--border-default)",
          background:"var(--bg-surface)",color:"var(--text-secondary)",
          cursor:"pointer",fontFamily:"var(--font-body)",fontSize:"12px",
        }}>
        {/* Traffic light dot */}
        <motion.div
          animate={{ opacity:[1,0.4,1] }}
          transition={{ repeat:checking?Infinity:0, duration:0.8 }}
          style={{
            width:"8px",height:"8px",borderRadius:"50%",
            background: checking ? "var(--color-warning)" : dotColor,
            flexShrink:0,
          }}/>
        <span className="hidden sm:inline">API</span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              onClick={()=>setOpen(false)}
              style={{position:"fixed",inset:0,zIndex:40}}/>
            <motion.div
              initial={{opacity:0,y:-8,scale:0.96}} animate={{opacity:1,y:0,scale:1}}
              exit={{opacity:0,y:-8,scale:0.96}}
              transition={{type:"spring",stiffness:400,damping:30}}
              style={{
                position:"absolute",top:"calc(100% + 8px)",right:0,zIndex:50,
                background:"var(--bg-elevated)",border:"1px solid var(--border-default)",
                borderRadius:"16px",padding:"16px",minWidth:"300px",
                boxShadow:"0 8px 32px rgba(0,0,0,0.25)",
              }}>
              {/* Header */}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"}}>
                <span style={{fontFamily:"var(--font-display)",fontSize:"14px",fontWeight:700,color:"var(--text-primary)"}}>
                  🔌 API / Database Status
                </span>
                <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}}
                  onClick={checkAll} disabled={checking}
                  style={{
                    padding:"4px 12px",borderRadius:"8px",border:"1px solid var(--border-default)",
                    background:"transparent",color:"var(--accent-primary)",
                    fontFamily:"var(--font-body)",fontSize:"12px",cursor:"pointer",fontWeight:600,
                  }}>
                  {checking?"⏳ กำลังตรวจ...":"🔄 ตรวจสอบ"}
                </motion.button>
              </div>

              {/* Endpoints by category */}
              {(["database","dict","translation","tts"] as const).map(cat => {
                const eps = API_ENDPOINTS.filter(e=>e.category===cat)
                if(!eps.length) return null
                return (
                  <div key={cat} style={{marginBottom:"12px"}}>
                    <p style={{fontFamily:"var(--font-body)",fontSize:"10px",color:"var(--text-muted)",
                      textTransform:"uppercase",letterSpacing:"0.08em",margin:"0 0 6px"}}>
                      {CAT_ICON[cat]} {CAT_LABEL[cat]}
                    </p>
                    {eps.map(ep => {
                      const s = statuses[ep.id]
                      const color = !s ? "var(--text-muted)"
                        : s.status==="ok"       ? "var(--color-success)"
                        : s.status==="error"    ? "var(--color-danger)"
                        : s.status==="checking" ? "var(--color-warning)"
                        : "var(--text-muted)"
                      return (
                        <div key={ep.id} style={{display:"flex",alignItems:"center",gap:"8px",
                          padding:"7px 8px",borderRadius:"9px",
                          background:"var(--bg-subtle)",marginBottom:"4px"}}>
                          <motion.div
                            animate={s?.status==="checking"?{opacity:[1,0.3,1]}:{}}
                            transition={{repeat:Infinity,duration:0.7}}
                            style={{width:"8px",height:"8px",borderRadius:"50%",
                              background:color,flexShrink:0}}/>
                          <div style={{flex:1}}>
                            <p style={{fontFamily:"var(--font-body)",fontSize:"12px",fontWeight:500,
                              color:"var(--text-primary)",margin:0}}>{ep.name}</p>
                            {s?.detail && (
                              <p style={{fontFamily:"var(--font-body)",fontSize:"10px",
                                color:"var(--text-muted)",margin:0}}>{s.detail}</p>
                            )}
                            {s?.error && (
                              <p style={{fontFamily:"var(--font-body)",fontSize:"10px",
                                color:"var(--color-danger)",margin:0}}>{s.error}</p>
                            )}
                          </div>
                          {s?.latency != null && (
                            <span style={{fontFamily:"var(--font-mono)",fontSize:"11px",color:"var(--text-muted)"}}>
                              {s.latency}ms
                            </span>
                          )}
                          <button onClick={()=>checkOne(ep.id)}
                            style={{padding:"2px 7px",borderRadius:"6px",border:"1px solid var(--border-default)",
                              background:"transparent",color:"var(--text-muted)",fontSize:"11px",cursor:"pointer"}}>
                            ↺
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )
              })}

              {/* Legend */}
              <div style={{display:"flex",gap:"12px",marginTop:"12px",padding:"8px 0",
                borderTop:"1px solid var(--border-default)"}}>
                {[
                  {c:"var(--color-success)","l":"Online"},
                  {c:"var(--color-danger)","l":"Error"},
                  {c:"var(--color-warning)","l":"Checking"},
                  {c:"var(--text-muted)","l":"Unknown"},
                ].map(x=>(
                  <div key={x.l} style={{display:"flex",alignItems:"center",gap:"4px"}}>
                    <div style={{width:"7px",height:"7px",borderRadius:"50%",background:x.c}}/>
                    <span style={{fontFamily:"var(--font-body)",fontSize:"10px",color:"var(--text-muted)"}}>{x.l}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
