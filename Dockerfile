# syntax=docker/dockerfile:1.7
# TAMV Core Kodex — production image (TanStack Start + Nitro Node target)

FROM oven/bun:1.3 AS deps
WORKDIR /app
COPY package.json bun.lock bunfig.toml ./
COPY tamv-core-atlas/package.json ./tamv-core-atlas/package.json
RUN bun install --frozen-lockfile

FROM oven/bun:1.3 AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Nitro preset for a portable Node server image. The default preset in
# @lovable.dev/vite-tanstack-config targets cloudflare; override for self-host.
ENV NITRO_PRESET=node-server
RUN bun run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
COPY --from=build /app/.output ./.output
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/ >/dev/null || exit 1
CMD ["node", ".output/server/index.mjs"]