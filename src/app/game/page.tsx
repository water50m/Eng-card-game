// english-card-game/src/app/game/page.tsx
"use client"
import { useState, useEffect, useRef, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  VocabWord, WordProgress, MarkLevel, Difficulty,
  MARK_ICONS, QuizCategoryOption, QuizConfig, QUIZ_CATEGORIES,
} from "../../types/game"
import { QuizTemplate } from "../../types/template"
import { SEED_VOCABULARY } from "../../data/vocabulary"
import { updateProgress, calcXP, buildOptions } from "../../lib/gameLogic"
import { NavBar } from "../../components/NavBar"
import { useTheme } from "../../themes/ThemeProvider"
import { ConfettiCanvas } from "../../components/ConfettiCanvas"
import { getOptionStyle } from "../../themes/themes"
import {
  BASE_STYLE_CARDS,
  DEFAULT_STYLE_DIFFICULTY,
  EXAM_UNLOCK_COUNT,
  MasteryPrompt,
  PlayableCard,
  StyleDifficulty,
  normalizeCard,
  normalizeStyleDifficulty,
  loadPlayableCards,
} from "../../lib/studyCards"
import {
  Ico,
  ConfigModal,
  SaveTemplatePopup,
  MasteryConfirmPopup,
  ExamRoom,
  ResultScreen,
  TemplateGrid,
  TypingInput,
  MarkBar,
  StopWarnModal,
  CardWordsManager,
  StoryReaderModal,
} from "../../components/game"

// ─── constants ───────────────────────────────────────────────
const TIMED_SECONDS = 15
const ANSWER_NEXT_DELAY_CORRECT = 850
const ANSWER_NEXT_DELAY_WRONG = 1100
const MASTERED_NEXT_DELAY = 250
const HIDDEN_MASTERED_NEXT_DELAY = 450
const MARK_READY_NEXT_DELAY = 200

type ApiVocabWord = {
  id: string | number
  english: string
  thai: string
  phonetic?: string | null
  example?: string | null
  category?: string | null
  difficulty?: number | string | null
  isUserWord?: boolean
}

type StudyStateResponse = {
  cards: PlayableCard[]
  examReadyIds: string[]
  hideMasteryPrompt: boolean
  styleDifficulty: Record<string, StyleDifficulty>
}

type DeckWordsResponse = {
  wordIds: string[]
  words?: ApiVocabWord[]
  state?: StudyStateResponse
}

function shuffleWords(words: VocabWord[]) {
  return [...words].sort(() => Math.random() - 0.5)
}

function toVocabWord(word: ApiVocabWord): VocabWord {
  return {
    id:String(word.id),
    english:word.english,
    thai:word.thai,
    phonetic:word.phonetic ?? undefined,
    example:word.example ?? undefined,
    category:word.category || "custom",
    difficulty:Math.min(5, Math.max(1, Number(word.difficulty) || 2)) as Difficulty,
    isUserWord:Boolean(word.isUserWord),
  }
}

