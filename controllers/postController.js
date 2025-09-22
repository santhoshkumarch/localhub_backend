const pool = require('../config/database');

const getPosts = async (req, res) => {
  try {
    const { search, status, category, authorType } = req.query;
    let query = `
      SELECT p.*, 
             COALESCE(b.name, u.name) as author_name,
             CASE 
               WHEN p.business_id IS NOT NULL THEN 'business'
               ELSE 'individual'
             END as author_type,
             COUNT(DISTINCT l.id) as likes_count,
             COUNT(DISTINCT c.id) as comments_count,
             COUNT(DISTINCT s.id) as shares_count
      FROM posts p
      LEFT JOIN businesses b ON p.business_id = b.id
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN likes l ON p.id = l.post_id
      LEFT JOIN comments c ON p.id = c.post_id
      LEFT JOIN shares s ON p.id = s.post_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      query += ` AND (p.title ILIKE $${paramCount} OR p.content ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (status && status !== 'all') {
      paramCount++;
      query += ` AND p.status = $${paramCount}`;
      params.push(status);
    }

    if (category && category !== 'all') {
      paramCount++;
      query += ` AND p.category = $${paramCount}`;
      params.push(category);
    }

    if (authorType && authorType !== 'all') {
      paramCount++;
      if (authorType === 'business') {
        query += ` AND p.business_id IS NOT NULL`;
      } else {
        query += ` AND p.business_id IS NULL`;
      }
    }

    query += ` GROUP BY p.id, b.name, u.name ORDER BY p.created_at DESC`;

    const result = await pool.query(query, params);
    
    const posts = result.rows.map(post => ({
      id: post.id,
      title: post.title,
      content: post.content,
      author: post.author_name,
      authorType: post.author_type,
      category: post.category,
      hashtags: (() => {
        if (!post.hashtags) return [];
        try {
          return JSON.parse(post.hashtags);
        } catch (e) {
          // If hashtags is not valid JSON, treat it as a comma-separated string
          return typeof post.hashtags === 'string' ? post.hashtags.split(',').map(tag => tag.trim()) : [];
        }
      })(),
      likes: parseInt(post.likes_count) || 0,
      comments: parseInt(post.comments_count) || 0,
      shares: parseInt(post.shares_count) || 0,
      status: post.status,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      imageUrl: post.image_url,
      viewDuration: post.view_duration,
      expiresAt: post.expires_at,
      viewLimit: post.view_limit,
      currentViews: post.current_views || 0,
      assignedLabel: post.assigned_label,
      menuId: post.menu_id
    }));

    res.json(posts);
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getPostById = async (req, res) => {
  try {
    const query = `
      SELECT p.*, 
             COALESCE(b.name, u.name) as author_name,
             CASE 
               WHEN p.business_id IS NOT NULL THEN 'business'
               ELSE 'individual'
             END as author_type
      FROM posts p
      LEFT JOIN businesses b ON p.business_id = b.id
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = $1
    `;
    
    const result = await pool.query(query, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updatePostStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const query = `
      UPDATE posts 
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [status, req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    res.json({ 
      message: 'Post status updated successfully', 
      post: result.rows[0] 
    });
  } catch (error) {
    console.error('Update post status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const setPostDuration = async (req, res) => {
  try {
    const { viewDuration } = req.body;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + viewDuration);
    
    const query = `
      UPDATE posts 
      SET view_duration = $1, expires_at = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;
    
    const result = await pool.query(query, [viewDuration, expiresAt, req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    res.json({ 
      message: 'Post duration set successfully', 
      post: result.rows[0] 
    });
  } catch (error) {
    console.error('Set post duration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const setPostViewLimit = async (req, res) => {
  try {
    const { viewLimit } = req.body;
    
    const query = `
      UPDATE posts 
      SET view_limit = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [viewLimit, req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    res.json({ 
      message: 'Post view limit set successfully', 
      post: result.rows[0] 
    });
  } catch (error) {
    console.error('Set post view limit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const assignPostLabel = async (req, res) => {
  try {
    const { menuId, assignedLabel } = req.body;
    
    const query = `
      UPDATE posts 
      SET menu_id = $1, assigned_label = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;
    
    const result = await pool.query(query, [menuId, assignedLabel, req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    res.json({ 
      message: 'Post label assigned successfully', 
      post: result.rows[0] 
    });
  } catch (error) {
    console.error('Assign post label error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createPost = async (req, res) => {
  try {
    const { 
      title, content, category, hashtags, userId, businessId, imageUrl 
    } = req.body;
    
    const query = `
      INSERT INTO posts (
        title, content, category, hashtags, user_id, business_id, 
        image_url, status, current_views
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', 0)
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      title, content, category, JSON.stringify(hashtags || []),
      userId, businessId, imageUrl
    ]);
    
    res.status(201).json({ 
      message: 'Post created successfully', 
      post: result.rows[0] 
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deletePost = async (req, res) => {
  try {
    const query = 'DELETE FROM posts WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { 
  getPosts, 
  getPostById, 
  updatePostStatus, 
  setPostDuration, 
  setPostViewLimit, 
  assignPostLabel, 
  createPost, 
  deletePost 
};