# ── Build ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma

RUN npm ci

COPY . .

RUN npx prisma generate && npm run build

# ── Production ────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma

RUN npm ci --omit=dev && npx prisma generate

COPY --from=builder /app/dist ./dist

RUN mkdir -p public/uploads /var/data/uploads

EXPOSE 3001

# Schéma DB puis démarrage (pas de migrations versionnées pour l’instant)
CMD ["sh", "-c", "npx prisma db push && node dist/src/main.js"]
