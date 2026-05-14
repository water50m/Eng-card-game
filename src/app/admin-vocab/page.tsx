// english-card-game/src/app/admin-vocab/page.tsx
"use client"
import React, { useState, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { NavBar } from "../../components/NavBar"
import { useAuth } from "../../hooks/useAuth"
import { SEED_VOCABULARY, CATEGORIES } from "../../data/vocabulary"
import { VocabWord, Difficulty, QUIZ_CATEGORIES } from "../../types/game"


// ── API Autocomplete helper ────────────────────────────────────
async function fetchWordSuggestions(q: string): Promise<{word:string; def?:string}[]> {
  if(!q || q.length < 2) return []
  try {
    // Datamuse: words similar/starting with query
    const [datamuse, dictRes] = await Promise.allSettled([
      fetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(q+"*")}&md=d&max=6`).then(r=>r.json()),
      fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(q)}`).then(r=>r.json()),
    ])

    const suggestions: {word:string; def?:string}[] = []

    if(datamuse.status==="fulfilled" && Array.isArray(datamuse.value)){
      datamuse.value.forEach((w:any) => {
        suggestions.push({
          word: w.word,
          def: w.defs?.[0]?.replace(/^[a-z]	/,"") ?? undefined,
        })
      })
    }
    // If exact match found in dict API, put it first
    if(dictRes.status==="fulfilled" && Array.isArray(dictRes.value)){
      const exact = dictRes.value[0]
      const def = exact?.meanings?.[0]?.definitions?.[0]?.definition
      const existing = suggestions.findIndex(s=>s.word===q)
      if(existing >= 0) suggestions[existing].def = def
      else suggestions.unshift({ word:q, def })
    }
    return suggestions.slice(0, 8)
  } catch { return [] }
}

