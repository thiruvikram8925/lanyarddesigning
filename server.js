import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import fs from 'fs/promises';
import { existsSync, mkdirSync, createWriteStream } from 'fs';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_gotek_designing_tool_2026_dev_mode';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const BCRYPT_ROUNDS = 12;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Ensure uploads directory exists on startup ---
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const CHUNKS_DIR = path.join(__dirname, 'uploads', '_chunks');
if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true });
if (!existsSync(CHUNKS_DIR)) mkdirSync(CHUNKS_DIR, { recursive: true });

const app = express();
const PORT = process.env.PORT || 5001;

// Max upload file size: 10 GB
const MAX_FILE_SIZE = (parseInt(process.env.MAX_FILE_SIZE_GB || '10', 10)) * 1024 * 1024 * 1024;

// MySQL Configuration
const MYSQL_HOST = process.env.MYSQL_HOST || 'localhost';
const MYSQL_USER = process.env.MYSQL_USER || 'root';
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || '';
const MYSQL_DATABASE = process.env.MYSQL_DATABASE || 'gotek';
const MYSQL_PORT = process.env.MYSQL_PORT || 3308;

// Rate Limiters
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX || '10', 10),
  skipSuccessfulRequests: true,
  message: { message: 'Too many login attempts. Please wait 15 minutes.' },
});

app.use('/api/', apiLimiter);
app.use(cors());
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend build files
app.use(express.static(path.join(__dirname, 'dist')));

// Audit Logging helper
async function auditLog(actorId, actorEmail, action, targetId = null, detail = null, ip = null) {
  if (!pool) return;
  try {
    await pool.query(
      'INSERT INTO audit_logs (id, actor_id, actor_email, action, target_id, detail, ip) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [uuidv4(), actorId, actorEmail, action, targetId, detail ? JSON.stringify(detail) : null, ip]
    );
  } catch (e) {
    console.error('Audit log error:', e.message);
  }
}

// Authentication Middleware
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// Role Authorization Middleware
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
}

// --- Increase request timeout for all routes (60 minutes for large uploads up to 10GB) ---
app.use((req, res, next) => {
  const isUploadRoute = req.path.startsWith('/api/upload');
  const timeout = isUploadRoute ? 60 * 60 * 1000 : 5 * 60 * 1000; // 60min uploads, 5min other
  req.setTimeout(timeout);
  res.setTimeout(timeout);
  next();
});

// Storage for uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure uploads dir exists before every write
    if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true });
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    // Use UUID to prevent filename collisions
    const uniqueName = `${Date.now()}-${uuidv4().slice(0, 8)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,      // 200 MB max
    files: 1,                      // One file at a time
    fieldSize: MAX_FILE_SIZE,      // Field value size limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common upload types
    const allowedMimes = [
      'application/pdf',
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
      'application/vnd.ms-excel', // xls
      'text/csv',
      'application/zip', 'application/x-zip-compressed',
      'application/octet-stream', // catch-all for some PDFs
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed: ${file.mimetype}. Allowed: PDF, images, Excel, ZIP.`));
    }
  }
});

