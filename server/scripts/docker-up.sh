#!/usr/bin/env bash
# 一键部署：docker compose up
set -euo pipefail
cd "$(cd "$(dirname "$0")/.." && pwd)"

test -f .env || { echo "缺少 .env，先: cp .env.example .env"; exit 1; }
test -d src || { echo "缺少 src/，请同步整个 server/ 目录"; exit 1; }
test -f tsconfig.json || { echo "缺少 tsconfig.json"; exit 1; }
test -f nest-cli.docker.json || { echo "缺少 nest-cli.docker.json"; exit 1; }

# 可用内存 < 1.2GiB 时自动尝试加 2G swap（需 root），避免 nest build OOM 137
ensure_swap() {
  if [[ ! -r /proc/meminfo ]]; then return 0; fi
  local avail_kb
  avail_kb=$(awk '/MemAvailable/{print $2}' /proc/meminfo)
  if [[ -z "$avail_kb" || "$avail_kb" -ge 1200000 ]]; then return 0; fi
  if swapon --show 2>/dev/null | grep -q .; then
    echo "==> 内存偏低但已有 swap"
    return 0
  fi
  echo "==> 可用内存约 $((avail_kb/1024))MB，准备加 2G swap（需 root）"
  if [[ "$(id -u)" -ne 0 ]]; then
    echo "请用 root 执行一次:"
    echo "  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile"
    echo "  echo '/swapfile none swap sw 0 0' >> /etc/fstab"
    return 0
  fi
  if [[ ! -f /swapfile ]]; then
    fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
    chmod 600 /swapfile
    mkswap /swapfile
  fi
  swapon /swapfile || true
  grep -q '/swapfile' /etc/fstab 2>/dev/null || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  free -h
}

ensure_swap

export DOCKER_BUILDKIT=0
export COMPOSE_DOCKER_CLI_BUILD=0

docker compose up -d --build
docker compose ps
echo "health: curl -s http://127.0.0.1:4000/health"
