/**
 * Seeds sample data for the SenTri backend.
 * Usage: node scripts/seed.js
 */
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USERNAME || 'sentri',
    password: process.env.DB_PASSWORD || 'SentriDev2026!',
    database: process.env.DB_NAME || 'sentri_db',
  });

  const hash = await bcrypt.hash('Password123', 10);

  // Admin, official, resident accounts (password: Password123)
  const users = [
    ['Admin User', 'admin@sentri.test', hash, 'admin'],
    ['Barangay Official', 'official@sentri.test', hash, 'official'],
    ['Juan Resident', 'resident@sentri.test', hash, 'resident'],
  ];

  for (const [name, email, password, role] of users) {
    await conn.execute(
      `INSERT IGNORE INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)`,
      [name, email, password, role],
    );
  }

  // Zones
  const zones = [
    ['Palico IV', 'Barangay Palico IV, Imus City'],
    ['Tanzang Luma I', 'Barangay Tanzang Luma I, Imus City'],
    ['Buhay na Tubig', 'Barangay Buhay na Tubig, Imus City'],
  ];

  for (const [name, description] of zones) {
    await conn.execute(
      `INSERT IGNORE INTO zones (name, description) VALUES (?, ?)`,
      [name, description],
    );
  }

  const [[admin]] = await conn.execute(`SELECT id FROM users WHERE role='admin' LIMIT 1`);
  const [[zone]] = await conn.execute(`SELECT id FROM zones LIMIT 1`);

  // Sample incident
  await conn.execute(
    `INSERT IGNORE INTO incidents (title, description, category, severity, location, zone_id, reported_by_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      'Streetlight outage near the market',
      'Three consecutive streetlights are out along the market road, raising safety concerns at night.',
      'infrastructure',
      'medium',
      'Near Paliko Market, Imus City',
      zone.id,
      admin.id,
    ],
  );

  console.log('Seed complete: 3 users (Password123), 3 zones, 1 incident.');
  await conn.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
