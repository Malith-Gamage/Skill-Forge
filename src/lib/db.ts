import mysql from 'mysql2/promise';

const dbConfig: mysql.ConnectionOptions = {
  uri: process.env.MYSQL_DATABASE_URL,
  timezone: 'Z',
  connectTimeout: 30_000,
};

export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const conn = await mysql.createConnection(dbConfig);
  try {
    const [rows] = await conn.execute(sql, params ?? []);
    return rows as T[];
  } finally {
    await conn.end();
  }
}

type Executor = <T = any>(sql: string, params?: any[]) => Promise<T[]>;

export async function withTransaction<T>(fn: (execute: Executor) => Promise<T>): Promise<T> {
  const conn = await mysql.createConnection(dbConfig);
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
    await conn.end();
  }
}
