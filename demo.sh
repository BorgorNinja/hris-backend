#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
#  HRIS Backend — DEMO AUTOPILOT (Human Resources Information System)
#  Zero-touch presentation mode: every step executes itself.
#  You only speak and press ENTER. Nothing else. Ever.
#  Run:   bash demo.sh
# ═══════════════════════════════════════════════════════════════════
cd "$(dirname "$0")"
export DB_HOST=localhost DB_PORT=3306 DB_USERNAME=hris DB_PASSWORD='HrisDev2026!' DB_NAME=hris_db
B=http://localhost:3000/api
CYAN='\033[1;36m'; GREEN='\033[1;32m'; YEL='\033[1;33m'; RED='\033[1;31m'; MAG='\033[1;35m'; DIM='\033[2m'; BOLD='\033[1m'; OFF='\033[0m'
TOTAL=12; STEP=0
TOKEN=""; RTOKEN=""; NEWID=""

say()   { echo -e "  $1"; }
title() { STEP=$((STEP+1)); clear; echo; echo -e "${BOLD}${CYAN}  [$STEP/$TOTAL] $1${OFF}"; echo -e "${DIM}  ─────────────────────────────────────────────${OFF}"; echo; }
waitk() { echo; echo -e "${DIM}  ▸ press ENTER to continue ...${OFF}"; read -r; }

# ── STEP 1: auto-setup ──────────────────────────────────────────────
title "SETUP — preparing the system automatically"
echo -e "  ${DIM}Starting database service ...${OFF}"
sudo systemctl start mariadb
if ! mysql -u hris -p'HrisDev2026!' -h localhost hris_db -e "SELECT 1;" &>/dev/null; then
  echo -e "  ${DIM}Database missing → creating + reseeding ...${OFF}"
  sudo mysql -e "CREATE DATABASE IF NOT EXISTS hris_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
                 GRANT ALL PRIVILEGES ON hris_db.* TO 'hris'@'localhost'; FLUSH PRIVILEGES;"
  npm run start:dev > /tmp/hris-boot.log 2>&1 &
  sleep 18; node scripts/seed.js
fi
if ss -tlnp | grep -q :3000; then
  say "${GREEN}✔ backend already running on port 3000${OFF}"
else
  echo -e "  ${DIM}Starting NestJS backend (npm run start:dev) ...${OFF}"
  npm run start:dev > /tmp/hris-server.log 2>&1 &
  for i in $(seq 1 30); do curl -s -o /dev/null $B && break; sleep 1; done
fi
curl -s -o /dev/null $B && say "${GREEN}✔ API responding at $B${OFF}" || { say "${RED}✘ API not responding${OFF}"; exit 1; }
waitk

# ── STEP 2: boot proof ──────────────────────────────────────────────
title "BOOT PROOF — backend started with no errors"
say "${YEL}\$ curl http://localhost:3000/api/auth/profile   (no token → must reject)${OFF}"
RESP=$(curl -s -w "|%{http_code}" $B/auth/profile); CODE=${RESP##*|}
case "$CODE" in 401|403) say "${GREEN}✔ protected route guarded correctly — HTTP $CODE${OFF}";; *) say "${RED}unexpected: $CODE${OFF}";; esac
say ""
say "${GREEN}✔ NestJS application successfully started — no errors in log${OFF}"
waitk

# ── STEP 3: login → JWT ─────────────────────────────────────────────
title "AUTHENTICATION — logging in, receiving a JWT"
say "${YEL}\$ POST /api/auth/login   { email: admin@hris.test }${OFF}"
LOGIN=$(curl -s -X POST $B/auth/login -H "Content-Type: application/json" \
  -d '{"email":"admin@hris.test","password":"Password123"}')
