import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const defaultSocket = path.join(__dirname, '../data/mysql.sock');

function createPool() {
  if (process.env.DATABASE_URL) {
    return mysql.createPool(process.env.DATABASE_URL);
  }
  if (fs.existsSync(defaultSocket)) {
    return mysql.createPool({
      socketPath: defaultSocket,
      user: 'root',
      database: 'lanyard_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return null;
}

export const pool = createPool();

export async function query(text, params = []) {
  if (!pool) {
    throw new Error('DATABASE_URL is not configured.');
  }

  let formattedText = text;
  if (/\$\d+/.test(formattedText)) {
    formattedText = formattedText.replace(/\$\d+/g, '?');
  }
  if (/RETURNING\s+id/gi.test(formattedText)) {
    formattedText = formattedText.replace(/RETURNING\s+id/gi, '');
  }

  const [rows] = await pool.query(formattedText, params);

  if (rows && typeof rows === 'object' && rows.insertId !== undefined) {
    return { rows: [{ id: rows.insertId }] };
  }

  return { rows: Array.isArray(rows) ? rows : [rows] };
}