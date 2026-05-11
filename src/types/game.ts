// english-card-game/src/types/game.ts
export type GameMode = "multiple-choice" | "think-reveal" | "timed" | "typing" | "invert"
export type Difficulty = 1 | 2 | 3 | 4 | 5
export type MarkLevel = 0 | 1 | 2 | 3
export const MARK_LABELS: Record<MarkLevel, string> = { 0:"Active", 1:"Known", 2:"Mastered", 3:"Hidden" }
export const MARK_ICONS:  Record<MarkLevel, string> = { 0:"📖", 1:"✅", 2:"⭐", 3:"🚫" }

export type QuizCategory = "all"|"daily-life"|"fruits"|"top-3000"|"engineering"|"reading-manga"|"reading-novel"|"reading-news"|"custom"
export const QUIZ_CATEGORIES: { id:QuizCategory; label:string; emoji:string; desc:string }[] = [
  { id:"all",           label:"คละทั้งหมด",      emoji:"🎲", desc:"สุ่มจากทุกหมวด" },
  { id:"daily-life",    label:"ชีวิตประจำวัน",   emoji:"🏠", desc:"คำที่ใช้ทุกวัน" },
  { id:"fruits",        label:"ผลไม้",           emoji:"🍎", desc:"ผลไม้และพืชผล" },
  { id:"top-3000",      label:"3000 คำต้องรู้",  emoji:"📚", desc:"คำศัพท์พื้นฐาน" },
  { id:"engineering",   label:"วิศวกรรม",         emoji:"⚙️", desc:"คำเฉพาะทาง" },
  { id:"reading-manga", label:"อ่านการ์ตูน",      emoji:"📕", desc:"มังงะ/อนิเมะ" },
  { id:"reading-novel", label:"อ่านนิยาย",        emoji:"📖", desc:"นิยายภาษาอังกฤษ" },
  { id:"reading-news",  label:"อ่านข่าว",         emoji:"📰", desc:"สื่อและข่าว" },
  { id:"custom",        label:"คำส่วนตัว",        emoji:"👤", desc:"คำที่เพิ่มเอง" },
]
export const QUIZ_SIZES = [10,20,30,50,70,100] as const
export type QuizSize = typeof QUIZ_SIZES[number]

export interface VocabWord {
  id:string; english:string; thai:string; phonetic?:string; example?:string
  category:string; quizCategory?:QuizCategory; difficulty:Difficulty
  synonyms?:string[]; isUserWord?:boolean; ownerId?:string; showInAllQuiz?:boolean
}

export interface WordProgress {
  wordId:string; streakCount:number; attemptCount:number; correctCount:number
  isMastered:boolean; markLevel:MarkLevel; lastSeenAt?:Date; avgTimeMs?:number
}

export interface GameAnswer { wordId:string; selectedOption:string; correct:boolean; timeMs:number }
export interface UserStats {
  totalXP:number; wordsMastered:number; wordsAttempted:number
  currentStreak:number; longestStreak:number; accuracy:number; avgTimeMs:number; totalSessions:number
}

export interface QuizConfig {
  category:QuizCategory; size:QuizSize; mode:GameMode; hintsEnabled:boolean
}
