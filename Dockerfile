FROM node:22-alpine AS base

# ─── Stage 1: dependências de build ──────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ─── Stage 2: build ───────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN node ace build

# ─── Stage 3: produção ────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app

# O build do AdonisJS copia package.json para build/
COPY --from=builder /app/build /app
RUN npm ci --omit=dev

EXPOSE 3333
ENV NODE_ENV=production

CMD ["node", "bin/server.js"]
