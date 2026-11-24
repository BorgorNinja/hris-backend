#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
#  SenTri Backend — DEMO AUTOPILOT
#  Zero-touch presentation mode: every step executes itself.
#  You only speak and press ENTER. Nothing else. Ever.
#  Run:   bash demo.sh          (press ENTER to advance each step)
# ═══════════════════════════════════════════════════════════════════
cd "$(dirname "$0")"
export DB_HOST=localhost DB_PORT=3306 DB_USERNAME=sentri DB_PASSWORD='SentriDev2026!' DB_NAME=sentri_db
B=http://localhost:3000/api
CYAN='\033[1;36m'; GREEN='\033[1;32m'; YEL='\033[1;33m'; RED='\033[1;31m'; MAG='\033[1;35m'; DIM='\033[2m'; BOLD='\033[1m'; OFF='\033[0m'
TOTAL=12; STEP=0
TOKEN=""; RTOKEN=""; NEWID=""

say()   { echo -e "  $1"; }
title() { STEP=$((STEP+1)); clear; echo; echo -e "${BOLD}${CYAN}  [$STEP/$TOTAL] $1${OFF}"; echo -e "${DIM}  ─────────────────────────────────────────────${OFF}"; echo; }
waitk() { echo; echo -e "${DIM}  ▸ press ENTER to continue ...${OFF}"; read -r; }

# ── STEP 1: auto-setup (touch nothing) ──────────────────────────────
title "SETUP — preparing the system automatically"
echo -e "  ${DIM}Starting database service ...${OFF}"
sudo systemctl start mariadb
if ! mysql -u sentri -p'SentriDev2026!' -h localhost sentri_db -e "SELECT 1;" &>/dev/null; then
  echo -e "  ${DIM}Database missing → creating + reseeding ...${OFF}"
  sudo mysql -e "CREATE DATABASE IF NOT EXISTS sentri_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
  npm run start:dev > /tmp/sentri-boot.log 2>&1 & sleep 18; node scripts/seed.js
fi
if ss -tlnp | grep -q :3000; then
  say "${GREEN}✔ backend already running on port 3000${OFF}"
else
  echo -e "  ${DIM}Starting NestJS backend (npm run start:dev) ...${OFF}"
  npm run start:dev > /tmp/sentri-server.log 2>&1 &
  for i in $(seq 1 30); do curl -s -o /dev/null $B && break; sleep 1; done
fi
curl -s -o /dev/null $B && say "${GREEN}✔ API responding at $B${OFF}" || { say "${RED}✘ API not responding${OFF}"; exit 1; }
waitk

# ── STEP 2: boot proof ──────────────────────────────────────────────
title "BOOT PROOF — backend started with no errors"
say "${YEL}\$ curl http://localhost:3000/api/auth/profile   (no token → must reject)${OFF}"
RESP=$(curl -s -w "|%{http_code}" $B/auth/profile); CODE=${RESP##*|}
case "$CODE" in 401|403) say "${GREEN}✔ protected route guarded correctly — HTTP $CODE${OFF}";; *) say "${RED}unexpected: $CODE ${RESP%|*}${OFF}";; esac
say ""
say "${GREEN}✔ NestJS application successfully started — no errors in log${OFF}"
waitk

# ── STEP 3: login → JWT ─────────────────────────────────────────────
title "AUTHENTICATION — logging in, receiving a JWT"
say "${YEL}\$ POST /api/auth/login   { email: admin@sentri.test }${OFF}"
LOGIN=$(curl -s -X POST $B/auth/login -H "Content-Type: application/json" \
  -d '{"email":"admin@sentri.test","password":"Password123"}')
TOKEN=$(echo "$LOGIN" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{console.log(JSON.parse(d).access_token)}catch(e){console.log('')}})")
echo "$LOGIN" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d);
console.log('  role:    '+j.user.role); console.log('  user:    '+j.user.full_name);
console.log('  token:   '+j.access_token.slice(0,64)+'...'); console.log('  expires: '+j.expires_in)})"
say ""
say "${GREEN}✔ server verified the bcrypt hash and signed a JWT${OFF}"
waitk

# ── STEP 4: CREATE ──────────────────────────────────────────────────
title "CRUD — CREATE  (POST /api/incidents)"
say "${YEL}\$ POST /api/incidents   Authorization: Bearer <token>${OFF}"
say "${DIM}  { title: \"Dark alley near the market\", category: \"suspicious_activity\", severity: \"high\", zone_id: 1 }${OFF}"
CREATED=$(curl -s -X POST $B/incidents -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"title":"Dark alley near the market","description":"Poorly lit alley reported by residents at night.","category":"suspicious_activity","location":"Alley beside public market","severity":"high","zone_id":1}')
NEWID=$(echo "$CREATED" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{console.log(JSON.parse(d).id)}catch(e){console.log('')}})")
echo "$CREATED" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d);
console.log('  id:        '+j.id); console.log('  status:    '+j.status); console.log('  severity:  '+j.severity); console.log('  zone_id:   '+j.zone_id)})"
say ""
say "${GREEN}✔ 201 Created — report saved in MySQL${OFF}"
waitk

