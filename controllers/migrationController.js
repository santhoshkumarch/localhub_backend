const pool = require('../config/database');

const runEngagementMigration = async (req, res) => {
  try {
    console.log('Running engagement migration...');
    
    // Add columns to posts table
    await pool.query(`
      ALTER TABLE posts 
      ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0
    `);
    
    // Create post_likes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS post_likes (
        id SERIAL PRIMARY KEY,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(post_id, user_id)
      )
    `);
    
    // Create post_comments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS post_comments (
        id SERIAL PRIMARY KEY,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        comment TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create indexes
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id)`);
    
    // Initialize existing posts with demo data
    await pool.query(`
      UPDATE posts SET 
        likes_count = FLOOR(RANDOM() * 50),
        comments_count = FLOOR(RANDOM() * 20),
        views_count = FLOOR(RANDOM() * 100) + 10
      WHERE likes_count = 0
    `);
    
    console.log('Migration completed successfully!');
    res.json({ 
      success: true, 
      message: 'Engagement tables created and posts updated with demo data' 
    });
    
  } catch (error) {
    console.error('Migration failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Migration failed', 
      error: error.message 
    });
  }
};

module.exports = { runEngagementMigration };