async function fetchThaiTranslation(english: string): Promise<string> {
  if(!english) return ""
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(english)}&langpair=en|th`
    )
    const data = await res.json()
    return data?.responseData?.translatedText ?? ""
  } catch { return "" }
}

const DIFF_LABEL: Record<Difficulty,string> = {1:"Beginner",2:"Easy",3:"Medium",4:"Hard",5:"Expert"}
const DIFF_COLOR: Record<Difficulty,string> = {1:"var(--mastered-color)",2:"var(--accent-secondary)",3:"var(--color-warning)",4:"var(--color-danger)",5:"#A855F7"}

const JSON_EXAMPLE = `[
  {
    "english": "persevere",
    "thai": "อดทน",
    "phonetic": "pur-suh-VEER",
    "example": "She persevered despite all obstacles.",
    "category": "verbs",
    "difficulty": 3
  },
  {
    "english": "luminous",
    "thai": "สว่างไสว",
    "phonetic": "LOO-mih-nus",
    "example": "The moon was luminous tonight.",
    "category": "adjectives",
    "difficulty": 3
  }
]`

function WordForm({initial, onSave, onCancel}:{
  initial?:Partial<VocabWord>; onSave:(w:VocabWord)=>void; onCancel:()=>void
}) {
  const [form,setForm] = useState({
    english:   initial?.english   ?? "",
    thai:      initial?.thai      ?? "",
    phonetic:  initial?.phonetic  ?? "",
    example:   initial?.example   ?? "",
    category:  initial?.category  ?? "general",
    difficulty:String(initial?.difficulty ?? 2),
  })
  const inp:React.CSSProperties={
    width:"100%",padding:"9px 12px",borderRadius:"9px",
    border:"1px solid var(--border-default)",background:"var(--bg-elevated)",
    color:"var(--text-primary)",fontFamily:"var(--font-body)",fontSize:"14px",
    outline:"none",boxSizing:"border-box",
  }
  function submit(e:React.FormEvent){
    e.preventDefault()
    if(!form.english||!form.thai)return
    onSave({
      id: initial?.id ?? "custom-"+Date.now(),
      english:form.english.trim(), thai:form.thai.trim(),
      phonetic:form.phonetic.trim()||undefined,
      example:form.example.trim()||undefined,
      category:form.category,
      difficulty:parseInt(form.difficulty) as Difficulty,
      isUserWord:false,
    })
  }
  const label:React.CSSProperties={display:"block",fontSize:"11px",color:"var(--text-muted)",marginBottom:"3px",fontFamily:"var(--font-body)",textTransform:"uppercase",letterSpacing:"0.06em"}
  return (
    <form onSubmit={submit} style={{display:"flex",flexDirection:"column",gap:"12px"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
        <div><label style={label}>English *</label><input style={inp} required value={form.english} onChange={e=>setForm(p=>({...p,english:e.target.value}))} placeholder="e.g. persevere"/></div>
        <div><label style={label}>Thai *</label><input style={inp} required value={form.thai} onChange={e=>setForm(p=>({...p,thai:e.target.value}))} placeholder="e.g. อดทน"/></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
        <div><label style={label}>Phonetic</label><input style={inp} value={form.phonetic} onChange={e=>setForm(p=>({...p,phonetic:e.target.value}))} placeholder="pur-suh-VEER"/></div>
        <div><label style={label}>Difficulty</label>
          <select style={inp} value={form.difficulty} onChange={e=>setForm(p=>({...p,difficulty:e.target.value}))}>
            {[1,2,3,4,5].map(d=><option key={d} value={d}>{DIFF_LABEL[d as Difficulty]}</option>)}
          </select>
        </div>
      </div>
      <div><label style={label}>Example Sentence</label><input style={inp} value={form.example} onChange={e=>setForm(p=>({...p,example:e.target.value}))} placeholder="She persevered despite all obstacles."/></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
        <div><label style={label}>Category</label>
          <select style={inp} value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))}>
            {[...new Set([...CATEGORIES,"engineering","reading-manga","reading-novel","reading-news","daily-life","fruits","top-3000"])].map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div style={{display:"flex",gap:"10px",marginTop:"4px"}}>
        <button type="button" onClick={onCancel} style={{flex:1,padding:"10px",borderRadius:"10px",border:"1px solid var(--border-default)",background:"transparent",color:"var(--text-secondary)",fontFamily:"var(--font-body)",fontSize:"14px",cursor:"pointer"}}>ยกเลิก</button>
        <button type="submit" style={{flex:2,padding:"10px",borderRadius:"10px",border:"none",background:"var(--accent-primary)",color:"var(--text-on-accent)",fontFamily:"var(--font-body)",fontSize:"14px",fontWeight:600,cursor:"pointer"}}>บันทึก</button>
      </div>
    </form>
  )
}

export default function AdminVocabPage() {
  const { user, ready } = useAuth()
  const [words,setWords]         = useState<VocabWord[]>(SEED_VOCABULARY)
  const [search,setSearch]       = useState("")
  const [catFilter,setCatFilter] = useState("all")
  const [diffFilter,setDiffFilter] = useState("all")
  const [editingId,setEditingId] = useState<string|null>(null)
  const [addingNew,setAddingNew] = useState(false)
  const [jsonMode,setJsonMode]   = useState(false)
  const [jsonInput,setJsonInput] = useState(JSON_EXAMPLE)
  const [jsonPreview,setJsonPreview] = useState<VocabWord[]|null>(null)
  const [jsonError,setJsonError] = useState("")
  const [csvMode,setCsvMode]     = useState(false)
  const [csvFile,setCsvFile]     = useState<File|null>(null)
  const [csvUploading,setCsvUploading] = useState(false)
  const [csvProgress,setCsvProgress] = useState({current: 0, total: 0, message: ""})
  const [toast,setToast]         = useState("")

  // Load custom words on component mount
  useEffect(() => {
    async function loadCustomWords() {
      try {
        const token = localStorage.getItem('ecg-token');
        
        if (!token) {
          console.error('No token found - redirecting to login');
          window.location.href = '/login';
          return;
        }
        
        const response = await fetch('/api/admin/vocabulary/custom', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const customWords = await response.json();
          setWords(prev => [...prev, ...customWords]);
        } else if (response.status === 401) {
          console.error('Token expired or invalid - redirecting to login');
          localStorage.removeItem('ecg-token');
          window.location.href = '/login';
        } else {
          console.error('Failed to load custom words:', response.status, await response.text());
        }
      } catch (error) {
        console.error('Failed to load custom words:', error);
      }
    }
    
    // Only load if user is ready and is admin
    if (ready && user?.isAdmin) {
      loadCustomWords();
    }
  }, [ready, user?.isAdmin]); // Remove 'user' dependency to prevent re-render loops

  function toast2(msg:string){ setToast(msg); setTimeout(()=>setToast(""),2500) }

  const filtered = useMemo(()=>words.filter(w=>{
    const ms = !search||(w.english.toLowerCase().includes(search.toLowerCase())||w.thai.includes(search))
    const mc = catFilter==="all"||w.category===catFilter
    const md = diffFilter==="all"||String(w.difficulty)===diffFilter
    return ms&&mc&&md
  }),[words,search,catFilter,diffFilter])

  async function saveWord(w:VocabWord){
    try {
      const token = localStorage.getItem('ecg-token');
      
      if (!token) {
        toast2("กรุณาเข้าสู่ระบบใหม่");
        window.location.href = '/login';
        return;
      }
      
      const isNew = !editingId;
      
      if (isNew) {
        // เพิ่มคำใหม่
        const response = await fetch('/api/admin/vocabulary/custom', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(w)
        });
        
        if (response.ok) {
          const savedWord = await response.json();
          setWords(prev => [...prev, savedWord]);
          setEditingId(null); 
          setAddingNew(false);
          toast2("เพิ่มคำใหม่แล้ว ✓");
        } else if (response.status === 401) {
          toast2("Token หมดอายุ กรุณาเข้าสู่ระบบใหม่");
          localStorage.removeItem('ecg-token');
          window.location.href = '/login';
        } else {
          toast2("เกิดข้อผิดพลาด");
        }
      } else {
        // แก้ไขคำเดิม
        const response = await fetch(`/api/admin/vocabulary/custom/${editingId}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(w)
        });
        
        if (response.ok) {
          const savedWord = await response.json();
          setWords(prev => prev.map(x => x.id === editingId ? savedWord : x));
          setEditingId(null); 
          setAddingNew(false);
          toast2("แก้ไขแล้ว ✓");
        } else if (response.status === 401) {
          toast2("Token หมดอายุ กรุณาเข้าสู่ระบบใหม่");
          localStorage.removeItem('ecg-token');
          window.location.href = '/login';
        } else {
          toast2("เกิดข้อผิดพลาด");
        }
      }
    } catch (error) {
      toast2("เกิดข้อผิดพลาด");
    }
  }
  async function deleteWord(id:string){ 
    try {
      const token = localStorage.getItem('ecg-token');
      
      if (!token) {
        toast2("กรุณาเข้าสู่ระบบใหม่");
        window.location.href = '/login';
        return;
      }
      
      const response = await fetch(`/api/admin/vocabulary/custom/${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setWords(prev=>prev.filter(w=>w.id!==id)); 
        toast2("ลบแล้ว");
      } else if (response.status === 401) {
        toast2("Token หมดอายุ กรุณาเข้าสู่ระบบใหม่");
        localStorage.removeItem('ecg-token');
        window.location.href = '/login';
      } else {
        toast2("เกิดข้อผิดพลาด");
      }
    } catch (error) {
      toast2("เกิดข้อผิดพลาด");
    }
  }

  function parseJson(){
    try{
      setJsonError("")
      const arr = JSON.parse(jsonInput) as any[]
      if(!Array.isArray(arr)){setJsonError("ต้องเป็น array");return}
      const parsed:VocabWord[] = arr.map((item,i)=>{
        if(!item.english||!item.thai) throw new Error(`row ${i+1}: english และ thai จำเป็นต้องมี`)
        return {
          id:"json-"+Date.now()+"-"+i,
          english:String(item.english).trim(),
          thai:String(item.thai).trim(),
          phonetic:item.phonetic,example:item.example,
          category:item.category||"general",
          difficulty:(item.difficulty||2) as Difficulty,
        }
      })
      setJsonPreview(parsed)
    }catch(e:any){ setJsonError(String(e.message)) }
  }

  async function confirmJsonImport(){
    if(!jsonPreview)return
    
    try {
      const token = localStorage.getItem('ecg-token');
      
      if (!token) {
        toast2("กรุณาเข้าสู่ระบบใหม่");
        window.location.href = '/login';
        return;
      }
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const word of jsonPreview) {
        try {
          const response = await fetch('/api/admin/vocabulary/custom', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(word)
          });
          
          if (response.ok) {
            const savedWord = await response.json();
            setWords(prev => [...prev, savedWord]);
            successCount++;
          } else if (response.status === 401) {
            toast2("Token หมดอายุ กรุณาเข้าสู่ระบบใหม่");
            localStorage.removeItem('ecg-token');
            window.location.href = '/login';
            return;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
        }
      }
      
      setJsonPreview(null); 
      setJsonInput(JSON_EXAMPLE); 
      setJsonMode(false);
      
      if (errorCount === 0) {
        toast2(`เพิ่ม ${successCount} คำแล้ว ✓`);
      } else {
        toast2(`เพิ่ม ${successCount} คำสำเร็จ ล้มเหลว ${errorCount} คำ`);
      }
    } catch (error) {
      toast2("เกิดข้อผิดพลาด");
    }
  }

  async function handleCsvUpload() {
    if (!csvFile) {
      toast2("กรุณาเลือกไฟล์ CSV");
      return;
    }
    
    try {
      const token = localStorage.getItem('ecg-token');
      
      if (!token) {
        toast2("กรุณาเข้าสู่ระบบใหม่");
        window.location.href = '/login';
        return;
      }
      
      console.log('🚀 CLIENT: Starting CSV import');
      console.log(`📁 CLIENT: File selected: ${csvFile.name} (${csvFile.size} bytes)`);
      
      setCsvUploading(true);
      setCsvProgress({current: 0, total: 0, message: "กำลังอ่านไฟล์..."});
      
      const uploadFormData = new FormData();
      uploadFormData.append('file', csvFile);
      
      console.log('📤 CLIENT: Sending request to /api/admin/vocabulary/csv-import');
      
      const uploadResponse = await fetch('/api/admin/vocabulary/csv-import', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`
        },
        body: uploadFormData
      });
      
      console.log(`📡 CLIENT: Response received - Status: ${uploadResponse.status}`);
      console.log(`📡 CLIENT: Response headers:`, Object.fromEntries(uploadResponse.headers.entries()));
      
      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        toast2(error.error || "เกิดข้อผิดพลาด");
        return;
      }
      
      // Handle streaming response
      const reader = uploadResponse.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        toast2("ไม่สามารถอ่าน response ได้");
        return;
      }
      
      let result: any = null;
      
      console.log('📖 CLIENT: Starting to read stream...');
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('📖 CLIENT: Stream reading completed');
          break;
        }
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              switch (data.type) {
                case 'start':
                  setCsvProgress({current: 0, total: data.total, message: data.message});
                  console.log(`📥 CLIENT: Received start event - Total: ${data.total}`);
                  break;
                case 'progress':
                  setCsvProgress({current: data.current, total: data.total, message: data.message});
                  console.log(`📊 CLIENT: Received progress event - ${data.current}/${data.total}`);
                  break;
                case 'complete':
                  result = data;
                  setCsvProgress({current: data.total, total: data.total, message: "กำลังโหลดข้อมูล..."});
                  console.log(`✅ CLIENT: Received complete event - Success: ${data.successCount}, Errors: ${data.errorCount}`);
                  break;
                case 'error':
                  toast2(data.message || "เกิดข้อผิดพลาด");
                  console.log(`❌ CLIENT: Received error event - ${data.message}`);
                  return;
              }
            } catch (e) {
              // Ignore JSON parse errors for partial chunks
            }
          }
        }
      }
      
      // Process completed successfully
      if (result) {
        // Reload custom words to get the latest data
        const customResponse = await fetch('/api/admin/vocabulary/custom', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (customResponse.ok) {
          const customWords = await customResponse.json();
          setWords([...SEED_VOCABULARY, ...customWords]);
        }
        
        if (result.errorCount === 0) {
          toast2(`นำเข้า ${result.successCount} คำสำเร็จ ✓`);
        } else {
          toast2(`นำเข้า ${result.successCount} คำสำเร็จ ล้มเหลว ${result.errorCount} คำ`);
        }
        
        setCsvFile(null);
        setCsvMode(false);
        setCsvProgress({current: 0, total: 0, message: ""});
      }
    } catch (error) {
      toast2("เกิดข้อผิดพลาด");
    } finally {
      setCsvUploading(false);
    }
  }

  if(!ready)return null
  if(!user?.isAdmin) return (
    <div style={{minHeight:"100vh",background:"var(--bg-base)",display:"flex",flexDirection:"column"}}>
      <NavBar/>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <div style={{fontSize:"48px"}}>🔒</div>
        <p style={{fontFamily:"var(--font-body)",color:"var(--text-secondary)"}}>Admin เท่านั้น (PIN: 00000)</p>
      </div>
    </div>
  )

  const chipStyle=(active:boolean):React.CSSProperties=>({
    padding:"5px 12px",borderRadius:"9999px",border:"1px solid",
    borderColor:active?"var(--accent-primary)":"var(--border-default)",
    background:active?"var(--accent-primary)":"transparent",
    color:active?"var(--text-on-accent)":"var(--text-secondary)",
    fontFamily:"var(--font-body)",fontSize:"12px",cursor:"pointer",
    whiteSpace:"nowrap",transition:"all 0.15s",
  })

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

      <main style={{maxWidth:"1000px",margin:"0 auto",padding:"24px 16px"}}>

      {/* Difficulty & Category reference */}
      <details style={{marginBottom:"20px",background:"var(--bg-surface)",border:"1px solid var(--border-default)",borderRadius:"14px",padding:"14px 18px"}}>
        <summary style={{fontFamily:"var(--font-body)",fontSize:"14px",fontWeight:600,color:"var(--text-primary)",cursor:"pointer",userSelect:"none"}}>
          📋 ระดับความยาก & หมวดหมู่ที่มี (คลิกเพื่อดู)
        </summary>
        <div style={{marginTop:"14px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px"}}>
          <div>
            <p style={{fontFamily:"var(--font-body)",fontSize:"12px",color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.06em",margin:"0 0 8px"}}>ระดับความยาก</p>
            {[
              {v:1,label:"Beginner",color:"#4CAF50",desc:"คำพื้นฐาน ง่ายมาก"},
              {v:2,label:"Easy",    color:"#8BC34A",desc:"ง่าย ใช้บ่อย"},
              {v:3,label:"Medium",  color:"#FFC107",desc:"กลาง ใช้ทั่วไป"},
              {v:4,label:"Hard",    color:"#FF5722",desc:"ยาก ไม่ค่อยพบ"},
              {v:5,label:"Expert",  color:"#9C27B0",desc:"ยากมาก เฉพาะทาง"},
            ].map(d=>(
              <div key={d.v} style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"5px"}}>
                <span style={{fontFamily:"var(--font-mono)",fontWeight:700,fontSize:"13px",color:d.color,minWidth:"18px"}}>{d.v}</span>
                <span style={{fontFamily:"var(--font-body)",fontSize:"13px",color:"var(--text-primary)",minWidth:"70px"}}>{d.label}</span>
                <span style={{fontFamily:"var(--font-body)",fontSize:"12px",color:"var(--text-muted)"}}>{d.desc}</span>
              </div>
            ))}
          </div>
          <div>
            <p style={{fontFamily:"var(--font-body)",fontSize:"12px",color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.06em",margin:"0 0 8px"}}>หมวดหมู่ (category)</p>
            {["animals","food","colors","numbers","verbs","adjectives","places","daily-life","engineering","custom"].map(c=>(
              <div key={c} style={{fontFamily:"var(--font-mono)",fontSize:"12px",color:"var(--text-secondary)",marginBottom:"4px",display:"flex",alignItems:"center",gap:"6px"}}>
                <code style={{background:"var(--bg-subtle)",padding:"1px 6px",borderRadius:"4px",color:"var(--accent-primary)"}}>{c}</code>
              </div>
            ))}
          </div>
        </div>
      </details>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"20px",flexWrap:"wrap",gap:"12px"}}>
          <div>
            <h1 style={{fontFamily:"var(--font-display)",fontSize:"26px",fontWeight:700,color:"var(--text-primary)",margin:"0 0 4px",letterSpacing:"-0.02em"}}>📚 จัดการคำศัพท์</h1>
            <p style={{fontFamily:"var(--font-body)",fontSize:"14px",color:"var(--text-muted)",margin:0}}>{words.length} คำทั้งหมด · {filtered.length} ที่กรอง</p>
          </div>
          <div style={{display:"flex",gap:"8px"}}>
            <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}} onClick={()=>{setCsvMode(true);setAddingNew(false);setEditingId(null);setJsonMode(false)}}
              style={{padding:"10px 16px",borderRadius:"11px",border:"1px solid var(--border-default)",background:"var(--bg-surface)",color:"var(--text-primary)",fontFamily:"var(--font-body)",fontSize:"13px",cursor:"pointer"}}>
              📄 Import CSV
            </motion.button>
            <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}} onClick={()=>{setJsonMode(true);setAddingNew(false);setEditingId(null);setCsvMode(false)}}
              style={{padding:"10px 16px",borderRadius:"11px",border:"1px solid var(--border-default)",background:"var(--bg-surface)",color:"var(--text-primary)",fontFamily:"var(--font-body)",fontSize:"13px",cursor:"pointer"}}>
              📥 Import JSON
            </motion.button>
            <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}} onClick={()=>{setAddingNew(true);setEditingId(null);setJsonMode(false);setCsvMode(false)}}
              style={{padding:"10px 18px",borderRadius:"11px",border:"none",background:"var(--accent-primary)",color:"var(--text-on-accent)",fontFamily:"var(--font-body)",fontSize:"13px",fontWeight:600,cursor:"pointer"}}>
              ➕ เพิ่มคำ
            </motion.button>
          </div>
        </div>

        {/* Add single word form */}
        <AnimatePresence>
          {addingNew&&(
            <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}}
              style={{overflow:"hidden",marginBottom:"16px"}}>
              <div style={{background:"var(--bg-surface)",border:"1px solid var(--accent-primary)",borderRadius:"16px",padding:"20px"}}>
                <h2 style={{fontFamily:"var(--font-display)",fontSize:"16px",fontWeight:600,color:"var(--text-primary)",margin:"0 0 16px"}}>➕ เพิ่มคำใหม่</h2>
                <WordForm onSave={saveWord} onCancel={()=>setAddingNew(false)}/>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* JSON import */}
        <AnimatePresence>
          {jsonMode&&(
            <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}}
              style={{overflow:"hidden",marginBottom:"16px"}}>
              <div style={{background:"var(--bg-surface)",border:"1px solid var(--border-default)",borderRadius:"16px",padding:"20px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
                  <h2 style={{fontFamily:"var(--font-display)",fontSize:"16px",fontWeight:600,color:"var(--text-primary)",margin:0}}>📥 Import JSON</h2>
                  <button onClick={()=>{setJsonMode(false);setJsonPreview(null);setJsonError("")}} style={{padding:"4px 12px",borderRadius:"8px",border:"1px solid var(--border-default)",background:"transparent",color:"var(--text-secondary)",fontFamily:"var(--font-body)",fontSize:"12px",cursor:"pointer"}}>ยกเลิก</button>
                </div>
                <p style={{fontFamily:"var(--font-body)",fontSize:"12px",color:"var(--text-muted)",margin:"0 0 10px"}}>วาง JSON array ด้านล่าง — required fields: <code>english</code>, <code>thai</code></p>
                <textarea value={jsonInput} onChange={e=>setJsonInput(e.target.value)} rows={12}
                  style={{width:"100%",padding:"12px",borderRadius:"10px",border:"1px solid var(--border-default)",background:"var(--bg-elevated)",color:"var(--text-primary)",fontFamily:"var(--font-mono)",fontSize:"12px",outline:"none",resize:"vertical",boxSizing:"border-box"}}/>
                {jsonError&&<p style={{color:"var(--color-danger)",fontFamily:"var(--font-body)",fontSize:"13px",margin:"8px 0 0"}}>❌ {jsonError}</p>}
                <div style={{display:"flex",gap:"10px",marginTop:"12px"}}>
                  <button onClick={parseJson} style={{flex:1,padding:"10px",borderRadius:"10px",border:"1px solid var(--accent-primary)",background:"transparent",color:"var(--accent-primary)",fontFamily:"var(--font-body)",fontSize:"14px",fontWeight:600,cursor:"pointer"}}>🔍 ตรวจสอบ Preview</button>
                  {jsonPreview&&<button onClick={confirmJsonImport} style={{flex:2,padding:"10px",borderRadius:"10px",border:"none",background:"var(--accent-primary)",color:"var(--text-on-accent)",fontFamily:"var(--font-body)",fontSize:"14px",fontWeight:600,cursor:"pointer"}}>✓ ยืนยันเพิ่ม {jsonPreview.length} คำ</button>}
                </div>
                {/* Preview table */}
                {jsonPreview&&(
                  <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} style={{marginTop:"16px",borderRadius:"12px",border:"1px solid var(--border-default)",overflow:"hidden"}}>
                    <div style={{padding:"10px 14px",background:"var(--bg-subtle)",fontFamily:"var(--font-body)",fontSize:"12px",color:"var(--text-muted)",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em"}}>
                      Preview — {jsonPreview.length} คำ
                    </div>
                    <div style={{maxHeight:"240px",overflowY:"auto"}}>
                      {jsonPreview.map((w,i)=>(
                        <div key={i} style={{display:"flex",alignItems:"center",gap:"12px",padding:"8px 14px",borderBottom:"1px solid var(--border-default)"}}>
                          <span style={{fontFamily:"var(--font-body)",fontSize:"14px",fontWeight:600,color:"var(--text-primary)",minWidth:"120px"}}>{w.english}</span>
                          <span style={{fontFamily:"var(--font-body)",fontSize:"14px",color:"var(--text-secondary)",flex:1}}>{w.thai}</span>
                          <span style={{fontFamily:"var(--font-body)",fontSize:"11px",color:DIFF_COLOR[w.difficulty],padding:"2px 8px",borderRadius:"9999px",border:`1px solid ${DIFF_COLOR[w.difficulty]}`}}>{DIFF_LABEL[w.difficulty]}</span>
                          <span style={{fontFamily:"var(--font-body)",fontSize:"11px",color:"var(--text-muted)"}}>{w.category}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CSV import */}
        <AnimatePresence>
          {csvMode&&(
            <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}}
              style={{overflow:"hidden",marginBottom:"16px"}}>
              <div style={{background:"var(--bg-surface)",border:"1px solid var(--border-default)",borderRadius:"16px",padding:"20px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
                  <h2 style={{fontFamily:"var(--font-display)",fontSize:"16px",fontWeight:600,color:"var(--text-primary)",margin:0}}>📄 Import CSV</h2>
                  <button onClick={()=>{setCsvMode(false);setCsvFile(null)}} style={{padding:"4px 12px",borderRadius:"8px",border:"1px solid var(--border-default)",background:"transparent",color:"var(--text-secondary)",fontFamily:"var(--font-body)",fontSize:"12px",cursor:"pointer"}}>ยกเลิก</button>
                </div>
                <p style={{fontFamily:"var(--font-body)",fontSize:"12px",color:"var(--text-muted)",margin:"0 0 10px"}}>
                  CSV format: english,thai,phonetic,example,category,difficulty (headers required)
                </p>
                <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"12px"}}>
                  <input 
                    type="file" 
                    accept=".csv" 
                    onChange={e=>setCsvFile(e.target.files?.[0]||null)}
                    style={{flex:1,padding:"10px",borderRadius:"10px",border:"1px solid var(--border-default)",background:"var(--bg-elevated)",color:"var(--text-primary)",fontFamily:"var(--font-body)",fontSize:"14px",outline:"none",boxSizing:"border-box"}}
                  />
                  {csvFile && (
                    <span style={{fontFamily:"var(--font-body)",fontSize:"12px",color:"var(--text-secondary)",minWidth:"120px"}}>
                      {csvFile.name}
                    </span>
                  )}
                </div>
                <div style={{display:"flex",gap:"10px"}}>
                  <button 
                    onClick={handleCsvUpload}
                    disabled={!csvFile || csvUploading}
                    style={{flex:1,padding:"10px",borderRadius:"10px",border:"none",background: (!csvFile || csvUploading) ? "var(--border-default)" : "var(--accent-primary)",color: (!csvFile || csvUploading) ? "var(--text-muted)" : "var(--text-on-accent)",fontFamily:"var(--font-body)",fontSize:"14px",fontWeight:600,cursor: (!csvFile || csvUploading) ? "not-allowed" : "pointer",opacity: (!csvFile || csvUploading) ? 0.6 : 1}}>
                    {csvUploading ? "กำลังอัปโหลด..." : "📤 อัปโหลด CSV"}
                  </button>
                </div>
                
                {/* Progress Bar */}
                {csvUploading && csvProgress.total > 0 && (
                  <div style={{marginTop:"12px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px"}}>
                      <span style={{fontFamily:"var(--font-body)",fontSize:"12px",color:"var(--text-secondary)"}}>
                        {csvProgress.message}
                      </span>
                      <span style={{fontFamily:"var(--font-body)",fontSize:"12px",color:"var(--text-secondary)"}}>
                        {csvProgress.current} / {csvProgress.total}
                      </span>
                    </div>
                    <div style={{
                      width:"100%",
                      height:"8px",
                      backgroundColor:"var(--bg-subtle)",
                      borderRadius:"4px",
                      overflow:"hidden"
                    }}>
                      <motion.div
                        initial={{width: "0%"}}
                        animate={{width: `${(csvProgress.current / csvProgress.total) * 100}%`}}
                        transition={{duration: 0.3}}
                        style={{
                          height:"100%",
                          backgroundColor:"var(--accent-primary)",
                          borderRadius:"4px"
                        }}
                      />
                    </div>
                    <div style={{
                      marginTop:"4px",
                      fontFamily:"var(--font-body)",
                      fontSize:"11px",
                      color:"var(--text-muted)",
                      textAlign:"center"
                    }}>
                      {Math.round((csvProgress.current / csvProgress.total) * 100)}% เสร็จสิ้น
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search + Filters */}
        <input type="search" placeholder="🔍  ค้นหา..." value={search} onChange={e=>setSearch(e.target.value)}
          style={{width:"100%",padding:"11px 16px",borderRadius:"11px",border:"1px solid var(--border-default)",background:"var(--bg-surface)",color:"var(--text-primary)",fontFamily:"var(--font-body)",fontSize:"14px",outline:"none",boxSizing:"border-box",marginBottom:"12px"}}/>
        <div style={{display:"flex",gap:"6px",overflowX:"auto",paddingBottom:"4px",marginBottom:"8px"}}>
          <button style={chipStyle(catFilter==="all")} onClick={()=>setCatFilter("all")}>All categories</button>
          {[...new Set(words.map(w=>w.category))].map(c=>(
            <button key={c} style={{...chipStyle(catFilter===c),textTransform:"capitalize"}} onClick={()=>setCatFilter(c)}>{c}</button>
          ))}
        </div>
        <div style={{display:"flex",gap:"6px",overflowX:"auto",paddingBottom:"4px",marginBottom:"16px"}}>
          <button style={chipStyle(diffFilter==="all")} onClick={()=>setDiffFilter("all")}>All levels</button>
          {[1,2,3,4,5].map(d=>(
            <button key={d} style={chipStyle(diffFilter===String(d))} onClick={()=>setDiffFilter(String(d))}>{DIFF_LABEL[d as Difficulty]}</button>
          ))}
        </div>

        {/* Word list */}
        <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
          {filtered.map((w,i)=>(
            <motion.div key={w.id} layout initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:Math.min(i*0.02,0.3)}}
              style={{background:"var(--bg-surface)",border:"1px solid var(--border-default)",borderRadius:"12px",padding:"12px 16px"}}>
              {editingId===w.id ? (
                <div>
                  <p style={{fontFamily:"var(--font-body)",fontSize:"12px",color:"var(--accent-primary)",fontWeight:600,margin:"0 0 12px"}}>✏️ แก้ไข: {w.english}</p>
                  <WordForm initial={w} onSave={saveWord} onCancel={()=>setEditingId(null)}/>
                </div>
              ) : (
                <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap"}}>
                      <span style={{fontFamily:"var(--font-body)",fontSize:"15px",fontWeight:600,color:"var(--text-primary)"}}>{w.english}</span>
                      {w.phonetic&&<span style={{fontFamily:"var(--font-mono)",fontSize:"12px",color:"var(--text-muted)"}}>/{w.phonetic}/</span>}
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:"8px",marginTop:"3px",flexWrap:"wrap"}}>
                      <span style={{fontFamily:"var(--font-body)",fontSize:"13px",color:"var(--text-secondary)"}}>{w.thai}</span>
                      <span style={{fontSize:"11px",padding:"1px 7px",borderRadius:"9999px",border:`1px solid ${DIFF_COLOR[w.difficulty]}`,color:DIFF_COLOR[w.difficulty]}}>{DIFF_LABEL[w.difficulty]}</span>
                      <span style={{fontSize:"11px",color:"var(--text-muted)",textTransform:"capitalize"}}>{w.category}</span>
                    </div>
                    {w.example&&<p style={{fontFamily:"var(--font-body)",fontSize:"12px",color:"var(--text-muted)",fontStyle:"italic",margin:"4px 0 0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>"{w.example}"</p>}
                  </div>
                  <div style={{display:"flex",gap:"6px",flexShrink:0}}>
                    <button onClick={()=>setEditingId(w.id)} style={{padding:"6px 12px",borderRadius:"8px",border:"1px solid var(--border-default)",background:"transparent",color:"var(--text-secondary)",fontFamily:"var(--font-body)",fontSize:"12px",cursor:"pointer"}}>✏️</button>
                    <button onClick={()=>deleteWord(w.id)} style={{padding:"6px 10px",borderRadius:"8px",border:"1px solid var(--color-danger)",background:"transparent",color:"var(--color-danger)",fontFamily:"var(--font-body)",fontSize:"12px",cursor:"pointer"}}>🗑️</button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
          {filtered.length===0&&(
            <div style={{textAlign:"center",padding:"40px 0",color:"var(--text-muted)",fontFamily:"var(--font-body)"}}>
              <div style={{fontSize:"32px",marginBottom:"8px"}}>🔍</div>ไม่พบคำที่ค้นหา
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
