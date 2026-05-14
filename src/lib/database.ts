import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://admin:mypassword@myserver:5432/english_card_game",
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  keepAlive: true,
})

export default pool
