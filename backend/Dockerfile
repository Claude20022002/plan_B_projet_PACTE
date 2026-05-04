# ── Stage 1 : dépendances de production ─────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

# Patcher les vulnérabilités connues des packages Alpine avant toute chose
RUN apk upgrade --no-cache

COPY package*.json ./
RUN npm ci --omit=dev

# ── Stage 2 : image finale sécurisée ─────────────────────────────────────────
FROM node:22-alpine
WORKDIR /app

LABEL maintainer="HESTIM Planner" \
      description="Backend Node.js / Express / Sequelize"

# Patcher les CVEs Alpine + ajouter wget pour le healthcheck
RUN apk upgrade --no-cache && apk add --no-cache wget

# Créer un utilisateur non-root (bonne pratique sécurité)
RUN addgroup -S hestim && adduser -S hestim -G hestim

# Copier les dépendances et le code en tant que root, puis changer le propriétaire
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN rm -f .env && chown -R hestim:hestim /app

# Basculer sur l'utilisateur non-root
USER hestim

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:5000/health || exit 1

ENV NODE_ENV=production
CMD ["node", "server.js"]
