/**
 * Run once with your MySQL root password to create the skillforge database/user
 * Usage: npx tsx scripts/db-setup.ts <root-password>
 */
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

const rootPassword = process.argv[2] ?? '';

async function setup() {
  console.log('Connecting to MySQL as root...');
  let conn: mysql.Connection;
  try {
    conn = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: rootPassword,
      multipleStatements: true,
    });
  } catch (e: any) {
    if (e.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\nERROR: Wrong root password. Run:');
      console.error('  npx tsx scripts/db-setup.ts YOUR_MYSQL_ROOT_PASSWORD\n');
    } else if (e.code === 'ECONNREFUSED') {
      console.error('\nERROR: MySQL is not running on port 3306.');
      console.error('Start it with: docker compose up -d\n');
    } else {
      console.error('\nERROR:', e.message);
    }
    process.exit(1);
  }

  console.log('Creating database and user...');
  await conn.query(`CREATE DATABASE IF NOT EXISTS skillforge CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
  await conn.query(`CREATE USER IF NOT EXISTS 'skillforge'@'%' IDENTIFIED BY 'skillforge_dev';`);
  await conn.query(`CREATE USER IF NOT EXISTS 'skillforge'@'localhost' IDENTIFIED BY 'skillforge_dev';`);
  await conn.query(`GRANT ALL PRIVILEGES ON skillforge.* TO 'skillforge'@'%';`);
  await conn.query(`GRANT ALL PRIVILEGES ON skillforge.* TO 'skillforge'@'localhost';`);
  await conn.query(`FLUSH PRIVILEGES;`);
  console.log('  ✓ Database and user created');

  await conn.query('USE skillforge;');
  const migrationsDir = path.join(process.cwd(), 'src/migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    console.log(`  Running migration: ${file}`);
    await conn.query(sql);
    console.log(`  ✓ Done: ${file}`);
  }

  await conn.end();
  console.log('\nSetup complete! You can now start the app with: npm run dev\n');
}

setup().catch(err => {
  console.error('Setup failed:', err.message);
  process.exit(1);
});
