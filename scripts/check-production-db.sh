#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE=(docker-compose)
else
  echo "FAIL: docker compose or docker-compose is required" >&2
  exit 1
fi

echo "==> Compose file"
"${COMPOSE[@]}" config --quiet
echo "OK: docker compose config is valid"

container_id="$("${COMPOSE[@]}" ps -q web || true)"
if [[ -z "$container_id" ]]; then
  echo "FAIL: web container is not running. Try: docker compose up -d" >&2
  exit 1
fi

echo "==> Web container"
docker inspect "$container_id" --format 'Name={{.Name}} Status={{.State.Status}} Image={{.Config.Image}}'

echo "==> Web container networks"
docker inspect "$container_id" --format '{{range $name, $_ := .NetworkSettings.Networks}}{{println $name}}{{end}}'

echo "==> Database env inside web container"
docker exec "$container_id" node -e '
function redact(value) {
  if (!value) return "(missing)"
  try {
    const url = new URL(value)
    if (url.password) url.password = "***"
    if (url.username) url.username = url.username || "(empty)"
    return url.toString()
  } catch {
    return value.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:***@")
  }
}
const keys = [
  "DATABASE_URL",
  "DATABASE_SSL",
  "DATABASE_SSL_REJECT_UNAUTHORIZED",
  "DATABASE_POOL_MAX",
  "DATABASE_CONNECTION_TIMEOUT_MS",
]
for (const key of keys) {
  const value = key === "DATABASE_URL" ? redact(process.env[key]) : (process.env[key] || "(missing)")
  console.log(`${key}=${value}`)
}
if (!process.env.DATABASE_URL) process.exit(2)
'

echo "==> DNS and TCP check from web container"
docker exec "$container_id" node - <<'NODE'
const net = require("node:net")
const dns = require("node:dns").promises

async function main() {
  const raw = process.env.DATABASE_URL
  if (!raw) throw new Error("DATABASE_URL is missing")

  const url = new URL(raw)
  const host = url.hostname
  const port = Number(url.port || 5432)

  try {
    const addresses = await dns.lookup(host, { all: true })
    console.log(`DNS OK: ${host} -> ${addresses.map(item => item.address).join(", ")}`)
  } catch (error) {
    console.error(`DNS FAIL: ${host}: ${error.message}`)
    process.exit(2)
  }

  await new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port, timeout: 5000 })
    socket.once("connect", () => {
      console.log(`TCP OK: ${host}:${port}`)
      socket.end()
      resolve()
    })
    socket.once("timeout", () => {
      socket.destroy()
      reject(new Error(`TCP TIMEOUT: ${host}:${port}`))
    })
    socket.once("error", reject)
  }).catch(error => {
    console.error(`TCP FAIL: ${error.message}`)
    process.exit(3)
  })
}

main().catch(error => {
  console.error(`CHECK FAIL: ${error.message}`)
  process.exit(1)
})
NODE

echo "==> PostgreSQL query check from web container"
docker exec "$container_id" node - <<'NODE'
const { Pool } = require("pg")

function getSslConfig() {
  const value = (process.env.DATABASE_SSL || "").toLowerCase()
  if (value === "true" || value === "1" || value === "require") {
    return {
      rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "true",
    }
  }
  return false
}

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: getSslConfig(),
    max: 1,
    connectionTimeoutMillis: Number(process.env.DATABASE_CONNECTION_TIMEOUT_MS || 20000),
  })

  try {
    const result = await pool.query(`
      SELECT
        current_database() AS database,
        current_user AS username,
        inet_server_addr()::text AS server_addr,
        inet_server_port() AS server_port
    `)
    console.log("DB QUERY OK:", JSON.stringify(result.rows[0]))
  } finally {
    await pool.end()
  }
}

main().catch(error => {
  console.error(`DB QUERY FAIL: ${error.message}`)
  if (error.code) console.error(`PG CODE: ${error.code}`)
  process.exit(4)
})
NODE

echo "==> Recent web logs"
docker logs "$container_id" --tail 80

echo "OK: production DB checks completed"
