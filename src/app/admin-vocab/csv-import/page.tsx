// english-card-game/src/app/admin-vocab/csv-import/page.tsx
"use client"
import { useState, useRef, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { NavBar } from "../../../components/NavBar"
import { VocabWord, Difficulty } from "../../../types/game"

// ── CSV column map ─────────────────────────────────────────────
// Supports both:
// 1) id, e-search, e-entry, t-entry, e-cat, t-related, e-syn, e-ant
// 2) id, english, thai, phonetic, example, category, difficulty, synonyms, ...
const CAT_MAP: Record<string,string> = {
  DET:"determiner", N:"nouns", V:"verbs", ADJ:"adjectives",
  ADV:"adverbs", PREP:"prepositions", CONJ:"conjunctions",
  ABBR:"abbreviations", PRON:"pronouns", INT:"interjections",
  PHRASE:"phrases", IDIOM:"idioms",
}

function parseCsv(text: string): { rows: Partial<VocabWord>[]; errors: string[] } {
  const records = parseCsvRecords(text)
  const errors: string[] = []
  const rows:   Partial<VocabWord>[] = []

  if (!records.length) return { rows, errors: ["ไฟล์ว่างเปล่า"] }

  const headerCells = records[0].map(normalizeHeader)
  const hasHeader = headerCells.some(header => ["e-entry", "english", "e-search"].includes(header))
  const dataRecords = hasHeader ? records.slice(1) : records
  const headerIndex = new Map<string, number>()

  if (hasHeader) {
    headerCells.forEach((header, index) => headerIndex.set(header, index))
  }

  dataRecords.forEach((cols, i) => {
    if (cols.every(col => !col.trim())) return
    if (cols.length < 4) {
      errors.push(`แถว ${i + (hasHeader ? 2 : 1)}: คอลัมน์ไม่ครบ (${cols.length} คอลัมน์)`)
      return
    }

    const rowNumber = i + (hasHeader ? 2 : 1)
    const isStandardFormat = hasHeader && headerIndex.has("english") && headerIndex.has("thai")
    const get = (header: string) => {
      const index = headerIndex.get(header)
      return index === undefined ? "" : cols[index] ?? ""
    }

    const english = isStandardFormat ? get("english") : cols[2]
    const thai = isStandardFormat ? get("thai") : cols[3]

    if (!english?.trim() || !thai?.trim()) {
      errors.push(`แถว ${rowNumber}: english หรือ thai ว่างเปล่า`)
      return
    }

    const rawCat = (isStandardFormat ? get("category") : cols[4])?.trim() ?? ""
    const legacyCat = rawCat.toUpperCase()
    const category = isStandardFormat
      ? rawCat || "general"
      : CAT_MAP[legacyCat] ?? legacyCat.toLowerCase() ?? "general"

    const difficulty = parseDifficulty(isStandardFormat ? get("difficulty") : "")
    const synonyms = parseSynonyms(isStandardFormat ? get("synonyms") : cols[6])

    rows.push({
      id: `csv-${Date.now()}-${i}`,
      english: english.trim(),
      thai: thai.trim(),
      phonetic: cleanOptional(isStandardFormat ? get("phonetic") : ""),
      example: cleanOptional(isStandardFormat ? get("example") : ""),
      category,
      difficulty,
      synonyms,
    })
  })

  return { rows, errors }
}

function parseCsvRecords(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuote = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const next = text[i + 1]

    if (inQuote) {
      if (char === '"' && next === '"') {
        field += '"'
        i++
      } else if (char === '"') {
        inQuote = false
      } else {
        field += char
      }
      continue
    }

    if (char === '"' && field === "") {
      inQuote = true
    } else if (char === ",") {
      row.push(field)
      field = ""
    } else if (char === "\n" || char === "\r") {
      row.push(field)
      field = ""
      rows.push(row)
      row = []
      if (char === "\r" && next === "\n") i++
    } else {
      field += char
    }
  }

  row.push(field)
  rows.push(row)

  return rows.filter(record => record.some(cell => cell.trim()))
}

