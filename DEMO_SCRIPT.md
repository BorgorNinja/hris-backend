# SenTri Backend — Live Presentation Guide (10–15 min)

Slide deck: `SenTri_Backend_Presentation.pptx` (15 slides, follows the required flow).
Launch everything with one command **before the panel arrives**:

```bash
bash ~/Projects/sentri-backend/start-demo.sh
```

Backup accounts (password `Password123`): admin@sentri.test · official@sentri.test · resident@sentri.test
Postman: import `postman/SenTri_Backend_Postman_Collection.json` before starting.

---

## Slide 1–2 · Title + Overview (~2 min)
- "SenTri is our capstone system — a community-driven safety incident reporting and geospatial monitoring system. This project is its backend: the working REST API that connects residents, officials, and the barangay administration into one system of record."
- Problem today: manual reporting gets lost. SenTri gives every report a record, a status, and a location.

## Slide 3 · Users & Features (~1 min)
- Walk the three roles: admin manages, officials verify, residents file.
- "Role-based access control is enforced at three levels — you'll see that live in a moment."

## Slide 4–5 · Architecture & Stack (~2 min)
- Trace the pipeline top to bottom: Client → ValidationPipe → Guards → Controller → Service → Repository → MySQL.
- Key sentence: "Transport, business logic, and persistence never mix — each layer has one job, which is what made the system testable."
- Stack: NestJS because its module/DI structure mirrors systems integration principles; TypeORM so the database schema lives in code; JWT so the API stays stateless.

## Slide 6–7 · Database Design (~2 min)
- ERD: four tables. Read the three relationships out loud: user → many incidents, zone → many incidents, user → many announcements.
- Mention normalization: "in 3NF — zone names live in zones, incidents only carry the FK."
- Status workflow: reported → verified → resolved (or rejected).

## Slide 8–9 · REST API Design (~1.5 min)
- 26 endpoints, all four HTTP methods, resource-oriented URIs.
- Point at sample request/response: "201 on create, 400 validation, 401 no token, 403 wrong role, 404 unknown id — status codes carry meaning."

## Slide 10–11 · Authentication & Security (~2 min)
- Walk the 7 steps left to right. Emphasize bcrypt (step 3) and the JWT payload (step 4).
- Security measures slide: hashing, protected routes, RBAC, validation, no user enumeration, secrets in .env.

## 🔴 LIVE DEMO · Slides 12–13 (~4 min) — switch to Postman/browser
Follow the collection top to bottom:
1. **Start** — already running (or show `npm run start:dev` booting clean).
2. **Login** — POST /api/auth/login as admin → copy `access_token` into collection variable `{{token}}`.
3. **Full CRUD on incidents** — POST create → GET list → PATCH status "verified" → GET /stats → DELETE.
4. **Data-flow trace (pick the POST you just made):** open `incidents.controller.ts` → "the controller receives the request, the DTO is validated" → `incidents.service.ts` → "business logic: visibility rules, status rules" → `incident.entity.ts` → "the repository maps this entity to the incidents table in MySQL" → then back out: "the service returns the saved entity, the controller serializes it as JSON — that's the response you saw in Postman."
5. **Protected route** — clear the Authorization header → GET /api/incidents → 401. Then login as resident → POST /api/announcements → 403.
6. **Database proof** — phpMyAdmin/`mysql` CLI: `SELECT title, status FROM incidents;` — matches what Postman just did.

## Slide 14–15 · Conclusion + Q&A (~1.5 min)
- Outcome, three lessons, future work.
- Have answers ready: why NestJS over Express? (structure, DI, guards/pipes built in) · why bcrypt over SHA256? (salted, deliberately slow) · why JWT over sessions? (stateless, scales horizontally) · why synchronize:true is dev-only.

---

## Emergency fallbacks
- Server won't start: `bash start-demo.sh` again — it self-heals DB + seed.
- DB wiped: the launcher recreates + reseeds automatically.
- Projector issue: everything needed is in the GitHub repo + documentation PDF.
