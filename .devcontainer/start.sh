#!/usr/bin/env bash
# Sobe backend e frontend em segundo plano, sem duplicar se já estiverem rodando
cd "$(dirname "$0")/.."

start() { # nome  pasta  padrão-do-processo
  if pgrep -f "$3" > /dev/null; then echo "$1: já está rodando"; return; fi
  (cd "$2" && nohup npm run dev > "/tmp/$1.log" 2>&1 &)
  echo "$1: iniciado (log em /tmp/$1.log)"
}

start backend backend "src/server.ts"
start frontend frontend "vite"