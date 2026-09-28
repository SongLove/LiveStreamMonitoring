#!/usr/bin/env bash
# 在云服务器执行：从 GitHub 分支 server-dist 拉取已构建的 dist，再用 Docker 启动
# 不编译 TypeScript。首次需自备 .env（可 cp .env.example .env 后填写）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REMOTE="${REMOTE:-origin}"
BRANCH="${DIST_BRANCH:-server-dist}"
REPO_URL="${REPO_URL:-}"

cd "$ROOT"

if [[ ! -d .git ]]; then
  echo "当前目录不是 git 仓库: $ROOT"
  echo "首次部署示例:"
  echo "  git clone -b ${BRANCH} --depth 1 <仓库地址> /www/wwwroot/anchor"
  echo "  cd /www/wwwroot/anchor && cp .env.example .env && bash scripts/deploy.sh"
  exit 1
fi

if [[ -z "$REPO_URL" ]]; then
  REPO_URL="$(git remote get-url "$REMOTE")"
fi

echo "==> 拉取 ${BRANCH}"
git fetch "$REMOTE" "$BRANCH"
git checkout "$BRANCH"
git reset --hard "${REMOTE}/${BRANCH}"

test -f dist/main.api.js || { echo "dist/main.api.js 不存在，请先在开发机执行 bash scripts/publish-dist.sh"; exit 1; }
test -f dist/main.worker.js || { echo "dist/main.worker.js 不存在"; exit 1; }
test -f .env || { echo "缺少 .env，先: cp .env.example .env 并填写密钥"; exit 1; }

export DOCKER_BUILDKIT=0
export COMPOSE_DOCKER_CLI_BUILD=0

echo "==> docker compose（运行时镜像，不编译源码）"
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
echo "health: curl -s http://127.0.0.1:4000/health"
