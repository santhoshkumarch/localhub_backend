const pool = require('../config/database');

const getHashtags = async (req, res) => {
  try {
    const query = `
      SELECT h.*, COUNT(ph.post_id) as usage_count
      FROM hashtags h
      LEFT JOIN post_hashtags ph ON h.id = ph.hashtag_id
      GROUP BY h.id
      ORDER BY h.created_at DESC
    `;
    
    const result = await pool.query(query);
    
    const hashtags = result.rows.map(hashtag => ({
      id: hashtag.id,
      name: hashtag.name,
      color: hashtag.color,
      createdAt: hashtag.created_at,
      usageCount: parseInt(hashtag.usage_count) || 0
    }));
    
    res.json(hashtags);
  } catch (error) {
    console.error('Get hashtags error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createHashtag = async (req, res) => {
  try {
    const { name, color } = req.body;
    
    // Clean the hashtag name
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    const query = `
      INSERT INTO hashtags (name, color)
      VALUES ($1, $2)
      RETURNING *
    `;
    
    const result = await pool.query(query, [cleanName, color || 'blue']);
    
    res.status(201).json({ 
      message: 'Hashtag created successfully', 
      hashtag: result.rows[0] 
    });
  } catch (error) {
    console.error('Create hashtag error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Hashtag already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

const updateHashtag = async (req, res) => {
  try {
    const { name, color } = req.body;
    
    const query = `
      UPDATE hashtags 
      SET name = $1, color = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;
    
    const result = await pool.query(query, [name, color, req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Hashtag not found' });
    }
    
    res.json({ 
      message: 'Hashtag updated successfully', 
      hashtag: result.rows[0] 
    });
  } catch (error) {
    console.error('Update hashtag error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteHashtag = async (req, res) => {
  try {
    // First, remove hashtag associations from posts
    await pool.query('DELETE FROM post_hashtags WHERE hashtag_id = $1', [req.params.id]);
    
    // Then delete the hashtag
    const query = 'DELETE FROM hashtags WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Hashtag not found' });
    }
    
    res.json({ message: 'Hashtag deleted successfully' });
  } catch (error) {
    console.error('Delete hashtag error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getHashtagById = async (req, res) => {
  try {
    const query = `
      SELECT h.*, COUNT(ph.post_id) as usage_count
      FROM hashtags h
      LEFT JOIN post_hashtags ph ON h.id = ph.hashtag_id
      WHERE h.id = $1
      GROUP BY h.id
    `;
    
    const result = await pool.query(query, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Hashtag not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get hashtag error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getPopularHashtags = async (req, res) => {
  try {
    const query = `
      SELECT h.*, COUNT(ph.post_id) as usage_count
      FROM hashtags h
      LEFT JOIN post_hashtags ph ON h.id = ph.hashtag_id
      GROUP BY h.id
      HAVING COUNT(ph.post_id) > 0
      ORDER BY usage_count DESC
      LIMIT 20
    `;
    
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Get popular hashtags error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { 
  getHashtags, 
  createHashtag, 
  updateHashtag, 
  deleteHashtag, 
  getHashtagById, 
  getPopularHashtags 
};