/**
 * Restore a mysqldump .sql file into the database pointed at by MYSQL_DATABASE_URL.
 * Usage: npx tsx scripts/restore-backup.ts <path-to-dump.sql>
 */
import fs from 'fs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function restore() {
  const dumpPath = process.argv[2];
  if (!dumpPath) {
    console.error('Usage: npx tsx scripts/restore-backup.ts <path-to-dump.sql>');
    process.exit(1);
  }

  const sql = fs.readFileSync(dumpPath, 'utf-8');
  console.log(`Connecting to ${process.env.MYSQL_DATABASE_URL?.replace(/:[^:@]+@/, ':****@')}`);

  const conn = await mysql.createConnection({
    uri: process.env.MYSQL_DATABASE_URL,
    multipleStatements: true,
    timezone: 'Z',
  });

  console.log(`Restoring ${dumpPath} ...`);
  await conn.query(sql);
  console.log('✓ Restore complete');

  await conn.end();
}

restore().catch(err => {
  console.error('Restore failed:', err.message);
  process.exit(1);
});