// --- Multer error handler middleware ---
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`,
        code: 'FILE_TOO_LARGE'
      });
    }
    return res.status(400).json({ error: `Upload error: ${err.message}`, code: err.code });
  }
  if (err) {
    return res.status(400).json({ error: err.message || 'Upload failed' });
  }
  next();
};

let pool = null;

const MOCK_USERS = [
  { id: '1', name: 'Technosprint Info Solutions', email: 'itsupport@technosprint.net', password: 'Poland@01', role: 'ultra-super-admin', organization: 'Technosprint Info Solutions' },
  { id: 'dd055e0a-6941-4ab5-a30e-e148438cfdcf', name: 'Super Admin', email: 'admin@gotek.com', password: 'admin123', role: 'super-admin', organization: 'GOTEK' },
  { id: '69d602723fe66f52321c75e4', name: 'sample1', email: 'admin1@gmail.com', password: 'admin123', role: 'super-admin', organization: 'GOTEK' },
  { id: '6a070943d81a69.18715317', name: 'Shailendhirah', email: 'shailendhirah@gmail.com', password: 'Shailu@17', role: 'super-admin', organization: 'Gotek' },
  { id: '69d602c23fe66f52321c75e5', name: 'sample2', email: 'sub1@gmail.com', password: 'sub11234', role: 'admin', organization: 'GOTEK' },
  { id: '6a0709a62c2895.84473139', name: 'Devasri', email: 'devasri@gmail.com', password: 'devasri123', role: 'admin', organization: 'Gotek' },
  { id: '6a070d1a435728.64421047', name: 'Rakshanadevi', email: 'rakshana@gmail.com', password: 'rd123', role: 'admin', organization: 'Gotek' },
  { id: '6a070d73556c32.78560277', name: 'Varshini', email: 'varshini@gmail.com', password: 'varshini123', role: 'admin', organization: 'Gotek' },
  { id: '6a070dabe72119.88646130', name: 'Arul Jothi', email: 'arul@gmail.com', password: 'arul123', role: 'admin', organization: 'Gotek' },
  { id: '69d6083e7451798af0524827', name: 'Sam', email: 'user1@gmail.com', password: 'user123', role: 'user', organization: 'GOTEK' },
  { id: '69d61f2f65b486ff25820c2f', name: 'Sam John', email: 'user2@gmail.com', password: 'user123', role: 'user', organization: 'AVRS' },
  { id: '9a9ff277-88f2-47c1-975a-45054ed501d3', name: 'sam1', email: 'sam2@gmail.com', password: 'bank@123', role: 'user', organization: 'IDFC First Bharat Bank' }
];

const MOCK_PROJECTS = [];

// Connect to MySQL
async function connectDB() {
  try {
    console.log(`🔌 Attempting to connect to MySQL: ${MYSQL_HOST}:${MYSQL_PORT}...`);
    pool = mysql.createPool({
      host: MYSQL_HOST,
      port: MYSQL_PORT,
      user: MYSQL_USER,
      password: MYSQL_PASSWORD,
      database: MYSQL_DATABASE,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    
    // Test connection
    const connection = await pool.getConnection();
    console.log(`🥭 ✅ Connected to MySQL: ${MYSQL_DATABASE} successfully.`);
    connection.release();

    // Ensure schema is up to date
    await ensureSchema();
  } catch (err) {
    console.error('❌ CRITICAL: MySQL connection failed!');
    console.error('Please check your MYSQL_HOST, USER, and PASSWORD variables.');
    console.error(err.message);
    // process.exit(1); // Do not exit, allow server to stay up for log inspection
  }
}

async function ensureSchema() {
  try {
    console.log('🏗️  Verifying database schema...');
    
    // 1. Create Tables if they don't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id varchar(100) NOT NULL,
        name varchar(255) NOT NULL,
        organization varchar(255) DEFAULT NULL,
        status enum('draft','active','validated','generating','completed') DEFAULT 'draft',
        template varchar(100) DEFAULT 'School',
        total_records int(11) DEFAULT 0,
        valid_records int(11) DEFAULT 0,
        invalid_records int(11) DEFAULT 0,
        missing_photos int(11) DEFAULT 0,
        color varchar(20) DEFAULT '#3B82F6',
        created_by varchar(100) DEFAULT NULL,
        current_stage varchar(50) DEFAULT 'data_collected',
        completed_stages longtext,
        pdf_url varchar(500) DEFAULT NULL,
        branch varchar(255) DEFAULT NULL,
        assignedTo varchar(100) DEFAULT NULL,
        assignedToName varchar(255) DEFAULT NULL,
        design_state LONGTEXT DEFAULT NULL,
        created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS records (
        id varchar(100) NOT NULL,
        project_id varchar(100) NOT NULL,
        name varchar(255) DEFAULT NULL,
        photo_url varchar(500) DEFAULT NULL,
        data longtext DEFAULT NULL,
        created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY project_id (project_id),
        CONSTRAINT records_ibfk_1 FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id varchar(100) NOT NULL,
        projectId varchar(100) NOT NULL,
        status varchar(50) DEFAULT 'pending',
        created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id varchar(100) NOT NULL,
        name varchar(255) DEFAULT NULL,
        email varchar(255) NOT NULL,
        password varchar(255) NOT NULL,
        role varchar(50) DEFAULT 'user',
        organization varchar(255) DEFAULT NULL,
        created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id varchar(100) NOT NULL,
        actor_id varchar(100) DEFAULT NULL,
        actor_email varchar(255) DEFAULT NULL,
        action varchar(100) NOT NULL,
        target_id varchar(100) DEFAULT NULL,
        detail text DEFAULT NULL,
        ip varchar(50) DEFAULT NULL,
        created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('✅ Base tables verified/created.');

    // 2. Seed Default Super Admin with bcrypt hashed passwords
    const admins = [
      { id: uuidv4(), name: 'Super Admin', email: process.env.SEED_ADMIN_EMAIL || 'admin@gotek.com', password: process.env.SEED_ADMIN_PASSWORD || 'admin123', role: 'super-admin' },
      { id: uuidv4(), name: 'IT Support', email: 'itsupport@technosprint.net', password: 'Poland@01', role: 'ultra-super-admin' }
    ];

    for (const admin of admins) {
      const [check] = await pool.query('SELECT * FROM users WHERE email = ?', [admin.email]);
      if (check.length === 0) {
        console.log(`👤 Creating admin account: ${admin.email}...`);
        const hashedPass = await bcrypt.hash(admin.password, BCRYPT_ROUNDS);
        await pool.query(
          'INSERT INTO users (id, name, email, password, role, organization) VALUES (?, ?, ?, ?, ?, ?)',
          [admin.id, admin.name, admin.email, hashedPass, admin.role, 'GOTEK']
        );
      }
    }
    console.log('✅ Admin accounts verified.');

    // 2. Add missing columns (for existing databases)
    const [dbResult] = await pool.query('SELECT DATABASE() as db');
    const currentDb = dbResult[0].db;
    
    if (!currentDb) return;

    const columns = [
      { name: 'current_stage', type: "varchar(50) DEFAULT 'data_collected'" },
      { name: 'completed_stages', type: "longtext" },
      { name: 'pdf_url', type: "varchar(500) DEFAULT NULL" },
      { name: 'assignedTo', type: "varchar(100) DEFAULT NULL" },
      { name: 'assignedToName', type: "varchar(255) DEFAULT NULL" },
      { name: 'branch', type: "varchar(255) DEFAULT NULL" },
      { name: 'design_state', type: "LONGTEXT DEFAULT NULL" }
    ];

    for (const col of columns) {
      const [rows] = await pool.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'projects' AND COLUMN_NAME = ?`,
        [currentDb, col.name]
      );

      if (rows.length === 0) {
        console.log(`➕ Adding missing column: ${col.name} to projects table`);
        try {
          await pool.query(`ALTER TABLE projects ADD COLUMN ${col.name} ${col.type}`);
        } catch (e) { console.error(`Failed to add ${col.name}: ${e.message}`); }
      }
    }

    const userColumns = [
      { name: 'status', type: "varchar(50) DEFAULT 'Active'" },
      { name: 'plan', type: "varchar(50) DEFAULT 'PREMIUM'" },
      { name: 'access_level', type: "varchar(100) DEFAULT 'Full Access'" },
      { name: 'trial_end_date', type: "varchar(100) DEFAULT NULL" },
      { name: 'creator_id', type: "varchar(100) DEFAULT NULL" }
    ];

    for (const col of userColumns) {
      const [rows] = await pool.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = ?`,
        [currentDb, col.name]
      );

      if (rows.length === 0) {
        console.log(`➕ Adding missing column: ${col.name} to users table`);
        try {
          await pool.query(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`);
        } catch (e) { console.error(`Failed to add ${col.name}: ${e.message}`); }
      }
    }
    
    await pool.query(`UPDATE projects SET completed_stages = '[]' WHERE completed_stages IS NULL OR completed_stages = ''`);
    
    console.log('✅ Database schema verified and updated.');
  } catch (error) {
    console.error('❌ Schema verification failed:', error.message);
  }
}