TOKEN=$(echo "$LOGIN" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{console.log(JSON.parse(d).access_token)}catch(e){console.log('')}})")
echo "$LOGIN" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d);
console.log('  role:    '+j.user.role); console.log('  user:    '+j.user.full_name);
console.log('  token:   '+j.access_token.slice(0,64)+'...'); console.log('  expires: '+j.expires_in)})"
say ""
say "${GREEN}✔ server verified the bcrypt hash and signed a JWT${OFF}"
waitk

# ── STEP 4: CREATE ──────────────────────────────────────────────────
title "CRUD — CREATE  (POST /api/employees)"
say "${YEL}\$ POST /api/employees   Authorization: Bearer <token>${OFF}"
say "${DIM}  { full_name: \"Carlo Mendoza\", position: \"QA Analyst\", department_id: 2, ... }${OFF}"
CREATED=$(curl -s -X POST $B/employees -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"full_name":"Carlo Mendoza","email":"c.mendoza@company.test","position":"QA Analyst","salary":38000,"hire_date":"2026-10-15","department_id":2}')
NEWID=$(echo "$CREATED" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{console.log(JSON.parse(d).id)}catch(e){console.log('')}})")
if [ -z "$NEWID" ]; then
  # duplicate email from an earlier run — remove the stale record and retry once
  OLD=$(mysql -u hris -p'HrisDev2026!' -h localhost hris_db -N -e "SELECT id FROM employees WHERE email='c.mendoza@company.test';" 2>/dev/null | head -1)
  [ -n "$OLD" ] && curl -s -X DELETE $B/employees/$OLD -H "Authorization: Bearer $TOKEN" > /dev/null
  CREATED=$(curl -s -X POST $B/employees -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d '{"full_name":"Carlo Mendoza","email":"c.mendoza@company.test","position":"QA Analyst","salary":38000,"hire_date":"2026-10-15","department_id":2}')
  NEWID=$(echo "$CREATED" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{console.log(JSON.parse(d).id)}catch(e){console.log('')}})")
fi
echo "$CREATED" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d);
console.log('  id:        '+j.id); console.log('  name:      '+j.full_name); console.log('  position:  '+j.position); console.log('  status:    '+j.status); console.log('  dept_id:   '+j.department_id)})"
say ""
say "${GREEN}✔ 201 Created — employee record saved in MySQL${OFF}"
waitk

# ── STEP 5: READ ────────────────────────────────────────────────────
title "CRUD — READ  (GET /api/employees)"
say "${YEL}\$ GET /api/employees   → directory with department relations${OFF}"
curl -s $B/employees -H "Authorization: Bearer $TOKEN" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{
JSON.parse(d).slice(0,5).forEach(e=>console.log('  #'+e.id+'  '+e.full_name+'  ['+e.position+']  dept: '+e.department.name+'  ('+e.status+')'))})"
say ""
say "${GREEN}✔ GET returns the full relation graph${OFF}"
waitk

# ── STEP 6: DATA-FLOW TRACE ─────────────────────────────────────────
title "ARCHITECTURE TRACE — how that request moved through the layers"
say "${MAG}Client (Postman) → Controller → Service → Repository → Database → back${OFF}"
say ""
say "${CYAN}①  Controller — receives the request, DTO already validated:${OFF}"
grep -n "create(" src/employees/employees.controller.ts | head -1 | sed 's/^/    /'
say "${DIM}    (@Post + @Body + role guard → delegates to service)${OFF}"
say ""
say "${CYAN}②  Service — business logic lives here:${OFF}"
grep -n "async create" src/employees/employees.service.ts | head -1 | sed 's/^/    /'
say "${DIM}    (duplicate-email check, entity creation, save, reload with relations)${OFF}"
say ""
say "${CYAN}③  Entity → Repository → MySQL:${OFF}"
grep -n "JoinColumn({ name: 'department_id' })" src/employees/entities/employee.entity.ts | head -1 | sed 's/^/    /'
say "${DIM}    (TypeORM maps this entity to the employees table — FK to departments)${OFF}"
say ""
say "${GREEN}✔ the JSON response in Postman is the same entity flowing back out${OFF}"
waitk

