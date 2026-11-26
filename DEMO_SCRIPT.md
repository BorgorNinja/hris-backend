# HRISync Backend — Live Presentation Guide (10–15 min)

Slide deck: `HRISync_Backend_Presentation.pptx` (15 slides, follows the required flow).
Launch everything with one command **before the panel arrives**:

```bash
bash start-demo.sh
```

Backup accounts (password `Password123`): admin@hris.test — hr@hris.test — employee@hris.test
Postman: import `postman/HRIS_Backend_Postman_Collection.json` before starting.

---

## Slide 1–2 — Title + Overview (~2 min)
- "HRISync is a web-based Human Resource Information System with employee records, department organization, and leave request management. This project is its backend: the working REST API that connects admins, HR officers, and employees into one system of record."
- Problem today: HR records and leave filings are manual paperwork. HRISync gives every employee a record, every department an organization, and every leave request a status.

## Slide 3 — Users & Features (~1 min)
- Walk the three roles: admin manages, HR maintains records, employees file leave.
- "Role-based access control is enforced at three levels — you'll see that live in a moment."

## Slide 4–5 — Architecture & Stack (~2 min)
- Trace the pipeline top to bottom: Client → ValidationPipe → Guards → Controller → Service → Repository → MySQL.
- Key sentence: "Transport, business logic, and persistence never mix — each layer has one job, which is what made the system testable."
- Stack: NestJS because its module/DI structure mirrors systems integration principles; TypeORM so the database schema lives in code; JWT so the API stays stateless.

## Slide 6–7 — Database Design (~2 min)
- ERD: four tables. Read the three relationships out loud: department → many employees, employee → many leave requests, user → system account.
- Mention normalization: "in 3NF — department names live in departments, leave requests only carry the FK."
- Status workflow: pending → approved (or rejected).

## Slide 8–9 — REST API Design (~1.5 min)
- 28 endpoints, all four HTTP methods, resource-oriented URIs.
- Point at sample request/response: "201 on create, 400 validation, 401 no token, 403 wrong role, 404 unknown id — status codes carry meaning."

## Slide 10–11 — Authentication & Security (~2 min)
- Walk the 7 steps left to right. Emphasize bcrypt (step 3) and the JWT payload (step 4).
- Security measures slide: hashing, protected routes, RBAC, validation, no user enumeration, secrets in .env.

## 🎬 LIVE DEMO — Slides 12–13 (~4 min) — switch to Postman/browser
Follow the collection top to bottom:
1. **Start** — already running (or show `npm run start:dev` booting clean).
2. **Login** — POST /api/auth/login as admin → copy `access_token` into collection variable `{{token}}`.
3. **Full CRUD on leave requests** — POST file a leave as employee → GET pending as hr → PATCH :id/review "approved" → GET employees/stats → DELETE withdraw.
4. **Data-flow trace (pick the POST you just made):** open `leave-requests.controller.ts` → "the controller receives the request, the DTO is validated" → `leave-requests.service.ts` → "business logic: status rules, ownership checks" → `leave-request.entity.ts` → "the repository maps this entity to the leave_requests table in MySQL" → then back out: "the service returns the saved entity, the controller serializes it as JSON — that's the response you saw in Postman."
5. **Protected route** — clear the Authorization header → GET /api/employees → 401. Then login as employee → POST /api/departments → 403.
6. **Database proof** — phpMyAdmin/`mysql` CLI: `SELECT leave_type, status FROM leave_requests;` → matches what Postman just did.

## Slide 14–15 — Conclusion + Q&A (~1.5 min)
- Outcome, three lessons, future work.
- Have answers ready: why NestJS over Express? (structure, DI, guards/pipes built in) — why bcrypt over SHA256? (salted, deliberately slow) — why JWT over sessions? (stateless, scales horizontally) — why synchronize:true is dev-only.

---

## Emergency fallbacks
- Server won't start: `bash start-demo.sh` again — it self-heals DB + seed.
- DB wiped: the launcher recreates + reseeds automatically.
- Projector issue: everything needed is in the GitHub repo + documentation PDF.