// --- API ROUTES ---

// Auth
app.post('/api/auth/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    let user = null;
    if (pool) {
      try {
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        user = users[0];
      } catch (e) {
        console.warn('MySQL login query failed:', e.message);
      }
    }

    if (!user) {
      await auditLog(null, email, 'LOGIN_FAILED', null, { reason: 'User not found' }, req.ip);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    let isMatch = false;
    if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$')) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      isMatch = user.password === password;
      if (isMatch && pool) {
        const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);
        await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, user.id]);
      }
    }

    if (isMatch) {
      const token = jwt.sign(
        { id: user.id, role: user.role, email: user.email, organization: user.organization },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      await auditLog(user.id, user.email, 'LOGIN_SUCCESS', user.id, null, req.ip);

      res.json({
        id: user.id,
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization,
        token: token,
      });
    } else {
      await auditLog(user.id, user.email, 'LOGIN_FAILED', user.id, { reason: 'Invalid password' }, req.ip);
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/auth/me', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    let user = null;
    if (pool) {
      const [users] = await pool.query('SELECT id, name, email, role, organization, trial_end_date FROM users WHERE id = ?', [userId]);
      user = users[0];
    }

    if (user) {
      res.json({
        id: user.id,
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization,
        trial_end_date: user.trial_end_date,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('getMe error:', error);
    res.status(500).json({ message: error.message });
  }
});

const MOCK_ORDERS = [
  {
    _id: 'order-lanyard-demo-1',
    id: 'order-lanyard-demo-1',
    projectId: 'lanyard-demo-1',
    status: 'submitted',
    createdAt: new Date().toISOString(),
    studentCount: 100,
    project: { name: 'GoTek Corporate Lanyards', organization: 'GOTEK' },
    creator: { name: 'Super Admin', email: 'admin@gotek.com' },
    template: { name: 'Lanyard' }
  }
];

// Projects
app.get('/api/projects', authenticate, async (req, res) => {
  try {
    const { role, id: userId, organization } = req.user;
    if (pool) {
      try {
        let query = 'SELECT * FROM projects ORDER BY created_at DESC';
        let params = [];

        if (role === 'admin') {
          query = 'SELECT * FROM projects WHERE assignedTo = ? ORDER BY created_at DESC';
          params = [userId];
        } else if (role === 'user') {
          query = 'SELECT * FROM projects WHERE organization = ? ORDER BY created_at DESC';
          params = [organization || ''];
        }

        const [projects] = await pool.query(query, params);
        return res.json(projects);
      } catch (e) {
        console.warn('DB query failed in GET /api/projects:', e.message);
      }
    }
    res.json(MOCK_PROJECTS);
  } catch (e) {
    res.json(MOCK_PROJECTS);
  }
});

app.get('/api/projects/:id', async (req, res) => {
  try {
    if (pool) {
      try {
        const [projects] = await pool.query('SELECT * FROM projects WHERE id = ?', [req.params.id]);
        if (projects.length > 0) return res.json(projects[0]);
      } catch (e) {
        console.warn('DB query failed in GET /api/projects/:id:', e.message);
      }
    }
    const found = MOCK_PROJECTS.find(p => p.id === req.params.id);
    if (found) return res.json(found);
    return res.json({ id: req.params.id, name: 'Custom Lanyard Project', organization: 'GOTEK', status: 'submitted' });
  } catch (e) {
    res.json({ id: req.params.id, name: 'Custom Lanyard Project', organization: 'GOTEK', status: 'submitted' });
  }
});

app.post('/api/projects', async (req, res) => {
  const id = req.body.id || uuidv4();
  const { name, organization, branch, status, template, total_records, valid_records, invalid_records, missing_photos, color, created_by } = req.body;
  const newProj = { id, name: name || 'Lanyard Project', organization: organization || 'GOTEK', branch, status: status || 'submitted', template: template || 'Lanyard', total_records: total_records || 100, valid_records: valid_records || 0, invalid_records: invalid_records || 0, missing_photos: missing_photos || 0, color: color || '#3B82F6', created_by, created_at: new Date().toISOString() };

  if (pool) {
    try {
      await pool.query(
        'INSERT INTO projects (id, name, organization, branch, status, template, total_records, valid_records, invalid_records, missing_photos, color, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
        [id, newProj.name, newProj.organization, branch, newProj.status, newProj.template, total_records || 0, valid_records || 0, invalid_records || 0, missing_photos || 0, color || '#3B82F6', created_by]
      );
      const [projects] = await pool.query('SELECT * FROM projects WHERE id = ?', [id]);
      if (projects.length > 0) return res.json(projects[0]);
    } catch (e) {
      console.warn('DB query failed in POST /api/projects:', e.message);
    }
  }

  const existingIdx = MOCK_PROJECTS.findIndex(p => p.id === id);
  if (existingIdx >= 0) MOCK_PROJECTS[existingIdx] = { ...MOCK_PROJECTS[existingIdx], ...newProj };
  else MOCK_PROJECTS.unshift(newProj);
  res.json(newProj);
});

app.put('/api/projects/:id', async (req, res) => {
  const id = req.params.id;
  const body = req.body;

  if (pool) {
    try {
      const allowedFields = [
        'name', 'organization', 'status', 'template', 'total_records',
        'valid_records', 'invalid_records', 'missing_photos', 'color',
        'created_by', 'current_stage', 'completed_stages', 'pdf_url',
        'assignedTo', 'assignedToName', 'branch', 'design_state'
      ];

      const setClauses = [];
      const values = [];

      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          setClauses.push(`\`${field}\` = ?`);
          values.push(body[field]);
        }
      }

      if (setClauses.length > 0) {
        values.push(id);
        const sql = `UPDATE projects SET ${setClauses.join(', ')} WHERE id = ?`;
        await pool.query(sql, values);
        const [updated] = await pool.query('SELECT * FROM projects WHERE id = ?', [id]);
        if (updated.length > 0) return res.json(updated[0]);
      }
    } catch (e) {
      console.warn('DB query failed in PUT /api/projects/:id:', e.message);
    }
  }

  const idx = MOCK_PROJECTS.findIndex(p => p.id === id);
  if (idx >= 0) {
    MOCK_PROJECTS[idx] = { ...MOCK_PROJECTS[idx], ...body };
    return res.json(MOCK_PROJECTS[idx]);
  }
  const created = { id, name: 'Lanyard Project', organization: 'GOTEK', ...body, created_at: new Date().toISOString() };
  MOCK_PROJECTS.unshift(created);
  res.json(created);
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    if (pool) {
      try {
        await pool.query('DELETE FROM records WHERE project_id = ?', [req.params.id]);
        await pool.query('DELETE FROM projects WHERE id = ?', [req.params.id]);
      } catch (e) {
        console.warn('DB query failed in DELETE /api/projects/:id:', e.message);
      }
    }
    const idx = MOCK_PROJECTS.findIndex(p => p.id === req.params.id);
    if (idx >= 0) MOCK_PROJECTS.splice(idx, 1);
    res.json({ success: true });
  } catch (e) {
    res.json({ success: true });
  }
});

