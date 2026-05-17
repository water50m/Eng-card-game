// english-card-game/src/types/template.ts
import { QuizConfig } from "./game"

export interface QuizTemplate {
  id:          string
  name:        string
  emoji:       string
  desc:        string
  config:      QuizConfig
  isGlobal:    boolean   // created by admin, visible to everyone
  ownerId?:    string    // null = global
  ownerName?:  string
  createdAt:   string
  playCount:   number
  tags:        string[]
}

export const DEFAULT_TEMPLATES: QuizTemplate[] = [
  { id:"t1",  name:"Daily Warm-up",       emoji:"☀️",  desc:"เริ่มวันด้วยคำ 10 คำ ง่ายๆ",          config:{category:"daily-life",  size:10,  mode:"multiple-choice", hintsEnabled:true},  isGlobal:true, createdAt:"2025-01-01", playCount:234, tags:["easy","daily"] },
  { id:"t2",  name:"Speed Run",           emoji:"⚡",  desc:"50 คำ โหมด Timed ไม่มีคำใบ้",         config:{category:"all",         size:50,  mode:"timed",           hintsEnabled:false}, isGlobal:true, createdAt:"2025-01-01", playCount:189, tags:["hard","speed"] },
  { id:"t3",  name:"Fruit Master",        emoji:"🍎",  desc:"ผลไม้ทั้งหมด Think & Reveal",          config:{category:"fruits",      size:20,  mode:"think-reveal",    hintsEnabled:true},  isGlobal:true, createdAt:"2025-01-01", playCount:156, tags:["food","medium"] },
  { id:"t4",  name:"3000 Most Used",      emoji:"📚",  desc:"คำใช้บ่อย 30 คำ พร้อมคำใบ้",        config:{category:"top-3000",    size:30,  mode:"multiple-choice", hintsEnabled:true},  isGlobal:true, createdAt:"2025-01-01", playCount:312, tags:["essential","study"] },
  { id:"t5",  name:"Engineer Talk",       emoji:"⚙️",  desc:"คำเทคนิค 20 คำ Typing mode",           config:{category:"engineering", size:20,  mode:"typing",          hintsEnabled:false}, isGlobal:true, createdAt:"2025-01-01", playCount:98,  tags:["tech","hard"] },
  { id:"t6",  name:"Manga Reader",        emoji:"📕",  desc:"คำในการ์ตูน 30 คำ โหมดกลับด้าน",       config:{category:"reading-manga",size:30, mode:"invert",          hintsEnabled:false}, isGlobal:true, createdAt:"2025-01-01", playCount:201, tags:["manga","invert"] },
  { id:"t7",  name:"Novel Night",         emoji:"📖",  desc:"คำในนิยาย 50 คำ Think & Reveal",        config:{category:"reading-novel",size:50, mode:"think-reveal",    hintsEnabled:true},  isGlobal:true, createdAt:"2025-01-01", playCount:143, tags:["novel","long"] },
  { id:"t8",  name:"News Flash",          emoji:"📰",  desc:"คำข่าว 20 คำ พิมพ์ตอบ",               config:{category:"reading-news", size:20, mode:"typing",          hintsEnabled:true},  isGlobal:true, createdAt:"2025-01-01", playCount:87,  tags:["news","typing"] },
  { id:"t9",  name:"Beginner Boost",      emoji:"🌱",  desc:"คำง่าย 10 คำ มีคำใบ้เต็มที่",           config:{category:"daily-life",  size:10,  mode:"multiple-choice", hintsEnabled:true},  isGlobal:true, createdAt:"2025-01-01", playCount:445, tags:["beginner","easy"] },
  { id:"t10", name:"Hardcore 100",        emoji:"💀",  desc:"100 คำ ไม่มีคำใบ้ Timed",             config:{category:"all",         size:100, mode:"timed",           hintsEnabled:false}, isGlobal:true, createdAt:"2025-01-01", playCount:67,  tags:["extreme","long"] },
  { id:"t11", name:"Thai→English",        emoji:"🔄",  desc:"เห็นไทย เดาอังกฤษ 20 คำ",             config:{category:"all",         size:20,  mode:"invert",          hintsEnabled:false}, isGlobal:true, createdAt:"2025-01-01", playCount:178, tags:["invert","medium"] },
  { id:"t12", name:"Color World",         emoji:"🎨",  desc:"สีทั้งหมดพร้อมคำใบ้",                  config:{category:"all",         size:30,  mode:"multiple-choice", hintsEnabled:true},  isGlobal:true, createdAt:"2025-01-01", playCount:134, tags:["colors","easy"] },
  { id:"t13", name:"Animal Kingdom",      emoji:"🦁",  desc:"สัตว์ 30 คำ แบบกลับด้าน",              config:{category:"all",         size:30,  mode:"invert",          hintsEnabled:true},  isGlobal:true, createdAt:"2025-01-01", playCount:267, tags:["animals","invert"] },
  { id:"t14", name:"Quick 10",            emoji:"🚀",  desc:"10 คำเร็วๆ ไม่มีคำใบ้",               config:{category:"all",         size:10,  mode:"timed",           hintsEnabled:false}, isGlobal:true, createdAt:"2025-01-01", playCount:512, tags:["quick","daily"] },
  { id:"t15", name:"Type It Out",         emoji:"⌨️",  desc:"พิมพ์ตอบ 20 คำ ไม่มีคำใบ้",           config:{category:"all",         size:20,  mode:"typing",          hintsEnabled:false}, isGlobal:true, createdAt:"2025-01-01", playCount:223, tags:["typing","medium"] },
  { id:"t16", name:"Food Lover",          emoji:"🍜",  desc:"อาหาร 20 คำ Multiple Choice",           config:{category:"all",         size:20,  mode:"multiple-choice", hintsEnabled:true},  isGlobal:true, createdAt:"2025-01-01", playCount:198, tags:["food","easy"] },
  { id:"t17", name:"Reveal & Learn",      emoji:"🧠",  desc:"30 คำ Think & Reveal ช้าๆ",             config:{category:"all",         size:30,  mode:"think-reveal",    hintsEnabled:true},  isGlobal:true, createdAt:"2025-01-01", playCount:289, tags:["learn","study"] },
  { id:"t18", name:"Place Explorer",      emoji:"🗺️",  desc:"สถานที่ 20 คำ Typing",                  config:{category:"all",         size:20,  mode:"typing",          hintsEnabled:true},  isGlobal:true, createdAt:"2025-01-01", playCount:112, tags:["places","medium"] },
  { id:"t19", name:"Verb Attack",         emoji:"⚔️",  desc:"กริยา 30 คำ Timed ไม่มีคำใบ้",          config:{category:"all",         size:30,  mode:"timed",           hintsEnabled:false}, isGlobal:true, createdAt:"2025-01-01", playCount:156, tags:["verbs","hard"] },
  { id:"t20", name:"Review Mode",         emoji:"🔁",  desc:"คำที่เคยผิด 20 คำ Think & Reveal",      config:{category:"all",         size:20,  mode:"think-reveal",    hintsEnabled:true},  isGlobal:true, createdAt:"2025-01-01", playCount:334, tags:["review","all"] },
]

