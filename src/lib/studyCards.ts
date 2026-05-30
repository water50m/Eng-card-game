import { QuizConfig, VocabWord } from "@/types/game"
import { QuizTemplate, loadUserTemplates } from "@/types/template"

export type LearningStyle = "fast" | "wide" | "classic"
export type CardSource = "system" | "user" | "template"
export type StyleDifficulty = 1 | 2 | 3 | 4

export const DEFAULT_STYLE_DIFFICULTY: Record<string, StyleDifficulty> = {
  "style-fast": 1,
  "style-wide": 1,
}

export function normalizeStyleDifficulty(value: unknown): Record<string, StyleDifficulty> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return DEFAULT_STYLE_DIFFICULTY

  return Object.entries(value).reduce<Record<string, StyleDifficulty>>((acc, [cardId, rawLevel]) => {
    const level = Number(rawLevel)
    if (Number.isInteger(level) && level >= 1 && level <= 4) {
      acc[cardId] = level as StyleDifficulty
    }
    return acc
  }, { ...DEFAULT_STYLE_DIFFICULTY })
}

export type PlayableCard = QuizTemplate & {
  learningStyle: LearningStyle
  source: CardSource
  templateId?: string
  story?: StoryContent
}

export type StoryContent = {
  length: "short" | "long"
  genre: "mystery" | "horror" | "puzzle"
  english: string[]
  thai: string[]
  vocabulary: VocabWord[]
}

export type MasteryPrompt = {
  wordId: string
  english: string
  thai: string
  resolve: (confirmed: boolean) => void
}

export const EXAM_UNLOCK_COUNT = 20

export const BASE_STYLE_CARDS: PlayableCard[] = [
  {
    id: "style-fast",
    name: "เรียนรู้ฉับไว",
    emoji: "⚡",
    desc: "ล็อกคำชุดเล็ก 10 คำ ถ้าจำได้แล้วจะดึงคำใหม่มาแทนทันที",
    config: { category: "all", size: 10, mode: "multiple-choice", hintsEnabled: true },
    learningStyle: "fast",
    source: "system",
    isGlobal: true,
    createdAt: "2026-05-13",
    playCount: 0,
    tags: ["learning-style", "fast"],
  },
  {
    id: "style-wide",
    name: "เรียนรู้กว้างขวาง",
    emoji: "🌐",
    desc: "ล็อกคลังคำ 100 คำ แล้วสุ่มข้อสอบจากคลังนั้นตามจำนวนที่เลือก",
    config: { category: "all", size: 10, mode: "multiple-choice", hintsEnabled: true },
    learningStyle: "wide",
    source: "system",
    isGlobal: true,
    createdAt: "2026-05-13",
    playCount: 0,
    tags: ["learning-style", "wide"],
  },
]