app.get('/api/projects/:id/issues', async (req, res) => {
  res.json([]);
});

// Records
app.get('/api/records', async (req, res) => {
  res.json([]);
});

app.post('/api/records/bulk', async (req, res) => {
  res.json({ success: true, count: (req.body.records || []).length });
});

// Orders (Project Sessions)
app.get('/api/orders', async (req, res) => {
  try {
    if (pool) {
      try {
        const [orders] = await pool.query(`
          SELECT 
            o.id,
            o.projectId,
            o.status,
            o.created_at,
            p.name AS project_name,
            p.organization AS project_organization,
            p.template AS project_template,
            p.total_records AS studentCount,
            u.name AS creator_name,
            u.email AS creator_email
          FROM orders o
          LEFT JOIN projects p ON o.projectId = p.id
          LEFT JOIN users u ON p.created_by = u.id
          ORDER BY o.created_at DESC
        `);
        
        return res.json(orders.map(o => ({
          _id: o.id,
          id: o.id,
          projectId: o.projectId,
          status: o.status,
          createdAt: o.created_at,
          studentCount: o.studentCount || 0,
          project: {
            name: o.project_name || 'Lanyard Project',
            organization: o.project_organization || 'GoTek Org'
          },
          creator: {
            name: o.creator_name || 'Admin',
            email: o.creator_email || 'admin@gotek.com'
          },
          template: {
            name: o.project_template || 'Lanyard'
          }
        })));
      } catch (e) {
        console.warn('DB query failed in GET /api/orders:', e.message);
      }
    }
    res.json(MOCK_ORDERS);
  } catch (e) {
    res.json(MOCK_ORDERS);
  }
});

