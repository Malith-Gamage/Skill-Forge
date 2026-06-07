import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  uri: process.env.MYSQL_DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 10,
  timezone: 'Z',
});

export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const [rows] = await pool.execute(sql, params ?? []);
  return rows as T[];
}

type Executor = <T = any>(sql: string, params?: any[]) => Promise<T[]>;

export async function withTransaction<T>(fn: (execute: Executor) => Promise<T>): Promise<T> {
  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    const execute: Executor = async <T>(sql: string, params?: any[]): Promise<T[]> => {
      const [rows] = await conn.execute(sql, params ?? []);
      return rows as T[];
    };
    const result = await fn(execute);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export { pool };
