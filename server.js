// server.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');

const pool = require('./config/database'); // your DB pool

const app = express();
const PORT = process.env.PORT || 5000;

// ---------- Configuration ----------
// Allowed origins can be a comma separated list in .env e.g.
// ALLOWED_ORIGINS=https://localhub-admin.vercel.app,http://localhost:3000
const allowedOriginsEnv = process.env.ALLOWED_ORIGINS || '';
const allowedOrigins = allowedOriginsEnv.split(',').map(s => s.trim()).filter(Boolean);

// Should server allow cookies/auth?
// Set CORS_ALLOW_CREDENTIALS=true in .env if you want credentials: true
const CORS_ALLOW_CREDENTIALS = (process.env.CORS_ALLOW_CREDENTIALS || 'false').toLowerCase() === 'true';

// ---------- App settings ----------
app.set('trust proxy', true); // useful when running behind proxies (Railway, Vercel, etc.)
app.use(helmet()); // basic security headers
app.use(morgan('combined')); // request logging

// ---------- CORS middleware ----------
// Apply CORS as early as possible
const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin (e.g., curl, mobile apps, server-to-server)
    if (!origin) return callback(null, true);

    // if ALLOWED_ORIGINS is empty, refuse unknown origins (safer than wildcard)
    if (allowedOrigins.length === 0) {
      return callback(new Error('No allowed origins configured'), false);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      // allowed
      return callback(null, true);
    } else {
      return callback(new Error(`Origin ${origin} not allowed by CORS`), false);
    }
  },
  credentials: CORS_ALLOW_CREDENTIALS,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// handle preflight explicitly for all routes (good for some platforms)
app.options('*', cors(corsOptions));

// ---------- Body parsing ----------
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ---------- Simple logging middleware for preflight + debug ----------
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    console.log(`[CORS PRELIGHT] ${req.method} ${req.path} Origin: ${req.headers.origin}`);
  }
  next();
});

// ---------- Initialize DB (if configured) ----------
const initDatabase = async () => {
  try {
    const initSqlPath = path.join(__dirname, 'config', 'init.sql');
    if (!fs.existsSync(initSqlPath)) {
      console.warn('No init.sql file found at', initSqlPath);
      return;
    }
    const initSQL = fs.readFileSync(initSqlPath, 'utf8');
    await pool.query(initSQL);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    // Do not throw - we want server to start even if init step fails in some deployments
  }
};

// ---------- Routes (import after CORS + body parsers) ----------
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'LocalHub Admin Backend',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Mount your routers. Ensure these files exist:
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/businesses', require('./routes/businesses'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/districts', require('./routes/districts'));
app.use('/api/hashtags', require('./routes/hashtags'));

// ---------- Error handling ----------
app.use((err, req, res, next) => {
  // CORS errors thrown by the cors middleware show up here
  if (err && err.message && err.message.startsWith('Origin')) {
    console.warn('CORS error:', err.message);
    return res.status(403).json({ error: 'CORS error', message: err.message });
  }

  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// ---------- Start server ----------
const startServer = async () => {
  try {
    // Only try DB init if DB is configured
    if (process.env.DATABASE_URL || process.env.DB_HOST) {
      await initDatabase();
    } else {
      console.log('No database configuration found; skipping DB initialization');
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`LocalHub Admin Backend running on port ${PORT}`);
      console.log(`Allowed CORS origins: ${allowedOrigins.length ? allowedOrigins.join(', ') : 'none (set ALLOWED_ORIGINS in .env)'}`);
      console.log(`CORS credentials allowed: ${CORS_ALLOW_CREDENTIALS}`);
    });
  } catch (error) {
    console.error('Server startup error:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