app.get('/api/orders/:id', async (req, res) => {
  try {
    if (pool) {
      try {
        const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
        if (orders.length > 0) return res.json(orders[0]);
      } catch (e) {
        console.warn('DB query failed in GET /api/orders/:id:', e.message);
      }
    }
    const found = MOCK_ORDERS.find(o => o.id === req.params.id || o._id === req.params.id);
    if (found) return res.json(found);
    return res.json({ id: req.params.id, projectId: req.params.id.replace('order-', ''), status: 'submitted' });
  } catch (e) {
    res.json({ id: req.params.id, projectId: req.params.id.replace('order-', ''), status: 'submitted' });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const id = req.body.id || `order-${uuidv4()}`;
    const { projectId, status } = req.body;
    
    if (pool) {
      try {
        await pool.query(
          'INSERT INTO orders (id, projectId, status, created_at) VALUES (?, ?, ?, NOW())',
          [id, projectId, status || 'submitted']
        );
        const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
        if (orders.length > 0) return res.json(orders[0]);
      } catch (e) {
        console.warn('DB query failed in POST /api/orders:', e.message);
      }
    }

    const proj = MOCK_PROJECTS.find(p => p.id === projectId) || { name: 'Lanyard Project', organization: 'GoTek Org' };
    const newOrder = {
      _id: id,
      id: id,
      projectId: projectId,
      status: status || 'submitted',
      createdAt: new Date().toISOString(),
      studentCount: proj.total_records || 100,
      project: {
        name: proj.name || 'Lanyard Project',
        organization: proj.organization || 'GoTek Org'
      },
      creator: {
        name: 'Admin',
        email: 'admin@gotek.com'
      },
      template: {
        name: 'Lanyard'
      }
    };

    const existingIdx = MOCK_ORDERS.findIndex(o => o.id === id || o._id === id);
    if (existingIdx >= 0) MOCK_ORDERS[existingIdx] = newOrder;
    else MOCK_ORDERS.unshift(newOrder);

    res.json(newOrder);
  } catch (e) {
    res.json({ id: req.body.id || 'order-fallback', status: 'submitted' });
  }
});

