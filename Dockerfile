# ============================================================
# AGU Serviços - Imagem Docker para deploy local/intranet
# ============================================================
# Build: docker build -t agu-servicos .
# Run:   docker run -p 8080:8080 agu-servicos
# Acesse em http://localhost:8080
# ============================================================

# ---- Stage 1: build ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copia manifestos primeiro (cache de dependências)
COPY package.json bun.lock* package-lock.json* ./

# Instala dependências
RUN npm install --legacy-peer-deps

# Copia o restante do código
COPY . .

# Gera o build de produção
RUN npm run build

# ---- Stage 2: runtime ----
FROM node:20-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

# Copia somente o necessário para rodar
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 8080

# TanStack Start gera um servidor Node em .output/server/index.mjs
CMD ["node", ".output/server/index.mjs"]