export const STORY_CARDS: PlayableCard[] = [
  {
    id: "story-lantern-window",
    name: "The Lantern in Window Nine",
    emoji: "🏚️",
    desc: "เรื่องสั้นลึกลับในโรงแรมร้าง มีแสงโคมไฟที่ไม่ควรติดอยู่",
    config: { category: "story", size: 10, mode: "multiple-choice", hintsEnabled: true },
    learningStyle: "classic",
    source: "system",
    isGlobal: true,
    createdAt: "2026-05-30",
    playCount: 0,
    tags: ["story", "short", "mystery", "horror"],
    story: {
      length: "short",
      genre: "mystery",
      english: [
        "Mira checked into the abandoned hotel because the storm had swallowed the road behind her.",
        "At midnight, a lantern appeared in window nine, although the clerk had sworn that floor was locked.",
        "She climbed the stairs and found dust on every step except one fresh footprint outside room nine.",
        "Inside, a diary lay open with her name written on the final page.",
      ],
      thai: [
        "มิราเข้าพักในโรงแรมร้าง เพราะพายุได้กลืนถนนด้านหลังเธอไปแล้ว",
        "ตอนเที่ยงคืน มีโคมไฟปรากฏที่หน้าต่างหมายเลขเก้า ทั้งที่พนักงานยืนยันว่าชั้นนั้นถูกล็อกไว้",
        "เธอขึ้นบันไดและเห็นฝุ่นอยู่ทุกขั้น ยกเว้นรอยเท้าใหม่หนึ่งรอยหน้าห้องเก้า",
        "ข้างในมีสมุดบันทึกเปิดค้างอยู่ พร้อมชื่อของเธอเขียนไว้บนหน้าสุดท้าย",
      ],
      vocabulary: [
        { id: "story-lantern-window-abandoned", english: "abandoned", thai: "ถูกทิ้งร้าง", phonetic: "uh-BAN-dund", example: "They entered an abandoned hotel.", category: "story", difficulty: 2 },
        { id: "story-lantern-window-storm", english: "storm", thai: "พายุ", phonetic: "storm", example: "The storm covered the road.", category: "story", difficulty: 1 },
        { id: "story-lantern-window-swallowed", english: "swallowed", thai: "กลืนหายไป", phonetic: "SWOL-ohd", example: "Fog swallowed the bridge.", category: "story", difficulty: 3 },
        { id: "story-lantern-window-lantern", english: "lantern", thai: "โคมไฟ", phonetic: "LAN-turn", example: "A lantern glowed in the window.", category: "story", difficulty: 2 },
        { id: "story-lantern-window-clerk", english: "clerk", thai: "พนักงาน", phonetic: "klurk", example: "The clerk handed her a key.", category: "story", difficulty: 2 },
        { id: "story-lantern-window-sworn", english: "sworn", thai: "สาบาน / ยืนยันอย่างหนักแน่น", phonetic: "sworn", example: "He had sworn the door was locked.", category: "story", difficulty: 3 },
        { id: "story-lantern-window-dust", english: "dust", thai: "ฝุ่น", phonetic: "dust", example: "Dust covered every step.", category: "story", difficulty: 1 },
        { id: "story-lantern-window-footprint", english: "footprint", thai: "รอยเท้า", phonetic: "FOOT-print", example: "A fresh footprint marked the hall.", category: "story", difficulty: 2 },
        { id: "story-lantern-window-diary", english: "diary", thai: "สมุดบันทึก", phonetic: "DYE-uh-ree", example: "The diary was open.", category: "story", difficulty: 2 },
        { id: "story-lantern-window-final", english: "final", thai: "สุดท้าย", phonetic: "FYE-nul", example: "Her name was on the final page.", category: "story", difficulty: 1 },
      ],
    },
  },
  {
    id: "story-clockmaker-riddle",
    name: "The Clockmaker's Riddle",
    emoji: "🕰️",
    desc: "เรื่องสั้นปริศนาเกี่ยวกับนาฬิกาที่เดินถอยหลังและจดหมายที่หายไป",
    config: { category: "story", size: 10, mode: "think-reveal", hintsEnabled: true },
    learningStyle: "classic",
    source: "system",
    isGlobal: true,
    createdAt: "2026-05-30",
    playCount: 0,
    tags: ["story", "short", "puzzle"],
    story: {
      length: "short",
      genre: "puzzle",
      english: [
        "The old clockmaker left one rule for his apprentice: never wind the silver clock after sunset.",
        "When the apprentice ignored the warning, every clock in the shop began ticking backward.",
        "A sealed letter slid from the silver clock, dated tomorrow and signed by the apprentice himself.",
        "It said, 'Hide the key before I arrive.'",
      ],
      thai: [
        "ช่างทำนาฬิกาแก่ทิ้งกฎไว้ให้ลูกมือหนึ่งข้อ: ห้ามไขลานนาฬิกาเงินหลังพระอาทิตย์ตก",
        "เมื่อลูกมือเพิกเฉยต่อคำเตือน นาฬิกาทุกเรือนในร้านก็เริ่มเดินถอยหลัง",
        "จดหมายปิดผนึกเลื่อนออกมาจากนาฬิกาเงิน ลงวันที่พรุ่งนี้และลงชื่อโดยลูกมือเอง",
        "ในจดหมายเขียนว่า 'ซ่อนกุญแจก่อนที่ฉันจะมาถึง'",
      ],
      vocabulary: [
        { id: "story-clockmaker-riddle-clockmaker", english: "clockmaker", thai: "ช่างทำนาฬิกา", phonetic: "KLOK-may-ker", example: "The clockmaker repaired old watches.", category: "story", difficulty: 3 },
        { id: "story-clockmaker-riddle-apprentice", english: "apprentice", thai: "ลูกมือ / เด็กฝึกงาน", phonetic: "uh-PREN-tis", example: "The apprentice learned the trade.", category: "story", difficulty: 3 },
        { id: "story-clockmaker-riddle-wind", english: "wind", thai: "ไขลาน", phonetic: "wynd", example: "Do not wind the clock.", category: "story", difficulty: 3 },
        { id: "story-clockmaker-riddle-silver", english: "silver", thai: "สีเงิน / เงิน", phonetic: "SIL-ver", example: "The silver clock was silent.", category: "story", difficulty: 1 },
        { id: "story-clockmaker-riddle-sunset", english: "sunset", thai: "พระอาทิตย์ตก", phonetic: "SUN-set", example: "The warning began at sunset.", category: "story", difficulty: 1 },
        { id: "story-clockmaker-riddle-ignored", english: "ignored", thai: "เพิกเฉย", phonetic: "ig-NORD", example: "He ignored the warning.", category: "story", difficulty: 2 },
        { id: "story-clockmaker-riddle-backward", english: "backward", thai: "ถอยหลัง", phonetic: "BAK-werd", example: "The clock ticked backward.", category: "story", difficulty: 2 },
        { id: "story-clockmaker-riddle-sealed", english: "sealed", thai: "ปิดผนึก", phonetic: "seeld", example: "A sealed letter appeared.", category: "story", difficulty: 2 },
        { id: "story-clockmaker-riddle-dated", english: "dated", thai: "ลงวันที่", phonetic: "DAY-ted", example: "The letter was dated tomorrow.", category: "story", difficulty: 2 },
        { id: "story-clockmaker-riddle-hide", english: "hide", thai: "ซ่อน", phonetic: "hyde", example: "Hide the key before night.", category: "story", difficulty: 1 },
      ],
    },
  },
  {
    id: "story-well-beneath-school",
    name: "The Well Beneath the School",
    emoji: "🕳️",
    desc: "เรื่องยาวสยองขวัญในโรงเรียนเก่า เมื่อเสียงกระซิบใต้พื้นเรียกชื่อเด็กทีละคน",
    config: { category: "story", size: 20, mode: "multiple-choice", hintsEnabled: true },
    learningStyle: "classic",
    source: "system",
    isGlobal: true,
    createdAt: "2026-05-30",
    playCount: 0,
    tags: ["story", "long", "horror"],
    story: {
      length: "long",
      genre: "horror",
      english: [
        "The school had one hallway that no teacher used after dusk. The floorboards there sounded hollow, as if a room waited underneath.",
        "Nate and I found the loose board during detention. Beneath it was a rope ladder, a smell of wet stone, and a whisper that repeated our names.",
        "We climbed down only far enough to see an old well under the school. Scratches covered the bricks, and each scratch looked like a tally mark.",
        "At the bottom, water reflected our faces. Then a third face rose between us, pale and smiling, though neither of us had moved.",
        "The whisper changed. It no longer called our names. It counted: one, two, three.",
        "The next morning, the loose board was nailed shut. Our teacher said there had never been a well. But Nate's shoes were still wet, and mine were covered with brick dust.",
      ],
      thai: [
        "โรงเรียนมีทางเดินหนึ่งเส้นที่ไม่มีครูคนไหนใช้หลังพลบค่ำ พื้นไม้ตรงนั้นดังกลวง ๆ ราวกับมีห้องรออยู่ข้างใต้",
        "เนทกับฉันพบแผ่นไม้หลวมระหว่างถูกกักตัว ใต้แผ่นไม้นั้นมีบันไดเชือก กลิ่นหินเปียก และเสียงกระซิบที่เรียกชื่อพวกเราซ้ำ ๆ",
        "เราปีนลงไปพอให้เห็นบ่อน้ำเก่าใต้โรงเรียน รอยขีดปกคลุมก้อนอิฐ และแต่ละรอยดูเหมือนขีดนับจำนวน",
        "ที่ก้นบ่อ น้ำสะท้อนใบหน้าของเรา แล้วใบหน้าที่สามก็ลอยขึ้นมาระหว่างเรา ซีดและยิ้ม ทั้งที่ไม่มีใครขยับ",
        "เสียงกระซิบเปลี่ยนไป มันไม่เรียกชื่อเราอีกแล้ว มันนับ: หนึ่ง สอง สาม",
        "เช้าวันต่อมา แผ่นไม้หลวมถูกตอกปิด ครูของเราบอกว่าไม่เคยมีบ่อน้ำ แต่รองเท้าของเนทยังเปียกอยู่ และรองเท้าของฉันก็เต็มไปด้วยฝุ่นอิฐ",
      ],
      vocabulary: [
        { id: "story-well-beneath-school-hallway", english: "hallway", thai: "ทางเดิน", phonetic: "HAWL-way", example: "The hallway was empty after dusk.", category: "story", difficulty: 1 },
        { id: "story-well-beneath-school-dusk", english: "dusk", thai: "พลบค่ำ", phonetic: "dusk", example: "No teacher entered after dusk.", category: "story", difficulty: 2 },
        { id: "story-well-beneath-school-floorboards", english: "floorboards", thai: "แผ่นพื้นไม้", phonetic: "FLOR-bordz", example: "The floorboards sounded hollow.", category: "story", difficulty: 3 },
        { id: "story-well-beneath-school-hollow", english: "hollow", thai: "กลวง", phonetic: "HOL-oh", example: "The wall made a hollow sound.", category: "story", difficulty: 2 },
        { id: "story-well-beneath-school-underneath", english: "underneath", thai: "ข้างใต้", phonetic: "un-der-NEETH", example: "Something waited underneath.", category: "story", difficulty: 2 },
        { id: "story-well-beneath-school-detention", english: "detention", thai: "การถูกกักตัวหลังเลิกเรียน", phonetic: "dee-TEN-shun", example: "They stayed after class for detention.", category: "story", difficulty: 3 },
        { id: "story-well-beneath-school-loose", english: "loose", thai: "หลวม", phonetic: "loos", example: "A loose board moved under his hand.", category: "story", difficulty: 2 },
        { id: "story-well-beneath-school-rope", english: "rope", thai: "เชือก", phonetic: "rohp", example: "A rope ladder hung below.", category: "story", difficulty: 1 },
        { id: "story-well-beneath-school-whisper", english: "whisper", thai: "เสียงกระซิบ", phonetic: "WIS-per", example: "A whisper repeated our names.", category: "story", difficulty: 2 },
        { id: "story-well-beneath-school-scratches", english: "scratches", thai: "รอยขีดข่วน", phonetic: "SKRATCH-ez", example: "Scratches covered the bricks.", category: "story", difficulty: 2 },
        { id: "story-well-beneath-school-bricks", english: "bricks", thai: "ก้อนอิฐ", phonetic: "briks", example: "Old bricks lined the well.", category: "story", difficulty: 1 },
        { id: "story-well-beneath-school-tally", english: "tally", thai: "ขีดนับจำนวน", phonetic: "TAL-ee", example: "Each scratch was a tally mark.", category: "story", difficulty: 3 },
        { id: "story-well-beneath-school-reflected", english: "reflected", thai: "สะท้อน", phonetic: "ree-FLEK-ted", example: "The water reflected our faces.", category: "story", difficulty: 2 },
        { id: "story-well-beneath-school-pale", english: "pale", thai: "ซีด", phonetic: "payl", example: "A pale face rose from the water.", category: "story", difficulty: 2 },
        { id: "story-well-beneath-school-nailed", english: "nailed", thai: "ถูกตอกตะปู", phonetic: "nayld", example: "The board was nailed shut.", category: "story", difficulty: 2 },
        { id: "story-well-beneath-school-dust", english: "dust", thai: "ฝุ่น", phonetic: "dust", example: "His shoes were covered with dust.", category: "story", difficulty: 1 },
      ],
    },
  },
  {
    id: "story-last-train",
    name: "The Last Train Without a Driver",
    emoji: "🚇",
    desc: "เรื่องยาวปริศนาสยองขวัญบนรถไฟเที่ยวสุดท้ายที่ไม่มีคนขับ",
    config: { category: "story", size: 20, mode: "timed-reveal", hintsEnabled: false },
    learningStyle: "classic",
    source: "system",
    isGlobal: true,
    createdAt: "2026-05-30",
    playCount: 0,
    tags: ["story", "long", "mystery", "horror"],
    story: {
      length: "long",
      genre: "mystery",
      english: [
        "The last train arrived at 12:07 with no driver in the front window. Everyone on the platform pretended not to notice.",
        "I stepped inside because the rain was freezing. The doors closed, and the announcement said my name instead of the next station.",
        "Each carriage was empty except for one object: a cracked umbrella, a child's red glove, a torn ticket, and a photograph of me sleeping.",
        "The train did not stop at any station. It slowed only when it passed mirrors in the tunnel, and in every mirror I saw someone sitting behind me.",
        "When the lights failed, a hand placed the torn ticket into my pocket. The destination printed on it was not a place. It was a date: today.",
        "The train finally opened its doors at the same platform. The clock still read 12:07, but everyone waiting there was staring directly at me.",
      ],
      thai: [
        "รถไฟเที่ยวสุดท้ายมาถึงเวลา 12:07 โดยไม่มีคนขับอยู่ที่หน้าต่างด้านหน้า ทุกคนบนชานชาลาแกล้งทำเป็นไม่เห็น",
        "ฉันก้าวเข้าไปเพราะฝนหนาวจัด ประตูปิดลง และเสียงประกาศพูดชื่อฉันแทนชื่อสถานีถัดไป",
        "แต่ละตู้ว่างเปล่า ยกเว้นสิ่งของหนึ่งชิ้น: ร่มร้าว ถุงมือสีแดงของเด็ก ตั๋วฉีกขาด และรูปถ่ายของฉันตอนหลับ",
        "รถไฟไม่หยุดที่สถานีใดเลย มันชะลอแค่ตอนผ่านกระจกในอุโมงค์ และในกระจกทุกบาน ฉันเห็นใครบางคนนั่งอยู่ข้างหลัง",
        "เมื่อไฟดับ มือหนึ่งก็ใส่ตั๋วฉีกขาดลงในกระเป๋าของฉัน ปลายทางที่พิมพ์บนตั๋วไม่ใช่สถานที่ แต่เป็นวันที่: วันนี้",
        "ในที่สุดรถไฟก็เปิดประตูที่ชานชาลาเดิม นาฬิกายังอ่านเวลา 12:07 แต่ทุกคนที่รออยู่ตรงนั้นกำลังจ้องมาที่ฉันโดยตรง",
      ],
      vocabulary: [
        { id: "story-last-train-platform", english: "platform", thai: "ชานชาลา", phonetic: "PLAT-form", example: "People waited on the platform.", category: "story", difficulty: 2 },
        { id: "story-last-train-pretended", english: "pretended", thai: "แกล้งทำ", phonetic: "pree-TEN-ded", example: "They pretended not to notice.", category: "story", difficulty: 2 },
        { id: "story-last-train-notice", english: "notice", thai: "สังเกตเห็น", phonetic: "NOH-tis", example: "No one seemed to notice.", category: "story", difficulty: 1 },
        { id: "story-last-train-freezing", english: "freezing", thai: "หนาวจัด", phonetic: "FREE-zing", example: "The rain was freezing.", category: "story", difficulty: 1 },
        { id: "story-last-train-announcement", english: "announcement", thai: "ประกาศ", phonetic: "uh-NOUNS-ment", example: "The announcement said my name.", category: "story", difficulty: 3 },
        { id: "story-last-train-carriage", english: "carriage", thai: "ตู้โดยสาร", phonetic: "KAR-ij", example: "Each carriage was empty.", category: "story", difficulty: 3 },
        { id: "story-last-train-cracked", english: "cracked", thai: "ร้าว", phonetic: "krakt", example: "A cracked umbrella lay on the seat.", category: "story", difficulty: 2 },
        { id: "story-last-train-glove", english: "glove", thai: "ถุงมือ", phonetic: "gluv", example: "A red glove was on the floor.", category: "story", difficulty: 1 },
        { id: "story-last-train-torn", english: "torn", thai: "ฉีกขาด", phonetic: "torn", example: "He found a torn ticket.", category: "story", difficulty: 2 },
        { id: "story-last-train-photograph", english: "photograph", thai: "รูปถ่าย", phonetic: "FOH-tuh-graf", example: "The photograph showed his room.", category: "story", difficulty: 2 },
        { id: "story-last-train-slowed", english: "slowed", thai: "ชะลอ", phonetic: "slohd", example: "The train slowed in the tunnel.", category: "story", difficulty: 2 },
        { id: "story-last-train-mirrors", english: "mirrors", thai: "กระจก", phonetic: "MEER-erz", example: "Mirrors lined the tunnel.", category: "story", difficulty: 1 },
        { id: "story-last-train-tunnel", english: "tunnel", thai: "อุโมงค์", phonetic: "TUN-ul", example: "The tunnel was completely dark.", category: "story", difficulty: 2 },
        { id: "story-last-train-destination", english: "destination", thai: "ปลายทาง", phonetic: "des-tuh-NAY-shun", example: "The destination was printed on the ticket.", category: "story", difficulty: 3 },
        { id: "story-last-train-printed", english: "printed", thai: "ถูกพิมพ์", phonetic: "PRIN-ted", example: "A date was printed on it.", category: "story", difficulty: 2 },
        { id: "story-last-train-staring", english: "staring", thai: "จ้องมอง", phonetic: "STAIR-ing", example: "Everyone was staring at me.", category: "story", difficulty: 2 },
      ],
    },
  },
]

export function normalizeCard(template: QuizTemplate, style: LearningStyle = "fast", source: CardSource = "user"): PlayableCard {
  return {
    ...template,
    learningStyle: style,
    source,
    config: {
      ...template.config,
      size: template.config.size || 10,
    } as QuizConfig,
  }
}

export function loadPlayableCards(): PlayableCard[] {
  return loadUserTemplates().map(t => normalizeCard(t, (t as QuizTemplate & { learningStyle?: LearningStyle }).learningStyle ?? "fast", "user"))
}
