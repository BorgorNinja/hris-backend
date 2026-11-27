# HRISync Backend - A Web-based Human Resource Information System (Backend Prototype)

ITEC 116 Systems Integration and Architecture 2 (Final Project)

HRISync is a web-based Human Resource Information System featuring **employee
records**, **department organization**, and **leave request management**. This
repository contains the **backend prototype**: a RESTful API that authenticates
users with JWT, maintains employee records, organizes them by department, and
manages the employee leave request workflow.

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
2. **Configure the database** — create `hris_db` in MySQL/MariaDB, create a
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

## API Overview (28 endpoints)

| Module        | Endpoints |
| ------------- | --------- |
| Auth          | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/profile`, `PATCH /api/auth/password` |
| Users         | `GET/POST /api/users`, `GET/PATCH/DELETE /api/users/:id` |
| Departments   | `GET/POST /api/departments`, `GET/PATCH/DELETE /api/departments/:id` |
| Employees     | `GET/POST /api/employees`, `GET/PATCH/DELETE /api/employees/:id`, `GET /api/employees/stats` |
| Leave Requests | `GET/POST /api/leave-requests`, `GET/PATCH/DELETE /api/leave-requests/:id`, `GET /api/leave-requests/pending`, `GET /api/leave-requests/my`, `PATCH /api/leave-requests/:id/review` |

## User Roles

| Role     | Capabilities |
| -------- | ------------ |
| `admin`  | Full access — manages users, departments, employees, and leave requests |
| `hr`     | Manages employee records, departments, and reviews leave requests |
| `employee` | Views own records and files/withdraws leave requests |

## Database Design

Four tables:

- `users` — system accounts (admin / hr / employee roles)
- `departments` — company departments (one department → many employees)
- `employees` — employee records, each linked to a department
- `leave_requests` — leave filings, each linked to an employee
  (status workflow: `pending` → `approved` / `rejected`)

## Demo Launcher

```bash
bash start-demo.sh
```

Starts MariaDB, creates/seeds the database if missing, launches the backend,
and test login. Demo accounts (password `Password123`):
`admin@hris.test`, `hr@hris.test`, `employee@hris.test`.
