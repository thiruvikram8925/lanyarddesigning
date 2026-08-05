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

dotenv.config();

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
const MAX_FILE_SIZE = 10 * 1024 * 1024 * 1024; // 10GB

// MySQL Configuration
const MYSQL_HOST = process.env.MYSQL_HOST || 'localhost';
const MYSQL_USER = process.env.MYSQL_USER || 'root';
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || '';
const MYSQL_DATABASE = process.env.MYSQL_DATABASE || 'gotek';
const MYSQL_PORT = process.env.MYSQL_PORT || 3308; // Configured for XAMPP port 3308

app.use(cors());
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend build files
app.use(express.static(path.join(__dirname, 'dist')));

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

    console.log('✅ Base tables verified/created.');

    // 2. Seed Default Super Admin
    const admins = [
      { id: uuidv4(), name: 'Super Admin', email: 'admin@gotek.com', password: 'admin123', role: 'super-admin' },
      { id: uuidv4(), name: 'IT Support', email: 'itsupport@technosprint.net', password: 'Poland@01', role: 'ultra-super-admin' }
    ];

    for (const admin of admins) {
      const [check] = await pool.query('SELECT * FROM users WHERE email = ?', [admin.email]);
      if (check.length === 0) {
        console.log(`👤 Creating admin account: ${admin.email}...`);
        await pool.query(
          'INSERT INTO users (id, name, email, password, role, organization) VALUES (?, ?, ?, ?, ?, ?)',
          [admin.id, admin.name, admin.email, admin.password, admin.role, 'GOTEK']
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
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = users[0];
    
    // In a real app, use bcrypt to verify password
    if (user && user.password === password) {
      res.json({
        id: user.id,
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization,
        token: 'fake-jwt-token-for-dev-' + user.id,
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    
    // We used a fake token format: fake-jwt-token-for-dev-{userId}
    const userId = token.replace('fake-jwt-token-for-dev-', '');
    
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    const user = users[0];
    
    if (user) {
      res.json({
        id: user.id,
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('getMe error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Projects
app.get('/api/projects', async (req, res) => {
  try {
    const [projects] = await pool.query('SELECT * FROM projects ORDER BY created_at DESC');
    res.json(projects);
  } catch (e) {
    console.error('Error in GET /api/projects:', e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/projects/:id', async (req, res) => {
  try {
    const [projects] = await pool.query('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    if (projects.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(projects[0]);
  } catch (e) {
    console.error('Error in GET /api/projects/:id:', e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const id = req.body.id || uuidv4();
    const { name, organization, branch, status, template, total_records, valid_records, invalid_records, missing_photos, color, created_by } = req.body;
    
    await pool.query(
      'INSERT INTO projects (id, name, organization, branch, status, template, total_records, valid_records, invalid_records, missing_photos, color, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
      [id, name, organization, branch, status, template, total_records || 0, valid_records || 0, invalid_records || 0, missing_photos || 0, color || '#3B82F6', created_by]
    );
    
    const [projects] = await pool.query('SELECT * FROM projects WHERE id = ?', [id]);
    res.json(projects[0]);
  } catch (e) {
    console.error('Error in POST /api/projects:', e);
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/projects/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const body = req.body;

    // Only update fields that are actually present in the request body
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

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(id);
    const sql = `UPDATE projects SET ${setClauses.join(', ')} WHERE id = ?`;
    
    await pool.query(sql, values);
    
    // Return the updated project
    const [updated] = await pool.query('SELECT * FROM projects WHERE id = ?', [id]);
    res.json(updated[0] || { success: true });
  } catch (e) {
    console.error('Error in PUT /api/projects:', e);
    res.status(500).json({ error: e.message, message: e.message });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    const id = req.params.id;
    
    // 1. Fetch project info to get pdf_url
    const [projects] = await pool.query('SELECT pdf_url FROM projects WHERE id = ?', [id]);
    
    // 2. Fetch record photo URLs
    const [records] = await pool.query('SELECT photo_url FROM records WHERE project_id = ?', [id]);

    // 3. Construct list of files to delete
    const filesToDelete = [];
    if (projects.length > 0 && projects[0].pdf_url) {
      filesToDelete.push(projects[0].pdf_url);
    }
    records.forEach(r => {
      if (r.photo_url) filesToDelete.push(r.photo_url);
    });

    // 4. Delete files from disk
    for (const url of filesToDelete) {
      try {
        // Extract filename from URL/path
        const filename = path.basename(url);
        const filePath = path.join(__dirname, 'uploads', filename);
        
        await fs.unlink(filePath);
        console.log(`🗑️  Successfully deleted file: ${filename}`);
      } catch (err) {
        // Common case: file might have already been deleted or never uploaded
        if (err.code !== 'ENOENT') {
          console.warn(`⚠️  Failed to delete file ${url}:`, err.message);
        }
      }
    }
    
    // 5. Delete associated records from DB
    await pool.query('DELETE FROM records WHERE project_id = ?', [id]);
    
    // 6. Delete project from DB
    const [result] = await pool.query('DELETE FROM projects WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json({ success: true, cleanUp: { filesChecked: filesToDelete.length } });
  } catch (e) {
    console.error('Error in DELETE /api/projects:', e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/projects/:id/issues', async (req, res) => {
  try {
    const projectId = req.params.id;
    const [issues] = await pool.query(
      'SELECT * FROM records WHERE project_id = ? AND (photo_url IS NULL OR photo_url = ?)',
      [projectId, '']
    );
    res.json(issues.map(i => ({
      id: i.id,
      recordId: i.id,
      record: i.name || 'Unnamed Record',
      message: 'Missing photo',
      severity: 'warning',
      fixable: true
    })));
  } catch (e) {
    console.error('Error in GET /api/projects/:id/issues:', e);
    res.status(500).json({ error: e.message });
  }
});

// Records
app.get('/api/records', async (req, res) => {
  try {
    const { projectId } = req.query;
    let query = 'SELECT * FROM records';
    let params = [];
    
    if (projectId) {
      query += ' WHERE project_id = ?';
      params.push(projectId);
    }
    
    const [records] = await pool.query(query, params);
    res.json(records);
  } catch (e) {
    console.error('Error in GET /api/records:', e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/records/bulk', async (req, res) => {
  try {
    const { projectId, records } = req.body;
    
    for (const r of records) {
      const id = r.id || uuidv4();
      const { name, photo_url, data } = r;
      const jsonData = typeof data === 'object' ? JSON.stringify(data) : data;
      
      await pool.query(
        'INSERT INTO records (id, project_id, name, photo_url, data, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [id, projectId, name, photo_url, jsonData]
      );
    }
    
    res.json({ success: true, count: records.length });
  } catch (e) {
    console.error('Error in POST /api/records/bulk:', e);
    res.status(500).json({ error: e.message });
  }
});

// Orders (Project Sessions)
app.get('/api/orders', async (req, res) => {
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
    
    res.json(orders.map(o => ({
      _id: o.id,
      id: o.id,
      projectId: o.projectId,
      status: o.status,
      createdAt: o.created_at,
      studentCount: o.studentCount || 0,
      project: {
        name: o.project_name || 'Unnamed Project',
        organization: o.project_organization || 'Unknown Org'
      },
      creator: {
        name: o.creator_name || 'System',
        email: o.creator_email || 'N/A'
      },
      template: {
        name: o.project_template || 'Default'
      }
    })));
  } catch (e) {
    console.error('Error in GET /api/orders:', e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/orders/:id', async (req, res) => {
  try {
    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (orders.length === 0) {
      return res.json({
        id: req.params.id,
        projectId: req.params.id.replace('order-', ''),
        status: 'draft',
        totalCards: 0
      });
    }
    res.json(orders[0]);
  } catch (e) {
    console.error('Error in GET /api/orders/:id:', e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const id = req.body.id || `order-${uuidv4()}`;
    const { projectId, status } = req.body;
    
    await pool.query(
      'INSERT INTO orders (id, projectId, status, created_at) VALUES (?, ?, ?, NOW())',
      [id, projectId, status || 'pending']
    );
    
    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    res.json(orders[0]);
  } catch (e) {
    console.error('Error in POST /api/orders:', e);
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    await pool.query(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, req.params.id]
    );
    
    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    res.json(orders[0]);
  } catch (e) {
    console.error('Error in PUT /api/orders/:id/status:', e);
    res.status(500).json({ error: e.message });
  }
});

// --- AUTH ROUTES ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role, organization } = req.body;
    
    // Check if user exists
    const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    const id = uuidv4();
    await pool.query(
      'INSERT INTO users (id, name, email, password, role, organization, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [id, name, email, password, role || 'user', organization]
    );
    
    const [users] = await pool.query('SELECT id, name, email, role, organization, created_at FROM users WHERE id = ?', [id]);
    const user = users[0];
    res.status(201).json({ ...user, token: `fake-jwt-token-${user.id}` });
  } catch (e) {
    console.error('Error in POST /api/auth/register:', e);
    res.status(500).json({ message: e.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (users.length > 0 && users[0].password === password) {
      const { password: _, ...userWithoutPass } = users[0];
      res.json({ ...userWithoutPass, token: `fake-jwt-token-${users[0].id}` });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const userId = token.replace('fake-jwt-token-', '');
    
    if (!userId) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const [users] = await pool.query('SELECT id, name, email, role, organization, created_at FROM users WHERE id = ?', [userId]);

    if (users.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }

    res.json(users[0]);
  } catch (e) {
    console.error('Error in GET /api/auth/me:', e);
    res.status(500).json({ message: e.message });
  }
});

app.put('/api/auth/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    const [result] = await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ success: true, message: 'Role updated successfully' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.get('/api/auth/users', async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, name, email, role, organization, created_at FROM users');
    res.json(users);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.delete('/api/auth/users/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found to delete.' });
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.put('/api/auth/users/:id/password', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const [result] = await pool.query('UPDATE users SET password = ? WHERE id = ?', [password, req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found in the database. Ensure ID match.' });
    }

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.put('/api/auth/users/:id', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'No valid data to update' });
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
    const { token } = req.query;

    if (!token) {
      return res.status(401).json({ message: 'Authentication token required' });
    }

    // Identify user and role from token
    const userId = token.replace('fake-jwt-token-', '');
    const [users] = await pool.query('SELECT role FROM users WHERE id = ?', [userId]);
    
    if (users.length === 0) {
      console.warn(`⚠️  Unauthorized PDF access attempt. Token: ${token}, Extracted ID: ${userId}`);
      return res.status(401).json({ message: 'Invalid user or token' });
    }
    
    const role = users[0].role;
    const isAdminRole = ['admin', 'super-admin', 'ultra-super-admin'].includes(role);

    // Fetch project to get the PDF path
    const [projects] = await pool.query('SELECT name, pdf_url FROM projects WHERE id = ?', [id]);
    if (projects.length === 0 || !projects[0].pdf_url) {
      return res.status(404).json({ message: 'Project or PDF not found' });
    }

    const project = projects[0];
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
      const watermarkText = 'GOTEK';
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
