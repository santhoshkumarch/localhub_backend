const express = require('express');
const pool = require('../config/database');

const router = express.Router();

router.post('/add-media-urls', async (req, res) => {
  try {
    // Add media_urls column to posts table
    await pool.query(`
      ALTER TABLE posts 
      ADD COLUMN IF NOT EXISTS media_urls JSONB DEFAULT '[]'
    `);
    
    // Update existing posts to have empty media_urls array
    await pool.query(`
      UPDATE posts SET media_urls = '[]' WHERE media_urls IS NULL
    `);
    
    res.json({ 
      success: true, 
      message: 'Database migration completed successfully - added media_urls column to posts table' 
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Migration failed', 
      error: error.message 
    });
  }
});

module.exports = router;