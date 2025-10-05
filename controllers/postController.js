const pool = require('../config/database');

const createPost = async (req, res) => {
  try {
    const { title, content, menuId, assignedLabel, phoneNumber } = req.body;
    
    if (!title || !content || !menuId || !phoneNumber) {
      return res.status(400).json({ message: 'Title, content, menu, and phone number are required' });
    }
    
    // Get user by phone number
    const userQuery = 'SELECT id, profile_type, business_name FROM users WHERE phone = $1';
    const userResult = await pool.query(userQuery, [phoneNumber]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Create post
    const postQuery = `
      INSERT INTO posts (title, content, menu_id, assigned_label, user_id, status)
      VALUES ($1, $2, $3, $4, $5, 'pending')
      RETURNING id, title, content, menu_id, assigned_label, user_id, status, created_at
    `;
    
    const postResult = await pool.query(postQuery, [
      title, content, menuId, assignedLabel, user.id
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
        status: post.status,
        createdAt: post.created_at,
        authorType: user.profile_type,
        authorName: user.business_name || 'Individual User'
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
      SELECT p.*, m.name as menu_name, m.icon as menu_icon
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
      status: post.status,
      createdAt: post.created_at
    }));
    
    res.json(posts);
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createPost, getUserPosts };