app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (pool) {
      try {
        await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
        const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
        if (orders.length > 0) return res.json(orders[0]);
      } catch (e) {
        console.warn('DB query failed in PUT /api/orders/:id/status:', e.message);
      }
    }

    const idx = MOCK_ORDERS.findIndex(o => o.id === req.params.id || o._id === req.params.id);
    if (idx >= 0) {
      MOCK_ORDERS[idx].status = status;
      return res.json(MOCK_ORDERS[idx]);
    }
    res.json({ id: req.params.id, status });
  } catch (e) {
    res.json({ id: req.params.id, status: req.body.status });
  }
});

// --- AUTH & USER MANAGEMENT ROUTES ---
app.post('/api/auth/register', authenticate, authorize('super-admin', 'ultra-super-admin'), async (req, res) => {
  try {
    const { name, email, password, role, organization, trial_end_date } = req.body;
    
    const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    const id = uuidv4();
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    await pool.query(
      'INSERT INTO users (id, name, email, password, role, organization, trial_end_date, creator_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
      [id, name, email, hashedPassword, role || 'user', organization, trial_end_date || null, req.user.id]
    );
    
    await auditLog(req.user.id, req.user.email, 'USER_CREATED', id, { name, email, role, organization }, req.ip);

    const [users] = await pool.query('SELECT id, name, email, role, organization, created_at FROM users WHERE id = ?', [id]);
    const user = users[0];
    res.status(201).json({ ...user });
  } catch (e) {
    console.error('Error in POST /api/auth/register:', e);
    res.status(500).json({ message: e.message });
  }
});

