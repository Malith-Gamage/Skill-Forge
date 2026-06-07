import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function migrate() {
  const conn = await mysql.createConnection({
    uri: process.env.MYSQL_DATABASE_URL,
    timezone: 'Z',
    multipleStatements: true,
  });

  const migrationsDir = path.join(process.cwd(), 'src/migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    console.log(`  Running: ${file}`);
    await conn.query(sql);
    console.log(`  ✓ Done:  ${file}`);
  }

  await conn.end();
  console.log(`\nAll ${files.length} migrations complete!`);
}

migrate().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
