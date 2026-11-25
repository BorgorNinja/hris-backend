/**
 * Seeds sample data for the HRIS backend.
 * Usage: node scripts/seed.js
 */
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USERNAME || 'hris',
    password: process.env.DB_PASSWORD || 'HrisDev2026!',
    database: process.env.DB_NAME || 'hris_db',
  });

  const hash = await bcrypt.hash('Password123', 10);

  // System accounts (password: Password123)
  const users = [
    ['Admin User', 'admin@hris.test', hash, 'admin'],
    ['Maria Santos', 'hr@hris.test', hash, 'hr'],
    ['Juan Employee', 'employee@hris.test', hash, 'employee'],
  ];

  for (const [name, email, password, role] of users) {
    await conn.execute(
      `INSERT IGNORE INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)`,
      [name, email, password, role],
    );
  }

  // Departments
  const departments = [
    ['Human Resources', 'People operations, recruitment, and employee welfare'],
    ['Engineering', 'Product development and systems integration'],
    ['Finance', 'Accounting, budgeting, and payroll'],
    ['Marketing', 'Brand, campaigns, and market research'],
  ];

  for (const [name, description] of departments) {
    await conn.execute(
      `INSERT IGNORE INTO departments (name, description) VALUES (?, ?)`,
      [name, description],
    );
  }

  const [[hrDept]] = await conn.execute(`SELECT id FROM departments WHERE name='Human Resources'`);
  const [[engDept]] = await conn.execute(`SELECT id FROM departments WHERE name='Engineering'`);

  // Employee records
  const employees = [
    ['Maria Santos', 'm.santos@company.test', 'HR Officer', 45000.0, '2023-01-16', 'active', hrDept.id],
    ['Juan Dela Cruz', 'j.delacruz@company.test', 'Software Engineer', 60000.0, '2024-03-04', 'active', engDept.id],
    ['Ana Reyes', 'a.reyes@company.test', 'Junior Developer', 35000.0, '2026-06-01', 'probation', engDept.id],
  ];

  for (const [name, email, position, salary, hire, status, dept] of employees) {
    await conn.execute(
      `INSERT IGNORE INTO employees (full_name, email, position, salary, hire_date, status, department_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, email, position, salary, hire, status, dept],
    );
  }

  const [[ana]] = await conn.execute(`SELECT id FROM employees WHERE email='a.reyes@company.test'`);
  const [[admin]] = await conn.execute(`SELECT id FROM users WHERE role='admin' LIMIT 1`);

  // Pending leave requests
  await conn.execute(
    `INSERT IGNORE INTO leave_requests (employee_id, leave_type, start_date, end_date, reason)
     VALUES (?, 'sick', '2026-11-27', '2026-11-28', 'Fever and flu, advised two days rest by the clinic.')`,
    [ana.id],
  );

  console.log('Seed complete: 3 users (Password123), 4 departments, 3 employees, 1 pending leave request.');
  await conn.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
