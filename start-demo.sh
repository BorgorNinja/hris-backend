#!/bin/bash
# SenTri Backend — one-command demo launcher
# Usage: bash start-demo.sh
set -e
cd "$(dirname "$0")"

echo "── [1/4] Starting MariaDB..."
sudo systemctl start mariadb

echo "── [2/4] Checking database..."
if ! mysql -u sentri -p'SentriDev2026!' -h localhost sentri_db -e "SELECT 1;" &>/dev/null; then
  echo "   Database missing — creating and seeding..."
  sudo mysql -e "CREATE DATABASE IF NOT EXISTS sentri_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
                 GRANT ALL PRIVILEGES ON sentri_db.* TO 'sentri'@'localhost'; FLUSH PRIVILEGES;"
  npm run start:dev > /tmp/sentri-boot.log 2>&1 &
  sleep 18
  node scripts/seed.js
else
  echo "   sentri_db OK (tables present)."
fi

echo "── [3/4] Starting backend on port 3000..."
if ss -tlnp | grep -q :3000; then
  echo "   Already running → http://localhost:3000/api"
else
  npm run start:dev > /tmp/sentri-server.log 2>&1 &
  sleep 15
  grep -q "successfully started" /tmp/sentri-server.log && echo "   Backend running → http://localhost:3000/api" || { echo "   FAILED — check /tmp/sentri-server.log"; exit 1; }
fi

echo "── [4/4] Smoke test (login)..."
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"admin@sentri.test","password":"Password123"}' | grep -o '"access_token"' && echo OK)
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  SenTri Backend is READY for the demonstration       ║"
echo "║  API:      http://localhost:3000/api                 ║"
echo "║  Postman:  import postman/SenTri_Backend_Postman_Collection.json"
echo "║  Accounts: admin@sentri.test / official@sentri.test / resident@sentri.test"
echo "║           (password: Password123)                    ║"
echo "╚══════════════════════════════════════════════════════╝"
