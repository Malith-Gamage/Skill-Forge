import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function reset() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: process.argv[2] ?? '',
  });
  await conn.query('DROP DATABASE IF EXISTS skillforge');
  console.log('✓ Dropped database skillforge');
  await conn.end();
}

reset().catch(err => { console.error(err.message); process.exit(1); });