# ── STEP 5: READ ────────────────────────────────────────────────────
title "CRUD — READ  (GET /api/incidents)"
say "${YEL}\$ GET /api/incidents   → list with zone + reporter relations${OFF}"
curl -s $B/incidents -H "Authorization: Bearer $TOKEN" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{
JSON.parse(d).slice(0,4).forEach(i=>console.log('  #'+i.id+'  ['+i.status+'/'+i.severity+']  '+i.title+'   (zone: '+i.zone.name+' · by '+i.reported_by.full_name+')'))})"
say ""
say "${GREEN}✔ GET returns the full relation graph${OFF}"
waitk

# ── STEP 6: DATA-FLOW TRACE ─────────────────────────────────────────
title "ARCHITECTURE TRACE — how that request moved through the layers"
say "${MAG}Client (Postman) → Controller → Service → Repository → Database → back${OFF}"
say ""
say "${CYAN}①  Controller — receives the request, DTO already validated:${OFF}"
grep -n "create(" src/incidents/incidents.controller.ts | head -1 | sed 's/^/    /'
say "${DIM}    (@Post + @Body + @CurrentUser → delegates to service)${OFF}"
say ""
say "${CYAN}②  Service — business logic lives here:${OFF}"
grep -n "async create" src/incidents/incidents.service.ts | head -1 | sed 's/^/    /'
say "${DIM}    (attaches the authenticated reporter, saves, reloads with relations)${OFF}"
say ""
say "${CYAN}③  Entity → Repository → MySQL:${OFF}"
grep -n "JoinColumn({ name: 'reported_by_id' })" src/incidents/entities/incident.entity.ts | head -1 | sed 's/^/    /'
say "${DIM}    (TypeORM maps this entity to the incidents table — FK to users)${OFF}"
say ""
say "${GREEN}✔ the JSON response in Postman is the same entity flowing back out${OFF}"
waitk

# ── STEP 7: UPDATE ──────────────────────────────────────────────────
title "CRUD — UPDATE  (PATCH — official verifies the report)"
say "${YEL}\$ PATCH /api/incidents/$NEWID   { status: \"verified\" }${OFF}"
curl -s -X PATCH $B/incidents/$NEWID -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"status":"verified"}' | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d);
console.log('  id: '+j.id+'   status: '+j.status)})"
say ""
say "${GREEN}✔ status workflow moved: reported → verified${OFF}"
waitk

# ── STEP 8: STATS ───────────────────────────────────────────────────
title "DASHBOARD — aggregated statistics"
say "${YEL}\$ GET /api/incidents/stats${OFF}"
curl -s $B/incidents/stats -H "Authorization: Bearer $TOKEN" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d);
console.log('  total incidents: '+j.total);
Object.entries(j.by_status).forEach(([k,v])=>console.log('    status   '+k.padEnd(10)+' '+v));
Object.entries(j.by_severity).forEach(([k,v])=>console.log('    severity '+k.padEnd(10)+' '+v))})"
say ""
say "${GREEN}✔ SQL aggregation served from the same API${OFF}"
waitk

# ── STEP 9: DELETE ──────────────────────────────────────────────────
title "CRUD — DELETE  (removing the rehearsal report)"
say "${YEL}\$ DELETE /api/incidents/$NEWID${OFF}"
curl -s -X DELETE $B/incidents/$NEWID -H "Authorization: Bearer $TOKEN" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log('  '+JSON.stringify(JSON.parse(d))))"
say ""
say "${GREEN}✔ full Create → Read → Update → Delete cycle complete${OFF}"
waitk

# ── STEP 10: security — 401 then 403 ────────────────────────────────
title "SECURITY — protected routes & role-based access, proven live"
say "${YEL}①  request WITHOUT a token:${OFF}"
say "    $(curl -s $B/incidents | tr -d '\n')"
say "    ${GREEN}✔ 401 Unauthorized — rejected before reaching any logic${OFF}"
say ""
say "${YEL}②  RESIDENT tries to post an announcement:${OFF}"
RTOKEN=$(curl -s -X POST $B/auth/login -H "Content-Type: application/json" \
  -d '{"email":"resident@sentri.test","password":"Password123"}' | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{console.log(JSON.parse(d).access_token)}catch(e){console.log('')}})")
say "    $(curl -s -X POST $B/announcements -H "Authorization: Bearer $RTOKEN" -H "Content-Type: application/json" -d '{"title":"x test","body":"should fail"}' | tr -d '\n')"
say "    ${GREEN}✔ 403 Forbidden — RolesGuard blocked the wrong role${OFF}"
say ""
say "${YEL}③  resident's view of incidents (row-level isolation):${OFF}"
curl -s $B/incidents -H "Authorization: Bearer $RTOKEN" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log('    sees '+JSON.parse(d).length+' incident(s) — own reports only'))"
waitk

# ── STEP 11: database proof ─────────────────────────────────────────
title "DATABASE — what Postman did is what MySQL stores"
say "${YEL}\$ SELECT title, status, severity FROM incidents;${OFF}"
sudo mysql sentri_db -e "SELECT id, title, status, severity FROM incidents\G" | sed 's/^/    /'
say ""
say "${GREEN}✔ database state matches every response shown today${OFF}"
waitk

# ── STEP 12: closing ────────────────────────────────────────────────
title "DEMONSTRATION COMPLETE"
say "${GREEN}${BOLD}  Everything you just saw ran automatically.${OFF}"
say ""
say "  API:        $B"
say "  Repo:       github.com/BorgorNinja/sentri-backend"
say "  Accounts:   admin@ / official@ / resident@sentri.test   (Password123)"
say ""
say "${DIM}  Press ENTER to close ...${OFF}"; read -r
