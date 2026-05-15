import { Pool } from 'pg'

function getSslConfig() {
  const value = process.env.DATABASE_SSL?.toLowerCase()
  if (value === 'true' || value === '1' || value === 'require') {
    return {
      rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'true',
    }
  }
  return false
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://admin:mypassword@myserver:5432/english_card_game",
  ssl: getSslConfig(),
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  keepAlive: true,
})

export default pool
