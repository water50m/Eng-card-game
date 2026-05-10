import { VocabWord } from "../types/game"

export const SEED_VOCABULARY: VocabWord[] = [
  // ── Animals ───────────────────────────────────────────────
  { id: "a1", english: "elephant",  thai: "ช้าง",      phonetic: "EL-uh-funt",   category: "animals",    difficulty: 1, example: "The elephant drinks water." },
  { id: "a2", english: "tiger",     thai: "เสือ",      phonetic: "TY-ger",        category: "animals",    difficulty: 1, example: "A tiger runs fast." },
  { id: "a3", english: "monkey",    thai: "ลิง",       phonetic: "MUNG-kee",      category: "animals",    difficulty: 1, example: "The monkey eats a banana." },
  { id: "a4", english: "crocodile", thai: "จระเข้",    phonetic: "KROK-uh-dyl",   category: "animals",    difficulty: 2, example: "A crocodile lives near the river." },
  { id: "a5", english: "butterfly", thai: "ผีเสื้อ",   phonetic: "BUT-er-fly",    category: "animals",    difficulty: 2, example: "The butterfly lands on a flower." },
  { id: "a6", english: "dolphin",   thai: "โลมา",      phonetic: "DOL-fin",       category: "animals",    difficulty: 2, example: "Dolphins are very smart." },
  { id: "a7", english: "giraffe",   thai: "ยีราฟ",     phonetic: "jih-RAF",       category: "animals",    difficulty: 2, example: "A giraffe has a long neck." },
  { id: "a8", english: "penguin",   thai: "เพนกวิน",   phonetic: "PENG-gwin",     category: "animals",    difficulty: 2, example: "The penguin waddles on the ice." },

  // ── Food ──────────────────────────────────────────────────
  { id: "f1", english: "mango",      thai: "มะม่วง",   phonetic: "MANG-go",        category: "food",       difficulty: 1, example: "I love eating mango." },
  { id: "f2", english: "noodles",    thai: "เส้นก๋วยเตี๋ยว", phonetic: "NOO-dulz", category: "food",       difficulty: 1, example: "She cooked noodles for dinner." },
  { id: "f3", english: "rice",       thai: "ข้าว",     phonetic: "ryss",           category: "food",       difficulty: 1, example: "We eat rice every day." },
  { id: "f4", english: "durian",     thai: "ทุเรียน",  phonetic: "DUH-ree-un",     category: "food",       difficulty: 2, example: "Durian is a strong-smelling fruit." },
  { id: "f5", english: "cucumber",   thai: "แตงกวา",   phonetic: "KYOO-kum-ber",   category: "food",       difficulty: 2, example: "A cucumber is cool and fresh." },
  { id: "f6", english: "pineapple",  thai: "สับปะรด",  phonetic: "PY-nap-ul",      category: "food",       difficulty: 2, example: "Pineapple is sweet and sour." },
  { id: "f7", english: "eggplant",   thai: "มะเขือ",   phonetic: "EG-plant",       category: "food",       difficulty: 2, example: "She fried the eggplant with garlic." },
  { id: "f8", english: "coconut",    thai: "มะพร้าว",  phonetic: "KOH-kuh-nut",    category: "food",       difficulty: 1, example: "Coconut milk is used in Thai curry." },

  // ── Colors ────────────────────────────────────────────────
  { id: "c1", english: "scarlet",   thai: "สีแดงเข้ม", phonetic: "SKAR-lit",       category: "colors",     difficulty: 3, example: "She wore a scarlet dress." },
  { id: "c2", english: "turquoise", thai: "สีฟ้าเขียว", phonetic: "TUR-kwoyz",      category: "colors",     difficulty: 3, example: "The ocean was turquoise." },
  { id: "c3", english: "crimson",   thai: "สีแดงเลือดหมู", phonetic: "KRIM-zun",   category: "colors",     difficulty: 3, example: "The sunset turned crimson." },
  { id: "c4", english: "lavender",  thai: "สีม่วงอ่อน", phonetic: "LAV-un-der",    category: "colors",     difficulty: 2, example: "She painted the room lavender." },
  { id: "c5", english: "emerald",   thai: "สีเขียวมรกต", phonetic: "EM-ur-uld",    category: "colors",     difficulty: 3, example: "The emerald ring was beautiful." },
  { id: "c6", english: "ivory",     thai: "สีงาช้าง",  phonetic: "EYE-vuh-ree",    category: "colors",     difficulty: 3, example: "The piano keys were ivory." },

  // ── Numbers / Quantities ──────────────────────────────────
  { id: "n1", english: "dozen",     thai: "โหล",       phonetic: "DUZ-un",          category: "numbers",    difficulty: 2, example: "She bought a dozen eggs." },
  { id: "n2", english: "quarter",   thai: "หนึ่งในสี่", phonetic: "KWOR-ter",       category: "numbers",    difficulty: 2, example: "A quarter of the pie is left." },
  { id: "n3", english: "billion",   thai: "พันล้าน",   phonetic: "BIL-yun",         category: "numbers",    difficulty: 2, example: "There are eight billion people." },
  { id: "n4", english: "fraction",  thai: "เศษส่วน",  phonetic: "FRAK-shun",        category: "numbers",    difficulty: 3, example: "One half is a fraction." },

  // ── Common Verbs ──────────────────────────────────────────
  { id: "v1", english: "whisper",   thai: "กระซิบ",    phonetic: "WIS-per",         category: "verbs",      difficulty: 2, example: "She whispered a secret to him." },
  { id: "v2", english: "stumble",   thai: "สะดุด",     phonetic: "STUM-bul",        category: "verbs",      difficulty: 3, example: "He stumbled on the stairs." },
  { id: "v3", english: "glance",    thai: "มองชั่วครู่", phonetic: "GLANS",          category: "verbs",      difficulty: 2, example: "She glanced at the clock." },
  { id: "v4", english: "shiver",    thai: "สั่น",      phonetic: "SHIV-er",         category: "verbs",      difficulty: 2, example: "He shivered in the cold." },
  { id: "v5", english: "wander",    thai: "เดินเตร็ดเตร่", phonetic: "WON-der",    category: "verbs",      difficulty: 2, example: "They wandered through the market." },
  { id: "v6", english: "harvest",   thai: "เก็บเกี่ยว", phonetic: "HAR-vust",       category: "verbs",      difficulty: 3, example: "Farmers harvest rice in autumn." },
  { id: "v7", english: "borrow",    thai: "ยืม",       phonetic: "BOR-oh",          category: "verbs",      difficulty: 1, example: "Can I borrow your pen?" },
  { id: "v8", english: "celebrate", thai: "เฉลิมฉลอง", phonetic: "SEL-uh-brayt",   category: "verbs",      difficulty: 2, example: "We celebrate New Year together." },

  // ── Adjectives ────────────────────────────────────────────
  { id: "j1", english: "enormous",  thai: "ใหญ่โต",    phonetic: "ih-NOR-mus",      category: "adjectives", difficulty: 2, example: "The whale is enormous." },
  { id: "j2", english: "fragile",   thai: "เปราะบาง",  phonetic: "FRAJ-ul",         category: "adjectives", difficulty: 3, example: "Handle the fragile glass carefully." },
  { id: "j3", english: "ancient",   thai: "โบราณ",     phonetic: "AYN-shunt",       category: "adjectives", difficulty: 2, example: "We visited an ancient temple." },
  { id: "j4", english: "graceful",  thai: "สง่างาม",   phonetic: "GRAYZ-ful",       category: "adjectives", difficulty: 2, example: "The dancer was graceful." },
  { id: "j5", english: "peculiar",  thai: "แปลกประหลาด", phonetic: "pih-KYOO-lee-er", category: "adjectives", difficulty: 3, example: "That is a peculiar noise." },
  { id: "j6", english: "humble",    thai: "ถ่อมตัว",   phonetic: "HUM-bul",         category: "adjectives", difficulty: 2, example: "She is humble despite her success." },
  { id: "j7", english: "stubborn",  thai: "ดื้อรั้น",  phonetic: "STUB-urn",        category: "adjectives", difficulty: 2, example: "The stubborn child refused to eat." },
  { id: "j8", english: "vivid",     thai: "สีสันสดใส", phonetic: "VIV-id",          category: "adjectives", difficulty: 2, example: "She has a vivid imagination." },

  // ── Places ────────────────────────────────────────────────
  { id: "p1", english: "temple",    thai: "วัด",       phonetic: "TEM-pul",         category: "places",     difficulty: 1, example: "We visited the temple at sunrise." },
  { id: "p2", english: "market",    thai: "ตลาด",      phonetic: "MAR-kit",         category: "places",     difficulty: 1, example: "She buys vegetables at the market." },
  { id: "p3", english: "hospital",  thai: "โรงพยาบาล", phonetic: "HOS-pit-ul",      category: "places",     difficulty: 2, example: "The hospital is nearby." },
  { id: "p4", english: "waterfall", thai: "น้ำตก",     phonetic: "WAW-ter-fawl",    category: "places",     difficulty: 2, example: "The waterfall was breathtaking." },
]

export const CATEGORIES = [...new Set(SEED_VOCABULARY.map(w => w.category))]
