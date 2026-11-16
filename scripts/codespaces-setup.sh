#!/usr/bin/env bash
# Persediaan automatik GitHub Codespaces: pasang pakej, jana .env, migrasi & data contoh.
set -euo pipefail
npm install

if [ ! -f .env ]; then
  cp .env.example .env
  if [ -n "${CODESPACE_NAME:-}" ]; then
    HOST="${CODESPACE_NAME}-3000.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-app.github.dev}"
    sed -i "s#^APP_URL=.*#APP_URL=\"https://${HOST}\"#" .env
    sed -i "s#^ALLOWED_ORIGINS=.*#ALLOWED_ORIGINS=\"${HOST}\"#" .env
  fi
fi

echo "Menunggu MySQL…"
for i in $(seq 1 60); do
  if node -e "require('net').connect(3306,'127.0.0.1').on('connect',()=>process.exit(0)).on('error',()=>process.exit(1))"; then break; fi
  sleep 2
done
sleep 5
npx prisma migrate deploy
npm run db:seed
echo "Siap. Jalankan: npm run dev"
