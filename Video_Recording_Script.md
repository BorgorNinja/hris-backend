# Video Recording Script — HRISync Backend (5–10 minutes)

Deliverable 5 of the ITEC 116 Final Project. Follow this order exactly —
the handout grades the sequence, not just the content.

---

## Before you hit Record (one-time prep)

1. **Pick a recorder** — on Windows: Xbox Game Bar (`Win + G`, choose "Capture")
   or OBS Studio (free, more control). Game Bar is enough for this.
2. **Do a 60-second test recording** — record anything, play it back, confirm
   you hear your voice AND see the screen. Fix mic level now, not take 5.
3. **Prepare the state:**
   - MySQL running, `hris_db` created, seed script already run once
     (`node scripts/seed.js`) — so demo accounts exist
   - Postman open with `postman/HRIS_Backend_Postman_Collection.json` imported
   - Project open in VS Code at the following files (open tabs now, don't
   search on camera):
     - `src/leave-requests/leave-requests.controller.ts`
     - `src/leave-requests/leave-requests.service.ts`
     - `src/leave-requests/entities/leave-request.entity.ts`
   - phpMyAdmin (or mysql CLI) logged in, `hris_db` visible
   - Close tabs/messages with anything personal. Turn off notifications
     (`Win + A` → Do Not Disturb).
4. **Have this script open on a phone or second monitor** — do not read it
   word-for-word; glance at the next step only.

---

## The Recording (aim for ~7 minutes)

### 0. Intro (0:00–0:30)
Say: "Hi, I'm Isaac Christian Sican, BSIT 4-C. This is HRISync, my final
project for ITEC 116 — a web-based Human Resource Information System with
employee records, department organization, and leave request management.
This video shows the backend prototype running: login with JWT, a full CRUD
sequence, how data moves through the layers, and the database itself."

### 1. Start the backend (0:30–1:15) — REQUIRED
- Show the terminal, run `npm run start:dev`.
- Wait for "successfully started" on screen.
- Say: "The NestJS application starts with no errors and connects to the
  MySQL database. TypeORM synchronizes the entities — the four tables:
  users, departments, employees, and leave_requests."

### 2. Login → JWT (1:15–2:00) — REQUIRED
- In Postman: `POST /api/auth/login` with `admin@hris.test` / `Password123`.
- Highlight the `access_token` in the response.
- Say: "The login endpoint validates the credentials — bcrypt compares the
  password against the stored hash — and returns a signed JWT that expires
  in one day. Every protected route needs this token in the Authorization
  header."

### 3. Full CRUD in Postman (2:00–3:30) — REQUIRED
Use **leave-requests** as the module:
1. **Create** — `POST /api/leave-requests` as employee → 201 (show the body:
   leave_type, dates, reason)
2. **Read** — `GET /api/leave-requests/pending` as hr → list shows it
3. **Update** — `PATCH /api/leave-requests/:id/review` as hr → "approved"
4. **Delete** — `DELETE /api/leave-requests/:id` → 200/204
Say each status code out loud: "201 Created... 200 OK... the API returns
meaningful status codes, not just 200 for everything."

### 4. Data-flow trace in the code (3:30–5:30) — REQUIRED, this is graded hardest
Pick the POST from step 3 and walk the layers with real files on screen:
| Layer | File | Say |
|---|---|---|
| Client | Postman | "sends the JSON body and the Bearer token" |
| Guard | `jwt.strategy.ts` | "validates the token signature and expiry, loads the user" |
| Pipe | `create-leave-request.dto.ts` | "validates the body with class-validator — leave_type and dates required" |
| Controller | `leave-requests.controller.ts` | "receives the request, delegates to the service" |
| Service | `leave-requests.service.ts` | "business logic — status rules, ownership checks" |
| Repository/Entity | `leave-request.entity.ts` | "maps this entity to the leave_requests table in MySQL" |
| Response | back to Postman | "the saved entity is serialized as JSON — that's the response you saw" |
Say: "Transport, business logic, and persistence never mix — each layer has
one job, which is what makes the system testable."

### 5. Protected route rejected (5:30–6:15) — REQUIRED
- Delete the Authorization header → `GET /api/employees` → **401 Unauthorized**.
- Bonus: login as employee, `POST /api/departments` → **403 Forbidden**.
- Say: "No token, 401. Wrong role, 403 — authorization is enforced by the
  roles guard, not just authentication."

### 6. Database proof (6:15–7:00) — REQUIRED
- phpMyAdmin → `hris_db` → `leave_requests`: "here is the record Postman
  just created, and the status the review endpoint changed to `approved`."
- Optionally: `SELECT leave_type, status FROM leave_requests;`

### 7. Closing (7:00–7:20)
"HRISync demonstrates a working REST backend: JWT authentication, three CRUD
modules, 28 endpoints, and a normalized MySQL database through TypeORM. The
source code is on GitHub at github.com/BorgorNinja/hris-backend. Thank you."

---

## After recording

1. Watch it ONCE fully — check audio, check nothing personal on screen.
2. Upload to **Google Drive** (share → "Anyone with the link – Viewer") or
   YouTube (**Unlisted**).
3. **Open the link in an incognito window** and press play — the handout
   requires the link to work logged-out. A broken link = missing deliverable.
4. The same link goes on the Documentation PDF cover page AND in Google
   Classroom.
5. Keep the raw file until grading is done.

## Common failure points (avoid these)
- ❌ Silent recording — narration is mandatory
- ❌ Reading the code silently while scrolling — talk through each layer
- ❌ Only happy paths — steps 5's 401/403 are explicitly required
- ❌ Video longer than 10 minutes — trim it
- ❌ Link that requires permission requests — set "Anyone with the link"