function normalizeHeader(header: string): string {
  return header.replace(/^\uFEFF/, "").trim().toLowerCase()
}

function cleanOptional(value: string): string | undefined {
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function parseDifficulty(value: string): Difficulty {
  const parsed = Number.parseInt(value.trim(), 10)
  if ([1, 2, 3, 4, 5].includes(parsed)) return parsed as Difficulty
  return 1 as Difficulty
}

function parseSynonyms(value: string): string[] | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return parsePostgresTextArray(trimmed.slice(1, -1))
  }

  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed.map(item => String(item).trim()).filter(Boolean)
      }
    } catch {
      // Fall back to delimiter parsing below.
    }
  }

  return trimmed.split(/[,;|]/).map(s => s.trim()).filter(Boolean)
}

function parsePostgresTextArray(value: string): string[] | undefined {
  const items: string[] = []
  let current = ""
  let inQuote = false
  let escaping = false

  for (const char of value) {
    if (escaping) {
      current += char
      escaping = false
    } else if (char === "\\" && inQuote) {
      escaping = true
    } else if (char === '"') {
      inQuote = !inQuote
    } else if (char === "," && !inQuote) {
      items.push(current.trim())
      current = ""
    } else {
      current += char
    }
  }

  items.push(current.trim())

  const synonyms = items
    .map(item => item.replace(/^"(.*)"$/, "$1").trim())
    .filter(item => item && item.toUpperCase() !== "NULL")

  return synonyms.length ? synonyms : undefined
}

// ── Duplicate detector ──────────────────────────────────────────
function findDuplicates(rows: Partial<VocabWord>[], existingWords: string[]): Set<string> {
  const existingSet = new Set(existingWords.map(w => w.toLowerCase()))
  return new Set(rows.filter(r => existingSet.has(r.english?.toLowerCase() ?? "")).map(r => r.english ?? ""))
}

function findInternalDuplicates(rows: Partial<VocabWord>[]): Set<string> {
  const seen = new Set<string>()
  const duplicates = new Set<string>()
  for (const row of rows) {
    const key = row.english?.toLowerCase() ?? ""
    if (seen.has(key)) {
      duplicates.add(row.english ?? "")
    } else {
      seen.add(key)
    }
  }
  return duplicates
}

type ImportProgress = {
  current: number
  total: number
  imported: number
  message: string
}

