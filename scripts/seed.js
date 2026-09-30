import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const MYSQL_HOST = process.env.MYSQL_HOST || 'localhost';
const MYSQL_USER = process.env.MYSQL_USER || 'root';
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || '';
const MYSQL_DATABASE = process.env.MYSQL_DATABASE || 'gotek';
const MYSQL_PORT = parseInt(process.env.MYSQL_PORT || '3308', 10);

const SEED_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@gotek.com';
const SEED_PASS = process.env.SEED_ADMIN_PASSWORD || 'admin123';

async function seed() {
  try {
    console.log(`🔌 Connecting to MySQL database: ${MYSQL_DATABASE}...`);
    const connection = await mysql.createConnection({
      host: MYSQL_HOST,
      port: MYSQL_PORT,
      user: MYSQL_USER,
      password: MYSQL_PASSWORD,
      database: MYSQL_DATABASE
    });

    const [existing] = await connection.query('SELECT id FROM users WHERE email = ?', [SEED_EMAIL]);
    if (existing.length > 0) {
      console.log(`ℹ️ Admin account (${SEED_EMAIL}) already exists. Skipping seed.`);
      await connection.end();
      return;
    }

    const hashed = await bcrypt.hash(SEED_PASS, 12);
    const id = uuidv4();
    await connection.query(
      'INSERT INTO users (id, name, email, password, role, organization) VALUES (?, ?, ?, ?, ?, ?)',
      [id, 'Super Admin', SEED_EMAIL, hashed, 'ultra-super-admin', 'GOTEK']
    );

    console.log(`✅ Admin account created successfully! Email: ${SEED_EMAIL}`);
    await connection.end();
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
