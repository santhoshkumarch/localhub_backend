const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Simple CORS - allow all origins
app.use(cors());
app.use(express.json());

// Initialize database
const initDatabase = async () => {
  try {
    const initSQL = fs.readFileSync(path.join(__dirname, 'config', 'init.sql'), 'utf8');
    await pool.query(initSQL);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
};

// Health check endpoints
app.get('/', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'LocalHub Admin Backend', timestamp: new Date().toISOString() });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/businesses', require('./routes/businesses'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/districts', require('./routes/districts'));
app.use('/api/hashtags', require('./routes/hashtags'));

// Start server
const startServer = async () => {
  try {
    if (process.env.DATABASE_URL || process.env.DB_HOST) {
      await initDatabase();
    } else {
      console.log('No database configuration found, skipping database initialization');
    }
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`LocalHub Admin Backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server startup error:', error);
    process.exit(1);
  }
};

startServer();