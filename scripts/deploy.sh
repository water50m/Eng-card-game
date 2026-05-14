#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE=(docker-compose)
else
  echo "docker compose or docker-compose is required" >&2
  exit 1
fi

echo "==> Pulling latest code"
git pull

echo "==> Stopping containers"
"${COMPOSE[@]}" down

echo "==> Building and starting containers"
"${COMPOSE[@]}" up -d --build

echo "==> Current containers"
"${COMPOSE[@]}" ps
