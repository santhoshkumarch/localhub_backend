const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    // Allow localhost, Vercel, and Railway domains
    if (origin.includes('localhost') || 
        origin.includes('vercel.app') || 
        origin.includes('railway.app') ||
        origin.includes('localhubbackend-production.up.railway.app')) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());

// Handle preflight requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Initialize database
const initDatabase = async () => {
  try {
    if (!process.env.DATABASE_URL && !process.env.DB_HOST) {
      console.log('No database configuration found, skipping initialization');
      return;
    }
    
    // Test connection first
    await pool.query('SELECT NOW()');
    console.log('Database connection successful');
    
    const initSQL = fs.readFileSync(path.join(__dirname, 'config', 'init.sql'), 'utf8');
    await pool.query(initSQL);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error.message);
  }
};

// Health check endpoints
app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'LocalHub Admin Backend', 
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/test-db', async (req, res) => {
  try {
    if (!process.env.DATABASE_URL && !process.env.DB_HOST) {
      return res.json({ 
        status: 'No database configured',
        message: 'Add PostgreSQL database to Railway project'
      });
    }
    
    const result = await pool.query('SELECT NOW()');
    
    // Check if tables exist
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'businesses', 'posts', 'admin_users')
    `);
    
    res.json({ 
      status: 'Database connected', 
      time: result.rows[0].now,
      tables: tablesResult.rows.map(row => row.table_name)
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'Database connection failed', 
      error: error.message,
      solution: 'Add PostgreSQL database to your Railway project'
    });
  }
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/otp', require('./routes/otp'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/users', require('./routes/users'));
app.use('/api/businesses', require('./routes/businesses'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/districts', require('./routes/districts'));
app.use('/api/hashtags', require('./routes/hashtags'));
app.use('/api/menus', require('./routes/menus'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/migrate', require('./routes/migrate'));
app.use('/api/migration', require('./routes/migration'));

// Start server
const startServer = async () => {
  try {
    // Start server first
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`LocalHub Admin Backend running on port ${PORT}`);
      console.log(`Health check available at http://0.0.0.0:${PORT}/`);
    });
    
    // Initialize database after server starts (non-blocking)
    if (process.env.DATABASE_URL || process.env.DB_HOST) {
      initDatabase().catch(error => {
        console.error('Database initialization failed:', error);
      });
    } else {
      console.log('No database configuration found, skipping database initialization');
    }
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('Process terminated');
      });
    });
  } catch (error) {
    console.error('Server startup error:', error);
    process.exit(1);
  }
};

startServer();