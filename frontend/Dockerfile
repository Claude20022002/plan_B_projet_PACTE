# ── Stage 1 : build Vite ─────────────────────────────────────────────────────
# node:22-bookworm-slim (Debian) — profil CVE différent d'Alpine, pas de CVE high connu
FROM node:22-bookworm-slim AS builder
WORKDIR /app

# Patcher les packages Debian avant toute chose
RUN apt-get update && apt-get upgrade -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .

# L'URL de l'API en prod : Nginx proxifie /api → backend:5000
# Pour un domaine séparé : --build-arg VITE_API_URL=https://api.mondomaine.com/api
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ── Stage 2 : Nginx sécurisé ─────────────────────────────────────────────────
FROM nginx:1.27-alpine
LABEL maintainer="HESTIM Planner" \
      description="Frontend React/Vite servi par Nginx"

# Patcher les CVEs Alpine
RUN apk upgrade --no-cache

# Copier le build Vite et la config Nginx
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Réduire les permissions sur les fichiers statiques
RUN chown -R nginx:nginx /usr/share/nginx/html && chmod -R 755 /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
