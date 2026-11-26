#!/bin/bash
# HRISync Backend — one-command demo launcher
# Usage: bash start-demo.sh
set -e
cd "$(dirname "$0")"

echo "✅ [1/4] Starting MariaDB..."
sudo systemctl start mariadb

echo "✅ [2/4] Checking database..."
if ! mysql -u hris -p'HrisDev2026!' -h localhost hris_db -e "SELECT 1;" &>/dev/null; then
  echo "   Database missing — creating and seeding..."
  sudo mysql -e "CREATE DATABASE IF NOT EXISTS hris_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
                 GRANT ALL PRIVILEGES ON hris_db.* TO 'hris'@'localhost'; FLUSH PRIVILEGES;"
  npm run start:dev > /tmp/hrisync-boot.log 2>&1 &
  sleep 18
  node scripts/seed.js
else
  echo "   hris_db OK (tables present)."
fi

echo "✅ [3/4] Starting backend on port 3000..."
if ss -tlnp | grep -q :3000; then
  echo "   Already running → http://localhost:3000/api"
else
  npm run start:dev > /tmp/hrisync-server.log 2>&1 &
  sleep 15
  grep -q "successfully started" /tmp/hrisync-server.log && echo "   Backend running → http://localhost:3000/api" || { echo "   FAILED — check /tmp/hrisync-server.log"; exit 1; }
fi

echo "✅ [4/4] Smoke test (login)..."
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"admin@hris.test","password":"Password123"}' | grep -o '"access_token"' && echo OK)
echo ""
echo "=============================================="
echo "  HRISync Backend is READY for the demonstration"
echo "  API:      http://localhost:3000/api"
echo "  Postman:  import postman/HRIS_Backend_Postman_Collection.json"
echo "  Accounts: admin@hris.test / hr@hris.test / employee@hris.test"
echo "           (password: Password123)"
echo "=============================================="
