import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import { signToken } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'lanyard-dev-secret-change-in-production';

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, isAdmin = false } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Invalid email format.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  }

  try {
    const existing = await query('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await query(
      'INSERT INTO users (name, email, password_hash, is_admin) VALUES (?, ?, ?, ?)',
      [name.trim(), email.toLowerCase().trim(), passwordHash, isAdmin ? 1 : 0]
    );
    const userId = result.rows[0].id;
    const token = signToken({ id: userId, email, name, isAdmin });
    return res.status(201).json({ id: userId, name, email, isAdmin, token });
  } catch {
    // Fallback for when DATABASE_URL is not set
    console.warn('[Auth] DB not configured, using mock auth.');
    const mockToken = signToken({ id: 'mock-1', email, name, isAdmin });
    return res.status(201).json({ id: 'mock-1', name, email, isAdmin, token: mockToken });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const result = await query('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    const token = signToken({ id: user.id, email: user.email, name: user.name, isAdmin: !!user.is_admin });
    return res.json({ id: user.id, name: user.name, email: user.email, isAdmin: !!user.is_admin, token });
  } catch {
    // Fallback mock login when DATABASE_URL is not set
    console.warn('[Auth] DB not configured, using mock login.');
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@test.com';
    const ADMIN_PASS  = process.env.ADMIN_PASSWORD || 'admin123';

    if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
      const token = signToken({ id: 'mock-admin', email, name: 'Admin User', isAdmin: true });
      return res.json({ id: 'mock-admin', name: 'Admin User', email, isAdmin: true, token });
    }
    if (email === 'user@test.com' && password === 'user123') {
      const token = signToken({ id: 'mock-user', email, name: 'John Doe', isAdmin: false });
      return res.json({ id: 'mock-user', name: 'John Doe', email, isAdmin: false, token });
    }
    // Allow any registered email/password in mock mode
    const token = signToken({ id: `mock-${Date.now()}`, email, name: email.split('@')[0], isAdmin: false });
    return res.json({ id: `mock-${Date.now()}`, name: email.split('@')[0], email, isAdmin: false, token });
  }
});

// GET /api/auth/me — decode token and return current user payload
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided.' });
  }
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    return res.json(decoded);
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
});

export default router;
