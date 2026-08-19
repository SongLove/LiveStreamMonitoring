#!/usr/bin/env bash
# 本地开发：不依赖 Docker 拉镜像，使用本机 Mongo + Redis
set -euo pipefail
cd "$(dirname "$0")/.."

if ! redis-cli ping >/dev/null 2>&1; then
  echo "启动 Redis..."
  if command -v brew >/dev/null 2>&1; then
    brew services start redis 2>/dev/null || redis-server --daemonize yes
  else
    redis-server --daemonize yes
  fi
  sleep 1
fi

if ! mongosh --eval 'db.runCommand({ ping: 1 })' --quiet >/dev/null 2>&1; then
  echo "MongoDB 未响应，请先启动：brew services start mongodb-community"
  exit 1
fi

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "已创建 .env（默认 127.0.0.1）"
fi

# 确保本地主机名（避免误用 docker 服务名 redis/mongo）
if grep -q '^REDIS_HOST=redis' .env 2>/dev/null; then
  sed -i '' 's/^REDIS_HOST=redis/REDIS_HOST=127.0.0.1/' .env
  echo "已将 .env REDIS_HOST 改为 127.0.0.1"
fi
if grep -q 'mongodb://mongo:' .env 2>/dev/null; then
  sed -i '' 's|mongodb://mongo:27017|mongodb://127.0.0.1:27017|g' .env
  echo "已将 .env MONGODB_URI 改为 127.0.0.1"
fi

echo "Redis: $(redis-cli ping)"
echo "Mongo: ok"
exec npm run start:api:dev
