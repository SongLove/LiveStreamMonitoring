#!/usr/bin/env bash
# 在开发机执行：编译 dist，推到 GitHub 分支 server-dist（不含源码、不含 .env）
# 云服务器再执行 scripts/deploy.sh 拉取并启动
set -euo pipefail
cd "$(cd "$(dirname "$0")/.." && pwd)"
SERVER_DIR="$(pwd)"
REPO_ROOT="$(git rev-parse --show-toplevel)"
REMOTE="${REMOTE:-origin}"
BRANCH="${DIST_BRANCH:-server-dist}"

test -f package-lock.json || { echo "缺少 package-lock.json"; exit 1; }

echo "==> npm run build"
npm run build
test -f dist/main.api.js || { echo "缺少 dist/main.api.js"; exit 1; }
test -f dist/main.worker.js || { echo "缺少 dist/main.worker.js"; exit 1; }

STAGE="$(mktemp -d)"
cleanup() { rm -rf "$STAGE"; }
trap cleanup EXIT

mkdir -p "$STAGE/scripts"
cp -R dist "$STAGE/dist"
cp package.json package-lock.json Dockerfile.runtime docker-compose.yml docker-compose.prod.yml .env.example "$STAGE/"
cp scripts/deploy.sh "$STAGE/scripts/deploy.sh"
chmod +x "$STAGE/scripts/deploy.sh"
cat > "$STAGE/.gitignore" <<'EOF'
.env
.env.*
!.env.example
node_modules/
*.log
dump.rdb
EOF
cat > "$STAGE/.dockerignore" <<'EOF'
node_modules
.git
.env
.env.*
!.env.example
*.log
dump.rdb
EOF

WT="$(mktemp -d)"
git -C "$REPO_ROOT" fetch "$REMOTE" "$BRANCH" 2>/dev/null || true
if git -C "$REPO_ROOT" show-ref --verify --quiet "refs/remotes/${REMOTE}/${BRANCH}"; then
  git -C "$REPO_ROOT" worktree add --detach "$WT" "${REMOTE}/${BRANCH}"
  git -C "$WT" checkout -B "$BRANCH"
else
  git -C "$REPO_ROOT" worktree add --detach "$WT" HEAD
  git -C "$WT" checkout --orphan "$BRANCH"
  git -C "$WT" rm -rf . >/dev/null 2>&1 || true
fi

find "$WT" -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} +
cp -R "$STAGE"/. "$WT"/
git -C "$WT" add -A
if git -C "$WT" diff --cached --quiet; then
  echo "==> dist 无变化，跳过提交"
else
  git -C "$WT" commit -m "chore: publish server dist $(date +%Y-%m-%dT%H:%M:%S)"
fi
git -C "$WT" push -u "$REMOTE" "$BRANCH"
git -C "$REPO_ROOT" worktree remove --force "$WT"
echo "==> 已推送 ${REMOTE}/${BRANCH}"
echo "服务器: cd <部署目录> && bash scripts/deploy.sh"
