#!/usr/bin/env node
import fs from "node:fs/promises"
import path from "node:path"
import pg from "pg"

const { Pool } = pg
const DEFAULT_CATEGORY = "top-3000"

async function loadEnvFile(filePath) {
  try {
    const text = await fs.readFile(filePath, "utf8")
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) continue
      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
      if (!match || process.env[match[1]]) continue
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "")
    }
  } catch {
    // Optional env file.
  }
}

function parseCsvLine(line) {
  const cells = []
  let current = ""
  let quoted = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    const next = line[i + 1]
    if (char === '"' && quoted && next === '"') {
      current += '"'
      i += 1
      continue
    }
    if (char === '"') {
      quoted = !quoted
      continue
    }
    if (char === "," && !quoted) {
      cells.push(current.trim())
      current = ""
      continue
    }
    current += char
  }

  cells.push(current.trim())
  return cells
}

function normalizeHeader(value) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_")
}

function parseWords(text) {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean)
  if (lines.length === 0) return []

  const firstCells = parseCsvLine(lines[0])
  const headerNames = new Set(["english", "word", "headword", "thai", "translation", "phonetic", "example", "category", "difficulty"])
  const hasHeader = firstCells.some(cell => headerNames.has(normalizeHeader(cell)))

  if (!hasHeader && firstCells.length === 1) {
    return lines.map(line => ({ english: line.trim() })).filter(row => row.english)
  }

  const headers = (hasHeader ? firstCells : ["english", "thai", "phonetic", "example", "difficulty"]).map(normalizeHeader)
  const rows = hasHeader ? lines.slice(1) : lines

  return rows.map(line => {
    const cells = parseCsvLine(line)
    const row = {}
    headers.forEach((header, index) => {
      row[header] = cells[index]?.trim() ?? ""
    })
    return {
      english: row.english || row.word || row.headword || "",
      thai: row.thai || row.translation || "",
      phonetic: row.phonetic || "",
      example: row.example || "",
      difficulty: Number(row.difficulty || 2),
    }
  }).filter(row => row.english)
}

function dedupeWords(words) {
  const byEnglish = new Map()
  for (const word of words) {
    const key = word.english.trim().toLowerCase()
    if (!key || byEnglish.has(key)) continue
    byEnglish.set(key, {
      english: word.english.trim(),
      thai: word.thai?.trim() || "",
      phonetic: word.phonetic?.trim() || null,
      example: word.example?.trim() || null,
      difficulty: Number.isFinite(word.difficulty) ? Math.min(5, Math.max(1, word.difficulty)) : 2,
    })
  }
  return [...byEnglish.values()]
}

function chunk(items, size) {
  const chunks = []
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size))
  return chunks
}

async function main() {
  const inputFile = process.argv[2]
  const category = process.argv[3] || DEFAULT_CATEGORY

  if (!inputFile) {
    console.error("Usage: node scripts/import-top-3000-category.mjs <words.csv|words.txt> [category]")
    console.error("CSV columns: english,thai,phonetic,example,difficulty. Text files may contain one English word per line.")
    process.exit(1)
  }

  await loadEnvFile(path.resolve(".env.local"))
  await loadEnvFile(path.resolve(".env"))

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required.")
    process.exit(1)
  }

  const sourceText = await fs.readFile(path.resolve(inputFile), "utf8")
  const words = dedupeWords(parseWords(sourceText))
  if (words.length === 0) {
    console.error("No words found in input file.")
    process.exit(1)
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === "true"
      ? { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false" }
      : undefined,
    max: 2,
  })

  const lowerWords = words.map(word => word.english.toLowerCase())
  let updated = 0
  let inserted = 0

  try {
    await pool.query("BEGIN")

    for (const batch of chunk(words, 500)) {
      const updateResult = await pool.query(
        `
          UPDATE vocabulary v
          SET category = $2, updated_at = NOW()
          WHERE LOWER(v.english) = ANY($1::text[])
        `,
        [batch.map(word => word.english.toLowerCase()), category],
      )
      updated += updateResult.rowCount ?? 0

      const insertable = batch.filter(word => word.thai)
      if (insertable.length === 0) continue

      const insertResult = await pool.query(
        `
          WITH incoming AS (
            SELECT *
            FROM unnest($1::text[], $2::text[], $3::text[], $4::text[], $5::int[]) AS i(english, thai, phonetic, example, difficulty)
          )
          INSERT INTO vocabulary (english, thai, phonetic, example, category, difficulty, updated_at)
          SELECT i.english, i.thai, NULLIF(i.phonetic, ''), NULLIF(i.example, ''), $6, i.difficulty, NOW()
          FROM incoming i
          WHERE NOT EXISTS (
            SELECT 1 FROM vocabulary v WHERE LOWER(v.english) = LOWER(i.english)
          )
        `,
        [
          insertable.map(word => word.english),
          insertable.map(word => word.thai),
          insertable.map(word => word.phonetic ?? ""),
          insertable.map(word => word.example ?? ""),
          insertable.map(word => word.difficulty),
          category,
        ],
      )
      inserted += insertResult.rowCount ?? 0
    }

    const foundResult = await pool.query(
      "SELECT LOWER(english) AS english FROM vocabulary WHERE LOWER(english) = ANY($1::text[])",
      [lowerWords],
    )
    const found = new Set(foundResult.rows.map(row => row.english))
    const missing = words.filter(word => !found.has(word.english.toLowerCase())).map(word => word.english)

    await pool.query("COMMIT")

    console.log(`Input words: ${words.length}`)
    console.log(`Category: ${category}`)
    console.log(`Marked existing rows: ${updated}`)
    console.log(`Inserted rows with Thai translation: ${inserted}`)
    console.log(`Still missing: ${missing.length}`)
    if (missing.length > 0) {
      console.log(`Missing sample: ${missing.slice(0, 25).join(", ")}`)
    }
  } catch (error) {
    await pool.query("ROLLBACK")
    throw error
  } finally {
    await pool.end()
  }
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