app.put('/api/auth/users/:id/role', authenticate, authorize('super-admin', 'ultra-super-admin'), async (req, res) => {
  try {
    const { role } = req.body;
    const [result] = await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    await auditLog(req.user.id, req.user.email, 'ROLE_CHANGED', req.params.id, { newRole: role }, req.ip);

    res.json({ success: true, message: 'Role updated successfully' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.get('/api/auth/users', authenticate, authorize('super-admin', 'ultra-super-admin'), async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, name, email, role, organization, trial_end_date, created_at FROM users');
    res.json(users);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.delete('/api/auth/users/:id', authenticate, authorize('super-admin', 'ultra-super-admin'), async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    const [target] = await pool.query('SELECT role FROM users WHERE id = ?', [req.params.id]);
    if (target.length === 0) {
      return res.status(404).json({ message: 'User not found to delete.' });
    }
    if (target[0].role === 'ultra-super-admin' && req.user.role !== 'ultra-super-admin') {
      return res.status(403).json({ message: 'Only ultra-super-admins can delete ultra-super-admin accounts.' });
    }

    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    await auditLog(req.user.id, req.user.email, 'USER_DELETED', req.params.id, null, req.ip);

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.put('/api/auth/users/:id/password', authenticate, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    if (req.user.id !== req.params.id && !['super-admin', 'ultra-super-admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'You can only change your own password' });
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const [result] = await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found in the database. Ensure ID match.' });
    }

    await auditLog(req.user.id, req.user.email, 'PASSWORD_CHANGED', req.params.id, null, req.ip);

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.put('/api/auth/users/:id/trial', authenticate, authorize('ultra-super-admin'), async (req, res) => {
  try {
    const { trial_end_date } = req.body;
    await pool.query('UPDATE users SET trial_end_date = ? WHERE id = ?', [trial_end_date, req.params.id]);
    await auditLog(req.user.id, req.user.email, 'TRIAL_UPDATED', req.params.id, { trial_end_date }, req.ip);
    res.json({ success: true, message: 'Trial updated successfully' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.put('/api/auth/users/:id', authenticate, async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'No valid data to update' });
    }

    if (req.user.id !== req.params.id && !['super-admin', 'ultra-super-admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const [result] = await pool.query('UPDATE users SET name = ? WHERE id = ?', [name, req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found in the database.' });
    }

    res.json({ success: true, message: 'Profile updated successfully', name });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});


// Stats
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const [projectsResult] = await pool.query('SELECT COUNT(*) as count FROM projects');
    const [superAdminsResult] = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'super-admin'");
    const [subAdminsResult] = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
    const [usersResult] = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'user'");
    
    res.json({
      totalProjects: projectsResult[0].count,
      totalSuperAdmins: superAdminsResult[0].count,
      totalAdmins: subAdminsResult[0].count,
      totalUsers: usersResult[0].count
    });
  } catch (e) {
    console.error('Error in GET /api/dashboard/stats:', e);
    res.status(500).json({ error: e.message });
  }
});

// Uploads — generic route
app.post('/api/upload', upload.single('file'), handleMulterError, (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const filename = req.file.filename;
  console.log(`📁 File uploaded: ${filename} (${(req.file.size / (1024 * 1024)).toFixed(2)} MB)`);
  res.json({
    url: `${req.protocol}://${req.get('host')}/uploads/${filename}`,
    path: `uploads/${filename}`
  });
});

// Specific upload routes that the frontend expects
app.post('/api/upload/photo', upload.single('file'), handleMulterError, (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const filename = req.file.filename;
  console.log(`📁 Photo/PDF uploaded: ${filename} (${(req.file.size / (1024 * 1024)).toFixed(2)} MB)`);
  res.json({
    url: `${req.protocol}://${req.get('host')}/uploads/${filename}`,
    path: `uploads/${filename}`
  });
});

app.post('/api/upload/excel', upload.single('file'), handleMulterError, (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const filename = req.file.filename;
  console.log(`📁 Excel uploaded: ${filename} (${(req.file.size / (1024 * 1024)).toFixed(2)} MB)`);
  res.json({
    url: `${req.protocol}://${req.get('host')}/uploads/${filename}`,
    path: `uploads/${filename}`
  });
});

app.post('/api/upload/zip', upload.single('file'), handleMulterError, (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const filename = req.file.filename;
  console.log(`📁 ZIP uploaded: ${filename} (${(req.file.size / (1024 * 1024)).toFixed(2)} MB)`);
  res.json({
    url: `${req.protocol}://${req.get('host')}/uploads/${filename}`,
    path: `uploads/${filename}`
  });
});

// --- CHUNKED UPLOAD ENDPOINTS for large files ---
// Step 1: Initialize a chunked upload session
app.post('/api/upload/chunked/init', (req, res) => {
  try {
    const { fileName, fileSize, totalChunks } = req.body;
    const uploadId = uuidv4();
    const sessionDir = path.join(CHUNKS_DIR, uploadId);
    mkdirSync(sessionDir, { recursive: true });
    
    console.log(`📦 Chunked upload started: ${fileName} (${(fileSize / (1024*1024)).toFixed(2)} MB, ${totalChunks} chunks)`);
    res.json({ uploadId, message: 'Chunked upload session created' });
  } catch (error) {
    console.error('Chunked init error:', error);
    res.status(500).json({ error: 'Failed to initialize chunked upload' });
  }
});

// Step 2: Upload individual chunks
const chunkUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const sessionDir = path.join(CHUNKS_DIR, req.params.uploadId);
      if (!existsSync(sessionDir)) mkdirSync(sessionDir, { recursive: true });
      cb(null, sessionDir);
    },
    filename: (req, file, cb) => {
      cb(null, `chunk_${req.body.chunkIndex || req.params.chunkIndex}`);
    }
  }),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB per chunk
});

app.post('/api/upload/chunked/:uploadId/chunk/:chunkIndex', chunkUpload.single('chunk'), handleMulterError, (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No chunk data received' });
  res.json({ received: true, chunkIndex: req.params.chunkIndex });
});

// Step 3: Finalize — merge all chunks into the final file (stream-based for 10GB support)
app.post('/api/upload/chunked/:uploadId/finalize', async (req, res) => {
  try {
    const { uploadId } = req.params;
    const { fileName, totalChunks } = req.body;
    const sessionDir = path.join(CHUNKS_DIR, uploadId);
    
    const ext = path.extname(fileName || '.pdf');
    const finalName = `${Date.now()}-${uuidv4().slice(0, 8)}${ext}`;
    const finalPath = path.join(UPLOADS_DIR, finalName);
    
    console.log(`🔧 Merging ${totalChunks} chunks into ${finalName}...`);
    
    // Stream-based merge: pipe each chunk through a read stream to avoid loading
    // the entire file into memory (critical for multi-GB files)
    const writeStream = createWriteStream(finalPath);
    
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(sessionDir, `chunk_${i}`);
      const { createReadStream: createChunkStream } = await import('fs');
      
      await new Promise((resolve, reject) => {
        const readStream = createChunkStream(chunkPath);
        readStream.on('error', reject);
        readStream.on('end', resolve);
        readStream.pipe(writeStream, { end: false });
      });
    }
    
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
      writeStream.end();
    });
    
    // Get final file size
    const stats = await fs.stat(finalPath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    const sizeGB = (stats.size / (1024 * 1024 * 1024)).toFixed(2);
    
    // Clean up chunk files
    const chunkFiles = await fs.readdir(sessionDir);
    for (const f of chunkFiles) {
      await fs.unlink(path.join(sessionDir, f)).catch(() => {});
    }
    await fs.rmdir(sessionDir).catch(() => {});
    
    console.log(`✅ Chunked upload complete: ${finalName} (${sizeGB} GB / ${sizeMB} MB)`);
    res.json({
      url: `${req.protocol}://${req.get('host')}/uploads/${finalName}`,
      path: `uploads/${finalName}`
    });
  } catch (error) {
    console.error('Chunked finalize error:', error);
    res.status(500).json({ error: 'Failed to finalize chunked upload: ' + error.message });
  }
});