export default function CsvImportPage() {
  const [tab, setTab]               = useState<"upload"|"preview"|"done">("upload")
  const [rawCsv, setRawCsv]         = useState("")
  const [parsed, setParsed]         = useState<Partial<VocabWord>[]>([])
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [internalDups, setInternalDups] = useState<Set<string>>(new Set())
  const [existingWords, setExistingWords] = useState<string[]>([])
  const [existingLoaded, setExistingLoaded] = useState(false)
  const [existingError, setExistingError] = useState("")
  const [skipDups, setSkipDups]     = useState(true)
  const [importing, setImporting]   = useState(false)
  const [imported, setImported]     = useState(0)
  const [importProgress, setImportProgress] = useState<ImportProgress>({current:0,total:0,imported:0,message:""})
  const [importError, setImportError] = useState("")
  const [filter, setFilter]         = useState<"all"|"new"|"dup">("all")
  const [dragOver, setDragOver]     = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)



  // Fetch existing words from database on component mount
  useEffect(() => {
    async function fetchExistingWords() {
      const token = localStorage.getItem('ecg-token')


      try {
        const response = await fetch('/api/vocabulary/existing', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          return
        }

        const data = await response.json()
        setExistingWords(data.words ?? [])
        setExistingError("")
      } catch (error) {
        console.error('❌ CSV PAGE: Error fetching existing words:', error)
        setExistingError("โหลดรายการคำในฐานข้อมูลไม่สำเร็จ ระบบจะยังตรวจซ้ำฝั่ง server ตอนนำเข้า")
      } finally {
        setExistingLoaded(true)
      }
    }

    fetchExistingWords()
  }, [])

  const duplicates = useMemo(() => findDuplicates(parsed, existingWords), [parsed, existingWords])

  function handleText(text: string) {
    
    setRawCsv(text)
    const { rows, errors } = parseCsv(text)
    
    
    const internalDups = findInternalDuplicates(rows)
    
    setParsed(rows)
    setParseErrors(errors)
    setInternalDups(internalDups)
    setImportError("")
    setImportProgress({current:0,total:0,imported:0,message:""})
    if (rows.length > 0) {
      setTab("preview")
    }
  }

  function handleFile(file: File) {
    
    const reader = new FileReader()
    reader.onload = e => {
      handleText(e.target?.result as string ?? "")
    }
    reader.readAsText(file, "utf-8")
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file?.name.endsWith(".csv") || file?.type === "text/csv") handleFile(file)
  }

  async function doImport() {
    console.log('processing...');
    console.log('🔍 DEBUG: doImport function started');
    console.log('🔍 DEBUG: parsed.length =', parsed.length);
    console.log('🔍 DEBUG: skipDups =', skipDups);
    console.log('🔍 DEBUG: duplicates.size =', duplicates.size);
    console.log('🔍 DEBUG: internalDups.size =', internalDups.size);
    setImportError("")

    // Filter out internal duplicates (keep first occurrence)
    const seen = new Set<string>()
    const withoutInternalDups = parsed.filter(r => {
      const key = r.english?.toLowerCase() ?? ""
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    
    // Filter out DB duplicates if skipDups is enabled
    const toImport = withoutInternalDups.filter(r => skipDups ? !duplicates.has(r.english ?? "") : true)
    
    setImporting(true)
    setImportProgress({
      current: 0,
      total: toImport.length,
      imported: 0,
      message: `เตรียมนำเข้า ${toImport.length.toLocaleString()} คำ...`
    })
    
    
    const token = localStorage.getItem('ecg-token');
    if (!token) {
      console.error('❌ CSV PAGE: No authentication token found');
      setImporting(false)
      window.location.href = '/login';
      return;
    }
    
    
    try {
      const CHUNK_SIZE = 250
      let importedTotal = 0

      for (let start = 0; start < toImport.length; start += CHUNK_SIZE) {
        const chunk = toImport.slice(start, start + CHUNK_SIZE)
        const chunkEnd = Math.min(start + chunk.length, toImport.length)

        setImportProgress({
          current: start,
          total: toImport.length,
          imported: importedTotal,
          message: `กำลังนำเข้า ${start + 1}-${chunkEnd} จาก ${toImport.length.toLocaleString()} คำ...`
        })

        const response = await fetch('/api/vocabulary/batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            words: chunk,
            skipDuplicates: skipDups
          })
        });

        if (!response.ok) {
          let errorData;
          try {
            const responseText = await response.text();
            console.log('🔍 DEBUG: Error response text:', responseText);
            errorData = responseText ? JSON.parse(responseText) : { message: `HTTP ${response.status}` };
          } catch {
            errorData = { message: `HTTP ${response.status} - Invalid response` };
          }

          throw new Error(errorData.message || 'Import failed');
        }

        const result = await response.json().catch(() => ({ imported: chunk.length }))
        importedTotal += Number(result.imported ?? chunk.length)
        setImportProgress({
          current: chunkEnd,
          total: toImport.length,
          imported: importedTotal,
          message: `นำเข้าแล้ว ${importedTotal.toLocaleString()} คำ (${chunkEnd.toLocaleString()}/${toImport.length.toLocaleString()} รายการ)`
        })
      }

      setImported(importedTotal)
      setExistingWords(prev => Array.from(new Set([
        ...prev,
        ...toImport.map(word => word.english?.toLowerCase() ?? "").filter(Boolean),
      ])))
      setTab("done")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Import failed"
      setImportError(message)
      console.error('❌ CSV PAGE: Import failed:', error)
    } finally {
      setImporting(false)
    }
  }

  const displayRows = parsed.filter(r => {
    if (filter === "new") return !duplicates.has(r.english ?? "") && !internalDups.has(r.english ?? "")
    if (filter === "dup") return duplicates.has(r.english ?? "") || internalDups.has(r.english ?? "")
    return true
  })

  const newCount = parsed.filter(r => !duplicates.has(r.english ?? "") && !internalDups.has(r.english ?? "")).length
  const dupCount = duplicates.size + internalDups.size
  const importPct = importProgress.total > 0 ? Math.round((importProgress.current / importProgress.total) * 100) : 0

  return (
    <div style={{minHeight:"100vh",background:"var(--bg-base)",paddingBottom:"80px"}}>
      <NavBar/>
      <main style={{maxWidth:"960px",margin:"0 auto",padding:"24px 16px"}}>

        {/* Header */}
        <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"8px"}}>
          <a href="/admin-vocab" style={{color:"var(--accent-primary)",fontFamily:"var(--font-body)",fontSize:"13px",textDecoration:"none"}}>← Vocab DB</a>
          <span style={{color:"var(--text-muted)"}}>›</span>
          <h1 style={{fontFamily:"var(--font-display)",fontSize:"22px",fontWeight:700,color:"var(--text-primary)",margin:0}}>
            📥 นำเข้า CSV
          </h1>
        </div>
        <p style={{fontFamily:"var(--font-body)",fontSize:"13px",color:"var(--text-muted)",margin:"0 0 24px"}}>
          รองรับ format: <code style={{background:"var(--bg-subtle)",padding:"1px 6px",borderRadius:"4px"}}>id, english, thai, phonetic, example, category, difficulty, synonyms</code> และ <code style={{background:"var(--bg-subtle)",padding:"1px 6px",borderRadius:"4px"}}>id, e-search, e-entry, t-entry, e-cat, t-related, e-syn, e-ant</code>
        </p>

        {/* Tabs */}
        <div style={{display:"flex",gap:"0",marginBottom:"20px",borderBottom:"1px solid var(--border-default)"}}>
          {([
            {id:"upload",  label:"1. อัพโหลด"},
            {id:"preview", label:`2. ตรวจสอบ (${parsed.length})`},
            {id:"done",    label:"3. เสร็จสิ้น"},
          ] as const).map((t)=>(
            <button key={t.id}
              disabled={t.id==="preview" && !parsed.length || t.id==="done" && !imported}
              onClick={()=>{ if(parsed.length||t.id==="upload") setTab(t.id) }}
              style={{
                padding:"10px 20px",border:"none",background:"transparent",
                color: tab===t.id ? "var(--accent-primary)" : "var(--text-muted)",
                fontFamily:"var(--font-body)",fontSize:"13px",fontWeight:tab===t.id?700:400,
                cursor:"pointer",borderBottom: tab===t.id ? "2px solid var(--accent-primary)" : "2px solid transparent",
                marginBottom:"-1px",transition:"all 0.15s",
              }}>{t.label}</button>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ── UPLOAD TAB ── */}
          {tab==="upload" && (
            <motion.div key="upload" initial={{opacity:0,x:12}} animate={{opacity:1,x:0}} exit={{opacity:0}}>

              {/* Drop zone */}
              <div
                onDragOver={e=>{e.preventDefault();setDragOver(true)}}
                onDragLeave={()=>setDragOver(false)}
                onDrop={handleDrop}
                onClick={()=>fileRef.current?.click()}
                style={{
                  border:`2px dashed ${dragOver?"var(--accent-primary)":"var(--border-default)"}`,
                  borderRadius:"16px",padding:"48px",textAlign:"center" as const,cursor:"pointer",
                  background:dragOver?"var(--bg-subtle)":"transparent",
                  transition:"all 0.2s",marginBottom:"20px",
                }}>
                <div style={{fontSize:"40px",marginBottom:"12px"}}>📂</div>
                <p style={{fontFamily:"var(--font-display)",fontSize:"16px",fontWeight:600,color:"var(--text-primary)",margin:"0 0 6px"}}>
                  ลากไฟล์ .csv มาวาง หรือ คลิกเพื่อเลือก
                </p>
                <p style={{fontFamily:"var(--font-body)",fontSize:"12px",color:"var(--text-muted)",margin:0}}>รองรับ UTF-8, ขนาดไม่เกิน 10 MB</p>
                <input ref={fileRef} type="file" accept=".csv,text/csv" style={{display:"none"}}
                  onChange={e=>{ const f=e.target.files?.[0]; if(f)handleFile(f) }}/>
              </div>

              {/* Or paste */}
              <div style={{position:"relative",marginBottom:"16px"}}>
                <p style={{fontFamily:"var(--font-body)",fontSize:"12px",color:"var(--text-muted)",margin:"0 0 8px"}}>
                  หรือ วาง CSV โดยตรง:
                </p>
                <textarea
                  value={rawCsv}
                  onChange={e=>setRawCsv(e.target.value)}
                  rows={8}
                  placeholder={"id,english,thai,phonetic,example,category,difficulty,synonyms\n0227cec7-6517-4527-9366-39d7e55c3c3a,Absurd,\"น่าหัวร่อพิลึก, ไร้สาระสิ้นดี\",แอบเซิร์ด,It is absurd to go out in this heavy rain.,away use,1,\"{\"\"silly\"\",\"\"ridiculous\"\"}\""}
                  style={{
                    width:"100%",padding:"12px",borderRadius:"12px",
                    border:"1px solid var(--border-default)",background:"var(--bg-surface)",
                    color:"var(--text-primary)",fontFamily:"monospace",fontSize:"12px",
                    outline:"none",boxSizing:"border-box" as const,resize:"vertical",lineHeight:1.5,
                  }}/>
              </div>
              <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}}
                onClick={()=>handleText(rawCsv)} disabled={!rawCsv.trim()}
                style={{
                  padding:"12px 32px",borderRadius:"12px",border:"none",
                  background:"var(--accent-primary)",color:"var(--text-on-accent)",
                  fontFamily:"var(--font-body)",fontSize:"14px",fontWeight:700,cursor:"pointer",
                  opacity:rawCsv.trim()?1:0.5,
                }}>
                วิเคราะห์ CSV →
              </motion.button>
            </motion.div>
          )}

          {/* ── PREVIEW TAB ── */}
          {tab==="preview" && (
            <motion.div key="preview" initial={{opacity:0,x:12}} animate={{opacity:1,x:0}} exit={{opacity:0}}>

              {/* Summary bar */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:"10px",marginBottom:"16px"}}>
                {[
                  {label:"ทั้งหมด",  value:parsed.length, color:"var(--accent-primary)"},
                  {label:"คำใหม่",   value:newCount,       color:"var(--color-success)"},
                  {label:"ซ้ำในDB",  value:duplicates.size, color:"var(--color-warning)"},
                  {label:"ซ้ำในCSV", value:internalDups.size, color:"var(--color-warning)"},
                  {label:"Error",    value:parseErrors.length, color:"var(--color-danger)"},
                ].map((s,i)=>(
                  <div key={i} style={{background:"var(--bg-surface)",border:"1px solid var(--border-default)",
                    borderRadius:"12px",padding:"12px",textAlign:"center" as const}}>
                    <div style={{fontFamily:"var(--font-mono)",fontSize:"22px",fontWeight:700,color:s.color}}>{s.value}</div>
                    <div style={{fontFamily:"var(--font-body)",fontSize:"11px",color:"var(--text-muted)",textTransform:"uppercase" as const,letterSpacing:"0.06em"}}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div style={{background:"var(--bg-surface)",border:"1px solid var(--border-default)",
                borderRadius:"12px",padding:"10px 14px",marginBottom:"14px",display:"flex",
                justifyContent:"space-between",gap:"12px",alignItems:"center" as const,flexWrap:"wrap" as const}}>
                <span style={{fontFamily:"var(--font-body)",fontSize:"13px",color:existingError?"var(--color-warning)":"var(--text-secondary)"}}>
                  {existingLoaded
                    ? existingError || `ตรวจคำซ้ำจากฐานข้อมูลแล้ว ${existingWords.length.toLocaleString()} คำ`
                    : "กำลังโหลดคำจากฐานข้อมูลเพื่อตรวจคำซ้ำ..."}
                </span>
                <span style={{fontFamily:"var(--font-mono)",fontSize:"12px",color:"var(--text-muted)"}}>
                  DB dup {duplicates.size} · CSV dup {internalDups.size}
                </span>
              </div>

              {/* Parse errors */}
              {parseErrors.length > 0 && (
                <div style={{background:"var(--color-danger-bg)",border:"1px solid var(--color-danger)",
                  borderRadius:"12px",padding:"12px 14px",marginBottom:"14px"}}>
                  <p style={{fontFamily:"var(--font-body)",fontSize:"13px",fontWeight:600,color:"var(--color-danger)",margin:"0 0 6px"}}>
                    ⚠️ พบ {parseErrors.length} ข้อผิดพลาด (แถวเหล่านี้จะถูกข้าม)
                  </p>
                  {parseErrors.slice(0,5).map((e,i)=>(
                    <p key={i} style={{fontFamily:"var(--font-mono)",fontSize:"11px",color:"var(--color-danger)",margin:"2px 0"}}>{e}</p>
                  ))}
                  {parseErrors.length > 5 && <p style={{fontFamily:"var(--font-body)",fontSize:"11px",color:"var(--color-danger)",margin:"4px 0 0"}}>...และอีก {parseErrors.length-5} รายการ</p>}
                </div>
              )}

              {/* Skip dup toggle */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
                padding:"10px 14px",borderRadius:"10px",border:"1px solid var(--border-default)",
                background:"var(--bg-surface)",marginBottom:"14px"}}>
                <span style={{fontFamily:"var(--font-body)",fontSize:"13px",color:"var(--text-primary)"}}>
                  ข้ามคำซ้ำ (DB: {duplicates.size}, CSV: {internalDups.size})
                </span>
                <button onClick={()=>setSkipDups(v=>!v)} style={{
                  width:"40px",height:"22px",borderRadius:"9999px",border:"none",cursor:"pointer",
                  position:"relative",background:skipDups?"var(--accent-primary)":"var(--border-strong)",
                  transition:"background 0.2s",flexShrink:0,
                }}>
                  <motion.div animate={{x:skipDups?18:2}} transition={{type:"spring",stiffness:500,damping:30}}
                    style={{width:"18px",height:"18px",borderRadius:"50%",background:"#fff",
                      position:"absolute",top:"2px"}}/>
                </button>
              </div>

              {/* Filter chips */}
              <div style={{display:"flex",gap:"7px",marginBottom:"12px"}}>
                {([
                  {id:"all",label:`ทั้งหมด (${parsed.length})`, color: undefined},
                  {id:"new",label:`คำใหม่ (${newCount})`,  color:"var(--color-success)"},
                  {id:"dup",label:`ซ้ำ (${dupCount})`,     color:"var(--color-warning)"},
                ] as const).map(f=>(
                  <button key={f.id} onClick={()=>setFilter(f.id)} style={{
                    padding:"5px 14px",borderRadius:"9999px",border:"1px solid",
                    borderColor:filter===f.id?"var(--accent-primary)":"var(--border-default)",
                    background:filter===f.id?"var(--accent-primary)":"transparent",
                    color:filter===f.id?"var(--text-on-accent)":(f.color??"var(--text-secondary)"),
                    fontFamily:"var(--font-body)",fontSize:"12px",cursor:"pointer",transition:"all 0.15s",
                  }}>{f.label}</button>
                ))}
              </div>

              {/* Preview table */}
              <div style={{background:"var(--bg-surface)",border:"1px solid var(--border-default)",
                borderRadius:"14px",overflow:"hidden",marginBottom:"16px"}}>
                {/* Table header */}
                <div style={{display:"grid",gridTemplateColumns:"2fr 2fr 1fr 1fr",
                  padding:"10px 14px",background:"var(--bg-subtle)",
                  borderBottom:"1px solid var(--border-default)"}}>
                  {["English","Thai","Category","Status"].map(h=>(
                    <span key={h} style={{fontFamily:"var(--font-body)",fontSize:"11px",
                      color:"var(--text-muted)",textTransform:"uppercase" as const,letterSpacing:"0.06em"}}>{h}</span>
                  ))}
                </div>
                <div style={{maxHeight:"380px",overflowY:"auto" as const}}>
                  {displayRows.slice(0,200).map((r,i)=>{
                    const isDbDup = duplicates.has(r.english??"")
                    const isCsvDup = internalDups.has(r.english??"")
                    const isDup = isDbDup || isCsvDup
                    return (
                      <div key={i} style={{display:"grid",gridTemplateColumns:"2fr 2fr 1fr 1fr",
                        padding:"9px 14px",borderBottom:"1px solid var(--border-default)",
                        background:isDup?"var(--color-warning-bg)":"transparent",
                        opacity:isDup&&skipDups?0.5:1}}>
                        <span style={{fontFamily:"var(--font-body)",fontSize:"13px",fontWeight:600,
                          color:"var(--text-primary)"}}>{r.english}</span>
                        <span style={{fontFamily:"var(--font-body)",fontSize:"13px",
                          color:"var(--text-secondary)"}}>{r.thai}</span>
                        <span style={{fontFamily:"var(--font-body)",fontSize:"12px",
                          color:"var(--text-muted)"}}>{r.category}</span>
                        <span style={{fontFamily:"var(--font-body)",fontSize:"11px",fontWeight:600,
                          color:isDup?"var(--color-warning)":"var(--color-success)"}}>
                          {isCsvDup?"ซ้ำในCSV":isDbDup?"ซ้ำในDB":"ใหม่"}
                        </span>
                      </div>
                    )
                  })}
                  {displayRows.length > 200 && (
                    <div style={{padding:"10px 14px",fontFamily:"var(--font-body)",fontSize:"12px",color:"var(--text-muted)",textAlign:"center" as const}}>
                      ...และอีก {displayRows.length-200} คำ
                    </div>
                  )}
                </div>
              </div>

              {/* Import button */}
              <div style={{display:"flex",gap:"10px"}}>
                <button onClick={()=>setTab("upload")}
                  style={{padding:"12px 20px",borderRadius:"12px",border:"1px solid var(--border-default)",
                    background:"transparent",color:"var(--text-secondary)",fontFamily:"var(--font-body)",
                    fontSize:"14px",cursor:"pointer"}}>
                  ← กลับ
                </button>
                <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}}
                  onClick={() => {
                    console.log('🖱️ CSV PAGE: Import button clicked');
                    console.log(`📊 CSV PAGE: Import settings - Skip duplicates: ${skipDups}, New words: ${newCount}, Total words: ${parsed.length}`);
                    doImport();
                  }} 
                  disabled={importing || !existingLoaded || newCount===0 && skipDups}
                  style={{
                    flex:1,padding:"12px",borderRadius:"12px",border:"none",
                    background:"var(--accent-primary)",color:"var(--text-on-accent)",
                    fontFamily:"var(--font-body)",fontSize:"14px",fontWeight:700,
                    cursor:importing || !existingLoaded || newCount===0 && skipDups ? "not-allowed" : "pointer",
                    opacity:importing || !existingLoaded || newCount===0 && skipDups ? 0.7 : 1,
                  }}>
                  {importing ? "⏳ กำลังนำเข้า..." : !existingLoaded ? "กำลังตรวจคำซ้ำ..." : `✓ นำเข้า ${skipDups?newCount:parsed.length} คำ`}
                </motion.button>
              </div>
              {(importing || importProgress.total > 0 || importError) && (
                <div style={{marginTop:"14px",background:"var(--bg-surface)",border:"1px solid var(--border-default)",
                  borderRadius:"12px",padding:"12px 14px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:"10px",marginBottom:"8px"}}>
                    <span style={{fontFamily:"var(--font-body)",fontSize:"12px",color:importError?"var(--color-danger)":"var(--text-secondary)"}}>
                      {importError || importProgress.message || "พร้อมนำเข้า"}
                    </span>
                    <span style={{fontFamily:"var(--font-mono)",fontSize:"12px",color:"var(--text-muted)",whiteSpace:"nowrap" as const}}>
                      {importProgress.current.toLocaleString()} / {importProgress.total.toLocaleString()}
                    </span>
                  </div>
                  <div style={{height:"8px",borderRadius:"9999px",background:"var(--bg-subtle)",overflow:"hidden"}}>
                    <motion.div animate={{width:`${importError ? 100 : importPct}%`}} transition={{duration:0.25}}
                      style={{height:"100%",borderRadius:"9999px",background:importError?"var(--color-danger)":"var(--accent-primary)"}}/>
                  </div>
                  <p style={{fontFamily:"var(--font-body)",fontSize:"11px",color:"var(--text-muted)",textAlign:"center" as const,margin:"6px 0 0"}}>
                    {importError ? "หยุดนำเข้าแล้ว" : `${importPct}% เสร็จสิ้น · บันทึกแล้ว ${importProgress.imported.toLocaleString()} คำ`}
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* ── DONE TAB ── */}
          {tab==="done" && (
            <motion.div key="done" initial={{opacity:0,scale:0.96}} animate={{opacity:1,scale:1}}
              style={{textAlign:"center" as const,padding:"48px 24px"}}>
              <div style={{fontSize:"56px",marginBottom:"16px"}}>✅</div>
              <h2 style={{fontFamily:"var(--font-display)",fontSize:"24px",fontWeight:700,
                color:"var(--text-primary)",margin:"0 0 8px"}}>
                นำเข้าสำเร็จ!
              </h2>
              <p style={{fontFamily:"var(--font-body)",fontSize:"15px",color:"var(--text-secondary)",margin:"0 0 28px"}}>
                เพิ่มคำใหม่ <strong style={{color:"var(--accent-primary)"}}>{imported.toLocaleString()}</strong> คำ เข้าฐานข้อมูลแล้ว
              </p>
              <div style={{display:"flex",gap:"10px",justifyContent:"center",flexWrap:"wrap" as const}}>
                <a href="/admin-vocab" style={{
                  padding:"12px 24px",borderRadius:"12px",border:"1px solid var(--border-default)",
                  background:"transparent",color:"var(--text-secondary)",fontFamily:"var(--font-body)",
                  fontSize:"14px",textDecoration:"none",display:"inline-block"}}>
                  ← กลับ Vocab DB
                </a>
                <button onClick={()=>{setTab("upload");setRawCsv("");setParsed([]);setParseErrors([]);setImported(0);setImportProgress({current:0,total:0,imported:0,message:""});setImportError("")}}
                  style={{padding:"12px 24px",borderRadius:"12px",border:"none",
                    background:"var(--accent-primary)",color:"var(--text-on-accent)",
                    fontFamily:"var(--font-body)",fontSize:"14px",fontWeight:700,cursor:"pointer"}}>
                  นำเข้าอีกครั้ง
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  )
}
