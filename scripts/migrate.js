import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const MYSQL_HOST = process.env.MYSQL_HOST || 'localhost';
const MYSQL_USER = process.env.MYSQL_USER || 'root';
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || '';
const MYSQL_DATABASE = process.env.MYSQL_DATABASE || 'gotek';
const MYSQL_PORT = parseInt(process.env.MYSQL_PORT || '3308', 10);

async function migrate() {
  try {
    console.log(`🔌 Connecting to MySQL database: ${MYSQL_DATABASE}...`);
    const connection = await mysql.createConnection({
      host: MYSQL_HOST,
      port: MYSQL_PORT,
      user: MYSQL_USER,
      password: MYSQL_PASSWORD,
      database: MYSQL_DATABASE
    });

    console.log('🔍 Fetching all users...');
    const [users] = await connection.query('SELECT id, email, password FROM users');

    let count = 0;
    for (const u of users) {
      if (!u.password.startsWith('$2b$') && !u.password.startsWith('$2a$')) {
        const hashed = await bcrypt.hash(u.password, 12);
        await connection.query('UPDATE users SET password = ? WHERE id = ?', [hashed, u.id]);
        count++;
        console.log(`✅ Password hashed for user: ${u.email} (${u.id})`);
      }
    }

    console.log(`\n🎉 Password migration complete! ${count} user passwords updated.`);
    await connection.end();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
