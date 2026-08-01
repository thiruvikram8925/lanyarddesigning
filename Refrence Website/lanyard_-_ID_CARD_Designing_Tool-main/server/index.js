/**
 * server/index.js — Application bootstrap.
 * All route logic lives in controllers/; middleware in middleware/.
 */
import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { fileURLToPath } from 'url';

// Internal modules
import fashnTryOnRouter               from './fashnTryOn.js';
import authRouter                     from './routes/auth.js';
import { errorHandler }               from './middleware/errorHandler.js';
import { getTemplates }               from './controllers/templateController.js';
import { uploadFile, createDesignRequest } from './controllers/orderController.js';
import logger                         from './utils/logger.js';

// ─── Path helpers ───────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const uploadDir  = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

// ─── Cloudinary ─────────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Multer (LANYARD-202: restricted MIME types, 5 MB cap) ──────────────────
const ALLOWED_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']);
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.bin';
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    ALLOWED_MIMES.has(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, and SVG are allowed.'));
  },
});

// ─── CORS (LANYARD-203: explicit allowlist) ──────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:4173'];

// ─── App ─────────────────────────────────────────────────────────────────────
const app = express();

app.use(cors({
  origin: (origin, cb) => {
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
    ) {
      cb(null, true);
    } else {
      cb(new Error('CORS: Origin not allowed.'));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static(uploadDir));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api',      fashnTryOnRouter);
app.use('/api/auth', authRouter);           // LANYARD-201: JWT auth

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, message: 'Lanyard configurator API is running.' });
});

app.get('/api/templates',        getTemplates);              // LANYARD-301
app.post('/api/uploads', upload.single('file'), uploadFile); // LANYARD-301
app.post('/api/design-requests', createDesignRequest);       // LANYARD-301

// ─── Global error handler (LANYARD-303: last middleware, 4 args) ─────────────
app.use(errorHandler);

// ─── Server ──────────────────────────────────────────────────────────────────
const port = process.env.PORT || 4001;
app.listen(port, () => {
  logger.info(`Lanyard configurator API listening on http://localhost:${port}`);
});