const TEMPLATE_STORAGE_KEY = "ecg-user-templates"

export function loadUserTemplates(): QuizTemplate[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(TEMPLATE_STORAGE_KEY) ?? "[]") }
  catch { return [] }
}

export function saveUserTemplate(t: QuizTemplate): void {
  const list = loadUserTemplates().filter(x => x.id !== t.id)
  localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify([...list, t]))
}

export function deleteUserTemplate(id: string): void {
  localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(loadUserTemplates().filter(x => x.id !== id)))
}


// ── Pin & Like storage ────────────────────────────────────────
const PIN_KEY  = "ecg-template-pins"
const LIKE_KEY = "ecg-template-likes"

export function getPinnedIds(): string[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(PIN_KEY) ?? "[]") } catch { return [] }
}

export function getLikedIds(): string[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(LIKE_KEY) ?? "[]") } catch { return [] }
}

export function togglePin(id: string): string[] {
  const current = getPinnedIds()
  const next = current.includes(id) ? current.filter(x=>x!==id) : [...current, id]
  localStorage.setItem(PIN_KEY, JSON.stringify(next))
  return next
}

export function toggleLike(id: string): string[] {
  const current = getLikedIds()
  const next = current.includes(id) ? current.filter(x=>x!==id) : [...current, id]
  localStorage.setItem(LIKE_KEY, JSON.stringify(next))
  return next
}
