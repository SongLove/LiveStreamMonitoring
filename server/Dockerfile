# 单 compose：Playwright + 系统 Chromium
# 构建 OOM(137) 时：服务器先加 2G swap，见 scripts/docker-up.sh
ARG NODE_IMAGE=docker.1ms.run/library/node:22-bookworm

FROM ${NODE_IMAGE} AS build
WORKDIR /app
# 小规格 ECS：勿设过大 max-old-space（反而触发 OOM 137）
ENV NPM_CONFIG_REGISTRY=https://registry.npmmirror.com \
    NPM_CONFIG_FETCH_RETRIES=5 \
    NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=20000 \
    NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=120000 \
    NPM_CONFIG_FETCH_TIMEOUT=300000 \
    NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_FUND=false \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    NODE_OPTIONS=--max-old-space-size=768

COPY package.json package-lock.json tsconfig.json ./
# Docker 构建关掉 swagger 编译插件，显著降内存
COPY nest-cli.docker.json ./nest-cli.json
RUN npm ci && npm cache clean --force
COPY src ./src
RUN npm run build \
  && npm prune --omit=dev \
  && npm cache clean --force

FROM ${NODE_IMAGE}
WORKDIR /app

RUN set -eux; \
  if [ -f /etc/apt/sources.list.d/debian.sources ]; then \
    sed -i 's|deb.debian.org|mirrors.aliyun.com|g; s|security.debian.org|mirrors.aliyun.com|g' /etc/apt/sources.list.d/debian.sources; \
  fi; \
  if [ -f /etc/apt/sources.list ]; then \
    sed -i 's|deb.debian.org|mirrors.aliyun.com|g; s|security.debian.org|mirrors.aliyun.com|g' /etc/apt/sources.list; \
  fi; \
  apt-get update; \
  apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    fonts-noto-cjk \
    ca-certificates \
  ; \
  rm -rf /var/lib/apt/lists/*; \
  if [ ! -x /usr/bin/chromium ] && [ -x /usr/bin/chromium-browser ]; then \
    ln -sf /usr/bin/chromium-browser /usr/bin/chromium; \
  fi; \
  chromium --version

ENV NODE_ENV=production \
    API_PORT=4000 \
    NPM_CONFIG_REGISTRY=https://registry.npmmirror.com \
    NPM_CONFIG_FETCH_RETRIES=5 \
    NPM_CONFIG_FETCH_TIMEOUT=300000 \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    DOUYIN_PW_EXECUTABLE_PATH=/usr/bin/chromium \
    DOUYIN_PW_HEADLESS=true \
    NODE_OPTIONS=--max-old-space-size=512

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist

EXPOSE 4000
CMD ["node", "dist/main.api.js"]
