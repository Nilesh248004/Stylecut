import pg from 'pg';
import { config } from './config.js';

const { Pool } = pg;

if (!config.databaseUrl) {
  throw new Error('DATABASE_URL is required. Add your Neon connection string to server/.env.');
}

if (config.databaseUrl.includes('USER:PASSWORD') || config.databaseUrl.includes('HOST.neon.tech')) {
  throw new Error('DATABASE_URL still contains placeholder values. Paste the real Neon connection string into server/.env.');
}

export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: config.databaseSsl ? { rejectUnauthorized: false } : false,
  max: Number(process.env.DATABASE_POOL_MAX) || 10,
  idleTimeoutMillis: Number(process.env.DATABASE_IDLE_TIMEOUT_MS) || 30000,
  connectionTimeoutMillis: Number(process.env.DATABASE_CONNECTION_TIMEOUT_MS) || 10000
});

export async function query(text, params) {
  const result = await pool.query(text, params);
  return result;
}

export async function closePool() {
  await pool.end();
}