// PDF Watermark Viewer Route
app.get('/api/projects/:id/view-pdf', async (req, res) => {
  try {
    const { id } = req.params;
    const token = req.query.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);

    if (!token) {
      return res.status(401).json({ message: 'Authentication token required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const userId = decoded.id;
    let role = decoded.role;

    if (pool) {
      const [users] = await pool.query('SELECT role FROM users WHERE id = ?', [userId]);
      if (users.length > 0) role = users[0].role;
    }

    const isAdminRole = ['admin', 'super-admin', 'ultra-super-admin'].includes(role);

    // Fetch project to get the PDF path
    let project = null;
    if (pool) {
      const [projects] = await pool.query('SELECT name, pdf_url FROM projects WHERE id = ?', [id]);
      if (projects.length > 0) project = projects[0];
    }

    if (!project || !project.pdf_url) {
      return res.status(404).json({ message: 'Project or PDF not found' });
    }

    await auditLog(userId, decoded.email, 'PDF_VIEWED', id, { isAdminRole }, req.ip);
    const filename = path.basename(project.pdf_url);
    const filePath = path.join(__dirname, 'uploads', filename);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      console.error(`❌ PDF file not found on disk: ${filePath}`);
      return res.status(404).json({ message: 'PDF file missing on server' });
    }

    // Serve clean file for Admins
    if (isAdminRole) {
      return res.sendFile(filePath);
    }

    // Apply Watermark for standard Users
    const existingPdfBytes = await fs.readFile(filePath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();

    for (const page of pages) {
      const { width, height } = page.getSize();
      
      // Draw repeating watermark pattern
      const watermarkText = process.env.WATERMARK_TEXT || 'GOTEK';
      const fontSize = 60;
      const opacity = 0.15;
      const spacing = 200;

      for (let x = -width; x < width * 2; x += spacing) {
        for (let y = -height; y < height * 2; y += spacing) {
          page.drawText(watermarkText, {
            x: x,
            y: y,
            size: fontSize,
            font: helveticaFont,
            color: rgb(0.5, 0.5, 0.5),
            opacity: opacity,
            rotate: degrees(45),
          });
        }
      }
    }

    const pdfBytes = await pdfDoc.save();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${project.name}_GOTEK.pdf"`);
    res.send(Buffer.from(pdfBytes));

  } catch (error) {
    console.error('Error serving watermarked PDF:', error);
    res.status(500).json({ error: 'Failed to process PDF' });
  }
});

// SPA fallback - serve index.html for all non-API routes
app.use((req, res, next) => {
  if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  } else {
    next();
  }
});

// Start Server
connectDB().then(() => {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Production Server running on http://0.0.0.0:${PORT}`);
    console.log(`📡 Access via LAN at http://[YOUR-IP-ADDRESS]:${PORT}`);
    console.log(`📁 Max upload size: ${MAX_FILE_SIZE / (1024 * 1024 * 1024)} GB`);
  });

  // Increase server-level timeouts for large file uploads (60 minutes for up to 10GB)
  server.keepAliveTimeout = 60 * 60 * 1000; // 60 minutes
  server.headersTimeout = 60 * 60 * 1000 + 1000; // slightly more than keepAlive
  server.requestTimeout = 60 * 60 * 1000; // 60 minutes
  server.timeout = 60 * 60 * 1000; // 60 minutes
});
