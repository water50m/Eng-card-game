# english-card-game/backend/Dockerfile
FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat curl

FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx tsc

FROM base AS runner
ENV NODE_ENV=production
COPY --from=deps    /app/node_modules ./node_modules
COPY --from=builder /app/dist         ./dist
COPY package.json ./

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid  1001 apiuser
USER apiuser

EXPOSE 4000
CMD ["node", "dist/server.js"]
