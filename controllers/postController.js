const pool = require('../config/database');

const createPost = async (req, res) => {
  try {
    const { title, content, menuId, assignedLabel, phoneNumber, mediaUrls } = req.body;
    
    if (!title || !content || !menuId || !phoneNumber) {
      return res.status(400).json({ message: 'Title, content, menu, and phone number are required' });
    }
    
    // Get user by phone number
    const userQuery = 'SELECT id, profile_type, business_name, name FROM users WHERE phone = $1';
    const userResult = await pool.query(userQuery, [phoneNumber]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Create post with media support
    const postQuery = `
      INSERT INTO posts (title, content, menu_id, assigned_label, user_id, media_urls, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'approved')
      RETURNING id, title, content, menu_id, assigned_label, user_id, media_urls, status, created_at
    `;
    
    const postResult = await pool.query(postQuery, [
      title, content, menuId, assignedLabel, user.id, JSON.stringify(mediaUrls || [])
    ]);
    
    const post = postResult.rows[0];
    
    res.status(201).json({
      message: 'Post created successfully',
      post: {
        id: post.id,
        title: post.title,
        content: post.content,
        menuId: post.menu_id,
        assignedLabel: post.assigned_label,
        userId: post.user_id,
        mediaUrls: JSON.parse(post.media_urls || '[]'),
        status: post.status,
        createdAt: post.created_at,
        authorType: user.profile_type,
        authorName: user.business_name || user.name || 'User'
      }
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getUserPosts = async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    
    const query = `
      SELECT p.*, m.name as menu_name, m.icon as menu_icon, u.name, u.business_name, u.profile_type
      FROM posts p
      JOIN menus m ON p.menu_id = m.id
      JOIN users u ON p.user_id = u.id
      WHERE u.phone = $1
      ORDER BY p.created_at DESC
    `;
    
    const result = await pool.query(query, [phoneNumber]);
    
    const posts = result.rows.map(post => ({
      id: post.id,
      title: post.title,
      content: post.content,
      menuId: post.menu_id,
      menuName: post.menu_name,
      menuIcon: post.menu_icon,
      assignedLabel: post.assigned_label,
      mediaUrls: JSON.parse(post.media_urls || '[]'),
      status: post.status,
      createdAt: post.created_at,
      authorName: post.business_name || post.name || 'User',
      authorType: post.profile_type
    }));
    
    res.json(posts);
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAllPosts = async (req, res) => {
  try {
    const query = `
      SELECT p.*, m.name as menu_name, m.icon as menu_icon, u.name, u.business_name, u.profile_type
      FROM posts p
      JOIN menus m ON p.menu_id = m.id
      JOIN users u ON p.user_id = u.id
      WHERE p.status = 'approved'
      ORDER BY p.created_at DESC
      LIMIT 50
    `;
    
    const result = await pool.query(query);
    
    const posts = result.rows.map(post => ({
      id: post.id,
      title: post.title,
      content: post.content,
      menuId: post.menu_id,
      menuName: post.menu_name,
      menuIcon: post.menu_icon,
      assignedLabel: post.assigned_label,
      mediaUrls: JSON.parse(post.media_urls || '[]'),
      status: post.status,
      createdAt: post.created_at,
      authorName: post.business_name || post.name || 'User',
      authorType: post.profile_type
    }));
    
    res.json(posts);
  } catch (error) {
    console.error('Get all posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createPost, getUserPosts, getAllPosts };