// ═════════════════════════════════════════════════════════════
// MAIN PAGE
// ═════════════════════════════════════════════════════════════
export default function GamePage() {
  const { theme } = useTheme()
  const [mounted,setMounted] = useState(false)
  useEffect(()=>setMounted(true),[])

  const [allWords,setAllWords] = useState<VocabWord[]>(SEED_VOCABULARY)
  const wordCacheRef = useRef<Map<string,VocabWord>>(new Map(SEED_VOCABULARY.map(w => [w.id, w])))
  const [categoryOptions,setCategoryOptions] = useState<QuizCategoryOption[]>(QUIZ_CATEGORIES)
  const [studyStateLoaded,setStudyStateLoaded] = useState(false)
  const wordById = useMemo(()=>new Map(allWords.map(w => [w.id, w])),[allWords])
  const categoryLabelById = useMemo(()=>new Map(categoryOptions.map(c => [c.id, c.label])),[categoryOptions])
  const allThai    = useMemo(()=>allWords.map(w=>w.thai),[allWords])
  const allEnglish = useMemo(()=>allWords.map(w=>w.english),[allWords])

  // Template / config
  const [config,setConfig]         = useState<QuizConfig>({category:"all",size:10,mode:"multiple-choice",hintsEnabled:true})
  const [showConfig,setShowConfig] = useState(false)
  const [showSaveTpl,setShowSaveTpl] = useState(false)
  const [showTemplates,setShowTemplates] = useState(true)
  const [activeCard,setActiveCard] = useState<PlayableCard|null>(null)
  const [pendingTemplate,setPendingTemplate] = useState<QuizTemplate|null>(null)
  const [configIntent,setConfigIntent] = useState<"card"|"create"|"template">("card")
  const [examReadyIds,setExamReadyIds] = useState<string[]>([])
  const [showExam,setShowExam] = useState(false)
  const [hideMasteryPrompt,setHideMasteryPrompt] = useState(false)
  const [styleDifficulty,setStyleDifficulty] = useState<Record<string,StyleDifficulty>>(DEFAULT_STYLE_DIFFICULTY)
  const [masteryPrompt,setMasteryPrompt] = useState<MasteryPrompt|null>(null)
  const [studyCards,setStudyCards] = useState<PlayableCard[]>([])
  const [storyReaderCard,setStoryReaderCard] = useState<PlayableCard|null>(null)
  const [wordManagerCard,setWordManagerCard] = useState<PlayableCard|null>(null)
  const [wordManagerIds,setWordManagerIds] = useState<string[]>([])
  const [wordManagerWords,setWordManagerWords] = useState<VocabWord[]>([])
  const [wordManagerLoading,setWordManagerLoading] = useState(false)
  const [preloadedDecks,setPreloadedDecks] = useState<Record<string,string[]>>({})
  const [preloadedDeckWords,setPreloadedDeckWords] = useState<Record<string,VocabWord[]>>({})

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
  const [showStopWarn,setShowStopWarn] = useState(false)
  const [startingQuiz,setStartingQuiz] = useState(false)
  const timerRef  = useRef<ReturnType<typeof setInterval>|null>(null)
  const wordStart = useRef<number>(0)
  const nextTimerRef = useRef<ReturnType<typeof setTimeout>|null>(null)

  const inverted = config.mode==="invert"
  const isTyping = config.mode==="typing"||inverted
  const isTimed = config.mode==="timed"||config.mode==="timed-reveal"
  const isRevealMode = config.mode==="think-reveal"||config.mode==="timed-reveal"
  const isFirst  = quizIndex===0 && selected===null

  // mark levels
  const wordP  = currentWord ? progress.get(currentWord.id) : undefined
  const markLv = (wordP?.markLevel??0) as MarkLevel
  const streak = wordP?.streakCount??0
  const mastered= [...progress.values()].filter(p=>p.isMastered).length
  const timerPct = timeLeft/TIMED_SECONDS
  const timerColor = timerPct>0.5?"var(--color-success)":timerPct>0.25?"var(--color-warning)":"var(--color-danger)"

  const examWords = useMemo(() => {
    const ready = new Set(examReadyIds)
    return allWords.filter(w => ready.has(w.id)).slice(0, EXAM_UNLOCK_COUNT)
  }, [allWords, examReadyIds])

  function getToken() {
    if (typeof window === "undefined") return null
    return localStorage.getItem("ecg-token")
  }

  function replaceAllWords(words: VocabWord[]) {
    wordCacheRef.current = new Map(words.map(word => [word.id, word]))
    setAllWords(words)
  }

  function mergeWordsIntoAllWords(words: VocabWord[]) {
    if(words.length === 0) return

    for(const word of words) {
      wordCacheRef.current.set(word.id, word)
    }

    setAllWords(prev => {
      const next = new Map(prev.map(word => [word.id, word]))
      for(const word of words) next.set(word.id, word)
      return Array.from(next.values())
    })
  }

  function cacheDeckWords(cardId: string, words: VocabWord[]) {
    if(words.length === 0) return
    setPreloadedDeckWords(prev => ({...prev, [cardId]:words}))
    mergeWordsIntoAllWords(words)
  }

  function applyStudyState(data: { cards?: PlayableCard[]; examReadyIds?: string[]; hideMasteryPrompt?: boolean; styleDifficulty?: unknown; decks?: Record<string,string[]> }) {
    if(data.cards) setStudyCards(data.cards.map(c => normalizeCard(c, c.learningStyle, "user")))
    if(data.examReadyIds) setExamReadyIds(data.examReadyIds)
    if(typeof data.hideMasteryPrompt === "boolean") setHideMasteryPrompt(data.hideMasteryPrompt)
    if(data.styleDifficulty) setStyleDifficulty(normalizeStyleDifficulty(data.styleDifficulty))
    if(data.decks) setPreloadedDecks(prev => ({...prev, ...data.decks}))
  }

  async function studyRequest<T>(body?: Record<string, unknown>): Promise<T | null> {
    const token = getToken()
    if(!token) return null
    const res = await fetch("/api/game/study", {
      method: body ? "POST" : "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    if(!res.ok) {
      console.error("Study API error:", await res.text().catch(() => res.statusText))
      return null
    }
    return res.json()
  }

  async function loadStudyState() {
    try {
      const data = await studyRequest<{ cards: PlayableCard[]; examReadyIds: string[]; hideMasteryPrompt: boolean; styleDifficulty?: Record<string,StyleDifficulty>; decks?: Record<string,string[]> }>()
      if(data) applyStudyState(data)
      else setStudyCards(loadPlayableCards())
    } finally {
      setStudyStateLoaded(true)
    }
  }

  useEffect(()=>{
    if(mounted) loadStudyState()
  },[mounted]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(()=>{
    if(!mounted || !studyStateLoaded) return

    const controller = new AbortController()
    const timeout = setTimeout(async () => {
      const token = localStorage.getItem("ecg-token")
      if(!token) return

      try {
        const res = await fetch("/api/vocabulary", {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })
        if(!res.ok) return

        const data = await res.json()
        if(Array.isArray(data) && data.length > 0) {
          replaceAllWords((data as ApiVocabWord[]).map(toVocabWord))
        }
      } catch (error) {
        if((error as Error).name !== "AbortError") {
          console.error("โหลดคำศัพท์จากฐานข้อมูลไม่สำเร็จ:", error)
        }
      }
    }, 500)

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  },[mounted,studyStateLoaded])

  useEffect(()=>{
    if(!mounted || !studyStateLoaded) return

    const controller = new AbortController()
    const token = getToken()
    if(!token) return

    fetch("/api/game/vocabulary/themes", {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if(Array.isArray(data) && data.length > 0) setCategoryOptions(data)
      })
      .catch(error => {
        if((error as Error).name !== "AbortError") {
          console.error("โหลดหมวดคำศัพท์ไม่สำเร็จ:", error)
        }
      })

    return () => controller.abort()
  },[mounted,studyStateLoaded])

  function wordsFromIds(ids: string[], extraWords: VocabWord[] = []) {
    const lookup = new Map(wordCacheRef.current)
    for(const word of extraWords) lookup.set(word.id, word)
    return ids.map(id => lookup.get(id) ?? wordById.get(id)).filter((w): w is VocabWord => Boolean(w))
  }

  function expectedDeckSize(card: PlayableCard, cfg: QuizConfig = card.config) {
    return card.learningStyle === "wide" ? 100 : Math.max(1, Number(cfg.size) || 10)
  }

  async function ensureCardDeck(card: PlayableCard, cfg: QuizConfig = card.config) {
    const cached = preloadedDecks[card.id]
    const expectedSize = expectedDeckSize(card, cfg)
    if(cached && cached.length >= expectedSize) {
      const cachedWords = wordsFromIds(cached, preloadedDeckWords[card.id] ?? [])
      if(cachedWords.length >= Math.min(cached.length, expectedSize)) return { wordIds:cached, words:cachedWords }
    }

    const data = await studyRequest<DeckWordsResponse>({
      action:"ensure-deck",
      cardId:card.id,
      config:cfg,
      learningStyle:card.learningStyle,
    })
    if(data?.state) applyStudyState(data.state)
    if(data?.wordIds) setPreloadedDecks(prev => ({...prev, [card.id]:data.wordIds}))
    const fetchedWords = data?.words?.map(toVocabWord) ?? []
    if(fetchedWords.length) cacheDeckWords(card.id, fetchedWords)

    return {
      wordIds:data?.wordIds ?? shuffleWords(allWords).slice(0, cfg.size).map(w=>w.id),
      words:fetchedWords,
    }
  }

  async function openWordManager(card: PlayableCard) {
    setWordManagerCard(card)
    setWordManagerLoading(true)
    const data = await studyRequest<DeckWordsResponse>({
      action:"get-card-words",
      cardId:card.id,
      config:card.config,
      learningStyle:card.learningStyle,
    })
    if(data?.state) applyStudyState(data.state)
    const fetchedWords = data?.words?.map(toVocabWord) ?? []
    if(fetchedWords.length) cacheDeckWords(card.id, fetchedWords)
    setWordManagerIds(data?.wordIds ?? [])
    setWordManagerWords(fetchedWords.length ? fetchedWords : wordsFromIds(data?.wordIds ?? [], preloadedDeckWords[card.id] ?? []))
    if(data?.wordIds) setPreloadedDecks(prev => ({...prev, [card.id]:data.wordIds}))
    setWordManagerLoading(false)
  }

  async function addWordToManagedCard(wordId: string) {
    if(!wordManagerCard) return
    const data = await studyRequest<DeckWordsResponse>({
      action:"add-card-word",
      cardId:wordManagerCard.id,
      wordId,
      config:wordManagerCard.config,
      learningStyle:wordManagerCard.learningStyle,
    })
    if(data?.state) applyStudyState(data.state)
    if(data?.wordIds) setWordManagerIds(data.wordIds)
    if(data?.wordIds) setPreloadedDecks(prev => ({...prev, [wordManagerCard.id]:data.wordIds}))
    if(data?.words) {
      const fetchedWords = data.words.map(toVocabWord)
      cacheDeckWords(wordManagerCard.id, fetchedWords)
      setWordManagerWords(fetchedWords)
    }
  }

  async function randomWordForManagedCard(category: string) {
    if(!wordManagerCard) return null
    const data = await studyRequest<{ word?: ApiVocabWord | null }>({
      action:"random-card-word",
      category,
      excludeIds:wordManagerIds,
    })
    if(!data?.word) return null
    const word = toVocabWord(data.word)
    mergeWordsIntoAllWords([word])
    return word
  }

  async function removeWordFromManagedCard(wordId: string) {
    if(!wordManagerCard) return
    const data = await studyRequest<DeckWordsResponse>({
      action:"remove-card-word",
      cardId:wordManagerCard.id,
      wordId,
      config:wordManagerCard.config,
      learningStyle:wordManagerCard.learningStyle,
    })
    if(data?.state) applyStudyState(data.state)
    if(data?.wordIds) setWordManagerIds(data.wordIds)
    if(data?.wordIds) setPreloadedDecks(prev => ({...prev, [wordManagerCard.id]:data.wordIds}))
    if(data?.words) {
      const fetchedWords = data.words.map(toVocabWord)
      cacheDeckWords(wordManagerCard.id, fetchedWords)
      setWordManagerWords(fetchedWords)
    }
    setQuizQueue(q => wordManagerCard.id === activeCard?.id ? q.filter(w => w.id !== wordId) : q)
  }

  async function markWordReady(wordId: string) {
    if(!activeCard) return
    if(activeCard.story) {
      setExamReadyIds(prev => prev.includes(wordId) ? prev : [...prev, wordId])
      setQuizQueue(q => q.filter(w => w.id !== wordId).slice(0, activeCard.config.size))
      return
    }

    const data = await studyRequest<{ wordIds?: string[]; words?: ApiVocabWord[]; examReadyIds?: string[]; state?: StudyStateResponse }>({
      action:"mark-ready",
      wordId,
      cardId:activeCard.id,
      config:activeCard.config,
      learningStyle:activeCard.learningStyle,
    })
    if(data) applyStudyState(data)
    if(data?.state) applyStudyState(data.state)
    if(data?.wordIds) {
      setPreloadedDecks(prev => ({...prev, [activeCard.id]:data.wordIds!}))
      const fetchedWords = data.words?.map(toVocabWord) ?? []
      if(fetchedWords.length) cacheDeckWords(activeCard.id, fetchedWords)
      const refreshedWords = wordsFromIds(data.wordIds, fetchedWords.length ? fetchedWords : preloadedDeckWords[activeCard.id] ?? [])
      setQuizQueue(q => {
        const activeIds = new Set(q.map(w=>w.id))
        const additions = refreshedWords.filter(w => !activeIds.has(w.id))
        return q.filter(w => w.id !== wordId).concat(additions).slice(0, activeCard.config.size)
      })
    }
  }

  async function buildQueue(card:PlayableCard, cfg:QuizConfig, words?:VocabWord[]):Promise<VocabWord[]> {
    if(words) return shuffleWords(words).slice(0, cfg.size)
    if(card.story) {
      mergeWordsIntoAllWords(card.story.vocabulary)
      const available = card.story.vocabulary.filter(w => {
        const p=progress.get(w.id); const m=(p?.markLevel??0) as MarkLevel
        return m < 2 && !examReadyIds.includes(w.id)
      })
      const pool = available.length > 0 ? available : card.story.vocabulary
      return shuffleWords(pool).slice(0, Math.min(cfg.size, pool.length))
    }

    const deck = await ensureCardDeck(card, cfg)
    const deckWords = wordsFromIds(deck.wordIds, deck.words).slice(0, Math.max(1, Number(cfg.size) || 10))
    if(deckWords.length === 0) return shuffleWords(allWords).slice(0, cfg.size)
    const available = deckWords.filter(w => {
      const p=progress.get(w.id); const m=(p?.markLevel??0) as MarkLevel
      return m < 2 && !examReadyIds.includes(w.id)
    })
    const pool = available.length > 0 ? available : deckWords
    return shuffleWords(pool).slice(0, Math.min(cfg.size, pool.length))
  }

  async function startQuiz(card:PlayableCard = activeCard ?? BASE_STYLE_CARDS[0], cfg:QuizConfig=card.config, words?:VocabWord[]) {
    const normalizedCard = {...card, config:cfg}
    try {
      setActiveCard(normalizedCard)
      setConfig(cfg)
      const queue = await buildQueue(normalizedCard, cfg, words)
      setQuizQueue(queue); setQuizIndex(0); setQuizActive(true); setQuizDone(false)
      setShowTemplates(false); setShowConfig(false)
      if(queue.length>0) loadWord(queue[0],cfg)
    } finally {
      setStartingQuiz(false)
    }
  }

  function queueStartQuiz(card?:PlayableCard, cfg?:QuizConfig, words?:VocabWord[]) {
    if(startingQuiz) return
    const nextCard = card ?? activeCard ?? BASE_STYLE_CARDS[0]
    const nextConfig = cfg ?? nextCard.config
    setStartingQuiz(true)
    window.setTimeout(() => {
      void startQuiz(nextCard, nextConfig, words)
    }, 0)
  }

  function loadWord(word:VocabWord, cfg:QuizConfig=config) {
    setCurrentWord(word); setOptions(buildOptions(word,Array.from(wordCacheRef.current.values())))
    setSelected(null); setRevealed(false); setFeedback(null); setMasteredNow(false)
    wordStart.current=Date.now()
    if(cfg.mode==="timed"||cfg.mode==="timed-reveal"){ setTimeLeft(TIMED_SECONDS); setTimerActive(true) }
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

  function askMasteryConfirm(word: VocabWord) {
    return new Promise<boolean>(resolve => setMasteryPrompt({ wordId:word.id, english:word.english, thai:word.thai, resolve }))
  }

  function scheduleNext(delay: number) {
    if(nextTimerRef.current) clearTimeout(nextTimerRef.current)
    nextTimerRef.current = setTimeout(nextWord, delay)
  }

  async function handleAnswer(chosen:string, correct:boolean) {
    if(selected!==null||!currentWord)return
    clearInterval(timerRef.current!); setTimerActive(false)
    const timeMs=Date.now()-wordStart.current
    setSelected(chosen); setFeedback(correct?"correct":"wrong")
    const prev=progress.get(currentWord.id)??{wordId:currentWord.id,streakCount:0,attemptCount:0,correctCount:0,isMastered:false,markLevel:0 as MarkLevel}
    const newP=updateProgress(prev,{wordId:currentWord.id,selectedOption:chosen,correct,timeMs})
    const xp=calcXP({wordId:currentWord.id,selectedOption:chosen,correct,timeMs},prev.streakCount)
    setProgress(p=>new Map(p).set(currentWord.id,newP))
    setTotalXP(x=>x+xp)
    if(!prev.isMastered&&newP.isMastered){
      setMasteredNow(true)
      setShowConfetti(true)
      setTimeout(()=>setShowConfetti(false),3500)

      if(hideMasteryPrompt) {
        await markWordReady(currentWord.id)
        scheduleNext(HIDDEN_MASTERED_NEXT_DELAY)
        return
      }

      const confirmed = await askMasteryConfirm(currentWord)
      if(confirmed) {
        await markWordReady(currentWord.id)
      } else {
        setMasteredNow(false)
        setShowConfetti(false)
        setProgress(p=>new Map(p).set(currentWord.id,{
          wordId:currentWord.id,
          streakCount:0,
          attemptCount:0,
          correctCount:0,
          isMastered:false,
          markLevel:0 as MarkLevel,
          lastSeenAt:new Date(),
        }))
      }
      scheduleNext(MASTERED_NEXT_DELAY)
      return
    }
    scheduleNext(correct?ANSWER_NEXT_DELAY_CORRECT:ANSWER_NEXT_DELAY_WRONG)
  }

  async function setMarkLevel(lv:MarkLevel) {
    if(!currentWord)return
    const prev=progress.get(currentWord.id)??{wordId:currentWord.id,streakCount:0,attemptCount:0,correctCount:0,isMastered:false,markLevel:0 as MarkLevel}
    const nextProgress = {...prev,markLevel:lv,isMastered:lv >= 2 ? true : prev.isMastered}
    setProgress(p=>new Map(p).set(currentWord.id,nextProgress))
    if(lv >= 2){
      await markWordReady(currentWord.id)
      scheduleNext(MARK_READY_NEXT_DELAY)
    }
  }

  function handleRestart(mode:"same"|"partial"|"random") {
    setQuizDone(false); setQuizActive(false)
    const card = activeCard ?? BASE_STYLE_CARDS[0]
    if(mode==="same"){
      queueStartQuiz(card, config, quizQueue)
    } else if(mode==="partial"){
      const unmastered = quizQueue.filter(w=>!progress.get(w.id)?.isMastered)
      queueStartQuiz(card, config, unmastered.length>0?unmastered:quizQueue)
    } else {
      queueStartQuiz(card, config)
    }
  }

  function exitQuizResult() {
    if(timerRef.current) clearInterval(timerRef.current)
    if(nextTimerRef.current) clearTimeout(nextTimerRef.current)
    setQuizDone(false)
    setQuizActive(false)
    setCurrentWord(null)
    setSelected(null)
    setFeedback(null)
    setTimerActive(false)
    setShowTemplates(true)
  }

  async function saveCardToDatabase(card: PlayableCard) {
    const data = await studyRequest<{ cards: PlayableCard[]; examReadyIds: string[]; hideMasteryPrompt: boolean }>({
      action:"save-card",
      card,
    })
    if(data) applyStudyState(data)
  }

  async function handleSaveTemplate(name:string, emoji:string, restartNow:boolean) {
    const baseTemplate = pendingTemplate
    const tpl:PlayableCard = {
      id:`u-${Date.now()}`, name, emoji, desc:"My custom template",
      config, isGlobal:false, createdAt:new Date().toISOString(), playCount:0, tags:["custom"],
      learningStyle: activeCard?.learningStyle ?? (baseTemplate ? "fast" : "fast"),
      source:"user",
      templateId:baseTemplate?.id,
    }
    await saveCardToDatabase(tpl)
    setShowSaveTpl(false)
    setPendingTemplate(null)
    if(restartNow) queueStartQuiz(tpl, tpl.config)
    else setShowConfig(false)
  }

  async function handleUseConfig() {
    setShowConfig(false)
    if(activeCard?.story) {
      const updated = {...activeCard, config}
      setActiveCard(updated)
      if(isFirst) queueStartQuiz(updated, config)
      return
    }

    if(activeCard?.source === "user") {
      const updated = {...activeCard, config}
      setActiveCard(updated)
      await saveCardToDatabase(updated)
      if(isFirst) queueStartQuiz(updated, config)
      return
    }
    if(isFirst) queueStartQuiz(activeCard ?? BASE_STYLE_CARDS[0], config)
  }

  async function handleStyleDifficultyChange(cardId: string, level: StyleDifficulty) {
    const next = normalizeStyleDifficulty({...styleDifficulty, [cardId]:level})
    setStyleDifficulty(next)
    const data = await studyRequest<{ styleDifficulty?: Record<string,StyleDifficulty> }>({
      action:"setting",
      key:"styleDifficulty",
      value:next,
    })
    if(data) applyStudyState(data)
  }

  function openStoryReader(card: PlayableCard) {
    setStoryReaderCard(card)
    setActiveCard(card)
    setConfig(card.config)
    if(card.story) mergeWordsIntoAllWords(card.story.vocabulary)
  }

  function closeStoryReader() {
    const cardId = storyReaderCard?.id
    setStoryReaderCard(null)
    if(activeCard?.id === cardId) {
      setActiveCard(null)
      setConfig(BASE_STYLE_CARDS[0].config)
    }
  }

  function configureStory(card: PlayableCard) {
    setStoryReaderCard(null)
    setActiveCard(card)
    setConfig(card.config)
    setShowConfig(true)
  }

  const storyCategoryOptions: QuizCategoryOption[] = [{ id:"story", label:"คำในเรื่อง", emoji:"📖", desc:"ใช้เฉพาะคำศัพท์จากเรื่องเล่านี้", count:activeCard?.story?.vocabulary.length }]
  const activeCategoryOptions = activeCard?.story ? storyCategoryOptions : categoryOptions

  async function handleExamPassed(wordIds: string[]) {
    const data = await studyRequest<{ cards?: PlayableCard[]; examReadyIds?: string[]; hideMasteryPrompt?: boolean }>({
      action:"exam-passed",
      wordIds,
    })
    if(data) applyStudyState(data)
  }

  async function confirmMastery(confirmed: boolean, hideNext = false) {
    const prompt = masteryPrompt
    if(!prompt) return
    setMasteryPrompt(null)
    if(hideNext) {
      setHideMasteryPrompt(true)
      const data = await studyRequest<{ cards?: PlayableCard[]; examReadyIds?: string[]; hideMasteryPrompt?: boolean }>({
        action:"setting",
        key:"hideMasteryPrompt",
        value:true,
      })
      if(data) applyStudyState(data)
    }
    prompt.resolve(confirmed)
  }

  if(!mounted) return <div style={{minHeight:"100vh",background:"var(--bg-base)"}}><NavBar/></div>

  // ── RESULT ──
  if(quizDone) return (
    <div style={{minHeight:"100vh",background:"var(--bg-base)",paddingBottom:"80px"}}>
      <NavBar/>
      <ResultScreen queue={quizQueue} progress={progress} totalXP={totalXP} onRestart={handleRestart} onExit={exitQuizResult}/>
    </div>
  )

  // ── START SCREEN ──
  if(!quizActive||!currentWord) return (
    <div style={{minHeight:"100vh",background:"var(--bg-base)",paddingBottom:"80px"}}>
      <NavBar/>
      <AnimatePresence>{showConfig&&(
        <ConfigModal config={config} onChange={setConfig}
          onUseNow={handleUseConfig} onSaveNew={()=>{setShowConfig(false);setShowSaveTpl(true)}}
          onClose={()=>setShowConfig(false)} isFirstWord={!activeCard?.story} allWords={allWords} categoryOptions={activeCategoryOptions}/>
      )}</AnimatePresence>
      <AnimatePresence>{storyReaderCard&&(
        <StoryReaderModal
          card={storyReaderCard}
          onClose={closeStoryReader}
          onStart={()=>{ setStoryReaderCard(null); queueStartQuiz(storyReaderCard, storyReaderCard.config) }}
          onConfigure={()=>configureStory(storyReaderCard)}
        />
      )}</AnimatePresence>
      <AnimatePresence>{showSaveTpl&&(
        <SaveTemplatePopup config={config} onSave={handleSaveTemplate} onCancel={()=>setShowSaveTpl(false)}/>
      )}</AnimatePresence>
      <AnimatePresence>{showExam&&examWords.length>0&&(
        <ExamRoom words={examWords} allWords={allWords} onClose={()=>setShowExam(false)} onPassed={handleExamPassed}/>
      )}</AnimatePresence>
      <AnimatePresence>{wordManagerCard&&(
        <CardWordsManager
          card={wordManagerCard}
          words={wordManagerWords}
          allWords={allWords}
          categoryOptions={categoryOptions}
          loading={wordManagerLoading}
          onClose={()=>setWordManagerCard(null)}
          onAddWord={addWordToManagedCard}
          onRandomWord={randomWordForManagedCard}
          onRemoveWord={removeWordFromManagedCard}
        />
      )}</AnimatePresence>

      <main style={{maxWidth:"900px",margin:"0 auto",padding:"24px 16px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"24px",gap:"12px",flexWrap:"wrap" as const}}>
          <div>
            <h1 style={{fontFamily:"var(--font-display)",fontSize:"26px",fontWeight:700,color:"var(--text-primary)",margin:"0 0 4px",letterSpacing:"-0.02em"}}>
              🃏 เลือก Template
            </h1>
            <p style={{fontFamily:"var(--font-body)",fontSize:"14px",color:"var(--text-muted)",margin:0}}>
              กดเล่นได้เลย หรือ&nbsp;
              <button onClick={()=>{ setActiveCard(null); setConfig(BASE_STYLE_CARDS[0].config); setShowConfig(true) }} style={{background:"none",border:"none",cursor:"pointer",color:"var(--accent-primary)",fontFamily:"var(--font-body)",fontSize:"14px",padding:0,textDecoration:"underline"}}>
                ตั้งค่าเอง
              </button>
            </p>
          </div>
          <div style={{display:"flex",gap:"9px",flexWrap:"wrap" as const,justifyContent:"flex-end"}}>
            <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}}
              onClick={()=>setShowExam(true)}
              disabled={examReadyIds.length < EXAM_UNLOCK_COUNT}
              title={examReadyIds.length < EXAM_UNLOCK_COUNT ? `ต้องมีคำรอสอบ ${EXAM_UNLOCK_COUNT} คำ` : "เข้าห้องสอบ"}
              style={{padding:"11px 18px",borderRadius:"12px",border:"1px solid var(--border-default)",background:examReadyIds.length >= EXAM_UNLOCK_COUNT ? "var(--bg-surface)" : "var(--bg-subtle)",
                color:examReadyIds.length >= EXAM_UNLOCK_COUNT ? "var(--accent-primary)" : "var(--text-muted)",fontFamily:"var(--font-body)",fontSize:"14px",fontWeight:700,
                cursor:examReadyIds.length >= EXAM_UNLOCK_COUNT ? "pointer" : "not-allowed",display:"flex",alignItems:"center" as const,gap:"6px"}}>
              🎓 สอบ {examReadyIds.length}/{EXAM_UNLOCK_COUNT}
            </motion.button>
            <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}}
              onClick={()=>queueStartQuiz()}
              disabled={startingQuiz}
              style={{padding:"11px 22px",borderRadius:"12px",border:"none",background:"var(--accent-primary)",
                color:"var(--text-on-accent)",fontFamily:"var(--font-body)",fontSize:"14px",fontWeight:700,
                cursor:startingQuiz?"wait":"pointer",display:"flex",alignItems:"center" as const,gap:"6px",boxShadow:"0 0 20px var(--accent-glow)",opacity:startingQuiz?0.75:1}}>
              {Ico.play} {startingQuiz ? "กำลังเริ่ม..." : "เริ่มเลย!"}
            </motion.button>
          </div>
        </div>
        <TemplateGrid
          cards={studyCards}
          styleDifficulty={styleDifficulty}
          onSelect={t=>queueStartQuiz(t,t.config)}
          onUseTemplate={t=>{ setPendingTemplate(t); setConfig(t.config); setShowSaveTpl(true) }}
          onConfigure={t=>{ setActiveCard(t); setConfig(t.config); setShowConfig(true) }}
          onManageWords={openWordManager}
          onOpenStory={openStoryReader}
          onStyleDifficultyChange={handleStyleDifficultyChange}
        />
      </main>
    </div>
  )

  // ── ACTIVE QUIZ ──
  return (
    <div style={{minHeight:"100vh",background:"var(--bg-base)",paddingBottom:"80px"}}>
      <ConfettiCanvas active={showConfetti}/>
      <AnimatePresence>{showStopWarn&&(
        <StopWarnModal
          answered={quizIndex}
          total={quizQueue.length}
          onConfirm={()=>{ setShowStopWarn(false); setQuizActive(false); setQuizDone(false); setShowTemplates(true) }}
          onCancel={()=>setShowStopWarn(false)}
        />
      )}</AnimatePresence>
      <AnimatePresence>{masteryPrompt&&(
        <MasteryConfirmPopup
          prompt={masteryPrompt}
          onConfirm={()=>confirmMastery(true, true)}
          onLucky={()=>confirmMastery(false)}
        />
      )}</AnimatePresence>
      <AnimatePresence>{showExam&&examWords.length>0&&(
        <ExamRoom words={examWords} allWords={allWords} onClose={()=>setShowExam(false)} onPassed={handleExamPassed}/>
      )}</AnimatePresence>
      <AnimatePresence>{wordManagerCard&&(
        <CardWordsManager
          card={wordManagerCard}
          words={wordManagerWords}
          allWords={allWords}
          categoryOptions={categoryOptions}
          loading={wordManagerLoading}
          onClose={()=>setWordManagerCard(null)}
          onAddWord={addWordToManagedCard}
          onRandomWord={randomWordForManagedCard}
          onRemoveWord={removeWordFromManagedCard}
        />
      )}</AnimatePresence>
      <NavBar/>
      <AnimatePresence>{showConfig&&(
        <ConfigModal config={config} onChange={setConfig}
          onUseNow={handleUseConfig} onSaveNew={()=>{setShowConfig(false);setShowSaveTpl(true)}}
          onClose={()=>setShowConfig(false)} isFirstWord={isFirst && !activeCard?.story} allWords={allWords} categoryOptions={activeCategoryOptions}/>
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
            {isTimed
              ? <span style={{fontFamily:"var(--font-mono)",fontSize:"19px",fontWeight:700,color:timerColor}}>{timeLeft}s</span>
              : <span style={{fontFamily:"var(--font-mono)",fontSize:"12px",color:"var(--xp-color)",display:"flex",alignItems:"center" as const,gap:"3px"}}>{Ico.star}{totalXP}</span>
            }
            <button onClick={()=>setShowExam(true)} disabled={examReadyIds.length < EXAM_UNLOCK_COUNT}
              title="ห้องสอบ"
              style={{padding:"5px 8px",borderRadius:"8px",border:"1px solid var(--border-default)",background:"var(--bg-surface)",color:examReadyIds.length >= EXAM_UNLOCK_COUNT ? "var(--accent-primary)" : "var(--text-muted)",cursor:examReadyIds.length >= EXAM_UNLOCK_COUNT ? "pointer" : "not-allowed",fontFamily:"var(--font-mono)",fontSize:"11px",fontWeight:700}}>
              🎓 {examReadyIds.length}
            </button>
            {/* Settings button — only on first word or between words */}
            <motion.button whileHover={{scale:1.1}} whileTap={{scale:0.9}}
              onClick={()=>setShowConfig(true)}
              style={{padding:"5px",borderRadius:"8px",border:"1px solid var(--border-default)",background:"var(--bg-surface)",color:"var(--text-secondary)",cursor:"pointer",display:"flex",alignItems:"center" as const}}>
              {Ico.cog}
            </motion.button>
            <motion.button whileHover={{scale:1.1}} whileTap={{scale:0.9}}
              onClick={()=>{
                if(quizIndex===0 && selected===null){
                  // First word, not answered yet → exit immediately
                  setQuizActive(false); setQuizDone(false); setShowTemplates(true)
                } else {
                  setShowStopWarn(true)
                }
              }}
              title="หยุด Quiz"
              style={{padding:"5px 8px",borderRadius:"8px",border:"1px solid var(--color-danger)",
                background:"transparent",color:"var(--color-danger)",cursor:"pointer",
                fontFamily:"var(--font-body)",fontSize:"12px",fontWeight:600,
                display:"flex",alignItems:"center" as const,gap:"3px"}}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
              หยุด
            </motion.button>
          </div>
        </div>

        {/* Timer bar */}
        {isTimed && (
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
              <span style={{fontSize:"10px",color:"var(--text-muted)",textTransform:"capitalize" as const,fontFamily:"var(--font-body)"}}>{categoryLabelById.get(currentWord.category) ?? currentWord.category}</span>
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
        {isRevealMode&&(
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
