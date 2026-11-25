# syntax=docker/dockerfile:1
# --- build: Vite + landing prerender (headless Chromium) ---
FROM node:24-bookworm-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends chromium fonts-dejavu-core && rm -rf /var/lib/apt/lists/*
ENV CHROME_PATH=/usr/bin/chromium
WORKDIR /app
COPY package.json package-lock.json ./
# the registry path from this host resets connections now and then: retry, fewer sockets, keep a cache
RUN --mount=type=cache,target=/root/.npm \
    npm config set fetch-retries 6 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set maxsockets 4 && \
    npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# --- serve: static files only ---
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
