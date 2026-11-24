# SenTri Backend — Community-Driven Safety Incident Reporting (Backend Prototype)

ITEC 116 — Systems Integration and Architecture 2 (Final Project)

SenTri is a web-based public-safety system for community incident reporting and
geospatial monitoring. This repository contains the **backend prototype**: a
RESTful API that authenticates users with JWT, stores incident reports,
organizes them by barangay zone, and publishes community announcements.

## Tech Stack

| Component    | Technology |
| ------------ | ---------- |
| Framework    | NestJS 10  |
| ORM          | TypeORM    |
| Database     | MySQL (MariaDB) |
| Auth         | JWT (passport-jwt) + bcrypt password hashing |
| API Testing  | Postman    |
| Versioning   | Git & GitHub |

## How to Run Locally

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure the database** — create `sentri_db` in MySQL/MariaDB, create a
   user, then copy `.env.example` to `.env` and fill in your credentials.

3. **Start the backend**

   ```bash
   npm run start:dev
   ```

   Tables are auto-created by TypeORM (`synchronize: true`). The API runs at
   `http://localhost:3000/api`.

4. **Seed sample data** (optional)

   ```bash
   node scripts/seed.js
   ```

## API Overview (26 endpoints)

| Module        | Endpoints |
| ------------- | --------- |
| Auth          | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/profile`, `PATCH /api/auth/password` |
| Users         | `GET/POST /api/users`, `GET/PATCH/DELETE /api/users/:id` |
| Zones         | `GET/POST /api/zones`, `GET/PATCH/DELETE /api/zones/:id` |
| Incidents     | `GET/POST /api/incidents`, `GET/PATCH/DELETE /api/incidents/:id`, `GET /api/incidents/my`, `GET /api/incidents/stats`, `GET /api/incidents?status=&severity=&zone_id=` |
| Announcements | `GET/POST /api/announcements`, `GET/PATCH/DELETE /api/announcements/:id` |

All routes except `register` and `login` are protected and require
`Authorization: Bearer <token>`. Role-based access control distinguishes
`admin`, `official`, and `resident` accounts.

## Roles

- **admin** — full access, manages users and zones
- **official** — verifies/resolves incident reports, posts announcements
- **resident** — files and manages their own incident reports