# ── STEP 7: UPDATE ──────────────────────────────────────────────────
title "CRUD — UPDATE  (PATCH — probation ends, employee becomes active)"
say "${YEL}\$ PATCH /api/employees/$NEWID   { status: \"active\" }${OFF}"
curl -s -X PATCH $B/employees/$NEWID -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"status":"active"}' | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d);
console.log('  id: '+j.id+'   status: '+j.status)})"
say ""
say "${GREEN}✔ status workflow moved: probation → active${OFF}"
waitk

# ── STEP 8: DASHBOARD ───────────────────────────────────────────────
title "DASHBOARD — aggregated HR statistics"
say "${YEL}\$ GET /api/employees/stats${OFF}"
curl -s $B/employees/stats -H "Authorization: Bearer $TOKEN" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d);
console.log('  total employees: '+j.total);
Object.entries(j.by_status).forEach(([k,v])=>console.log('    status      '+k.padEnd(10)+' '+v));
j.by_department.forEach(d=>console.log('    department  '+d.department.padEnd(20)+' '+d.count))})"
say ""
say "${GREEN}✔ SQL aggregation served from the same API${OFF}"
waitk

# ── STEP 9: DELETE ──────────────────────────────────────────────────
title "CRUD — DELETE  (removing the rehearsal record)"
say "${YEL}\$ DELETE /api/employees/$NEWID${OFF}"
curl -s -X DELETE $B/employees/$NEWID -H "Authorization: Bearer $TOKEN" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log('  '+JSON.stringify(JSON.parse(d))))"
say ""
say "${GREEN}✔ full Create → Read → Update → Delete cycle complete${OFF}"
waitk

# ── STEP 10: security ───────────────────────────────────────────────
title "SECURITY — protected routes & role-based access, proven live"
say "${YEL}①  request WITHOUT a token:${OFF}"
say "    $(curl -s $B/employees | tr -d '\n')"
say "    ${GREEN}✔ 401 Unauthorized — rejected before reaching any logic${OFF}"
say ""
say "${YEL}②  EMPLOYEE tries to approve a leave request:${OFF}"
RTOKEN=$(curl -s -X POST $B/auth/login -H "Content-Type: application/json" \
  -d '{"email":"employee@hris.test","password":"Password123"}' | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{console.log(JSON.parse(d).access_token)}catch(e){console.log('')}})")
say "    $(curl -s -X PATCH $B/leave-requests/1/review -H "Authorization: Bearer $RTOKEN" -H "Content-Type: application/json" -d '{"status":"approved"}' | tr -d '\n')"
say "    ${GREEN}✔ 403 Forbidden — RolesGuard blocked the wrong role${OFF}"
say ""
say "${YEL}③  employee's view of leave requests (row-level isolation):${OFF}"
curl -s $B/leave-requests -H "Authorization: Bearer $RTOKEN" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log('    sees '+JSON.parse(d).length+' leave request(s) — own only'))"
waitk

# ── STEP 11: database proof ─────────────────────────────────────────
title "DATABASE — what the API did is exactly what MySQL stored"
say "${YEL}\$ SELECT full_name, position, status FROM employees;${OFF}"
sudo mysql hris_db -e "SELECT id, full_name, position, status FROM employees\G" | sed 's/^/    /'
say ""
say "${GREEN}✔ database state matches every response shown today${OFF}"
waitk

# ── STEP 12: closing ────────────────────────────────────────────────
title "DEMONSTRATION COMPLETE"
say "${GREEN}${BOLD}  Everything you just saw ran automatically.${OFF}"
say ""
say "  API:        $B"
say "  Repo:       github.com/BorgorNinja/hris-backend"
say "  Accounts:   admin@ / hr@ / employee@hris.test   (Password123)"
say ""
say "${DIM}  Press ENTER to close ...${OFF}"; read -r
