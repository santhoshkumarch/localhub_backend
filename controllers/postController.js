const pool = require('../config/database');

const createPost = async (req, res) => {
  try {
    const { title, content, menuId, assignedLabel, phoneNumber, mediaUrls } = req.body;
    
    if (!title || !content || !menuId || !phoneNumber) {
      return res.status(400).json({ message: 'Title, content, menu, and phone number are required' });
    }
    
    // Get user by phone number, create if doesn't exist
    let userQuery = 'SELECT id, profile_type, business_name, name FROM users WHERE phone = $1';
    let userResult = await pool.query(userQuery, [phoneNumber]);
    
    if (userResult.rows.length === 0) {
      // Create user if doesn't exist
      const createUserQuery = `
        INSERT INTO users (phone, name, email, is_active, is_verified)
        VALUES ($1, $2, $3, true, true)
        RETURNING id, profile_type, business_name, name
      `;
      const defaultName = 'User';
      const defaultEmail = `${phoneNumber.replace(/[^0-9]/g, '')}@temp.com`;
      userResult = await pool.query(createUserQuery, [phoneNumber, defaultName, defaultEmail]);
    }
    
    const user = userResult.rows[0];
    
    // Create post without media_urls column for now
    const postQuery = `
      INSERT INTO posts (title, content, menu_id, assigned_label, user_id, status)
      VALUES ($1, $2, $3, $4, $5, 'approved')
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
        mediaUrls: [],
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
    
    // First ensure user exists
    let userQuery = 'SELECT id FROM users WHERE phone = $1';
    let userResult = await pool.query(userQuery, [phoneNumber]);
    
    if (userResult.rows.length === 0) {
      // Create user if doesn't exist
      const createUserQuery = `
        INSERT INTO users (phone, name, email, is_active, is_verified)
        VALUES ($1, $2, $3, true, true)
        RETURNING id
      `;
      const defaultName = 'User';
      const defaultEmail = `${phoneNumber.replace(/[^0-9]/g, '')}@temp.com`;
      await pool.query(createUserQuery, [phoneNumber, defaultName, defaultEmail]);
    }
    
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
      mediaUrls: [],
      status: post.status,
      createdAt: post.created_at,
      authorName: post.business_name || post.name || 'User',
      authorType: post.profile_type,
      likes: post.likes_count || 0,
      comments: post.comments_count || 0,
      views: post.views_count || 0
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
      mediaUrls: [],
      status: post.status,
      createdAt: post.created_at,
      authorName: post.business_name || post.name || 'User',
      authorType: post.profile_type,
      likes: post.likes_count || 0,
      comments: post.comments_count || 0,
      views: post.views_count || 0
    }));
    
    res.json(posts);
  } catch (error) {
    console.error('Get all posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const toggleLike = async (req, res) => {
  try {
    const { postId } = req.params;
    const { phoneNumber } = req.body;
    
    // Get user by phone number
    const userQuery = 'SELECT id FROM users WHERE phone = $1';
    const userResult = await pool.query(userQuery, [phoneNumber]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const userId = userResult.rows[0].id;
    
    // Check if like exists
    const likeQuery = 'SELECT id FROM post_likes WHERE post_id = $1 AND user_id = $2';
    const likeResult = await pool.query(likeQuery, [postId, userId]);
    
    if (likeResult.rows.length > 0) {
      // Unlike - remove like
      await pool.query('DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2', [postId, userId]);
      await pool.query('UPDATE posts SET likes_count = likes_count - 1 WHERE id = $1', [postId]);
    } else {
      // Like - add like
      await pool.query('INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2)', [postId, userId]);
      await pool.query('UPDATE posts SET likes_count = likes_count + 1 WHERE id = $1', [postId]);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { phoneNumber, comment } = req.body;
    
    if (!comment || comment.trim() === '') {
      return res.status(400).json({ message: 'Comment is required' });
    }
    
    // Get user by phone number
    const userQuery = 'SELECT id FROM users WHERE phone = $1';
    const userResult = await pool.query(userQuery, [phoneNumber]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const userId = userResult.rows[0].id;
    
    // Add comment
    await pool.query('INSERT INTO post_comments (post_id, user_id, comment) VALUES ($1, $2, $3)', 
      [postId, userId, comment.trim()]);
    
    // Update comment count
    await pool.query('UPDATE posts SET comments_count = comments_count + 1 WHERE id = $1', [postId]);
    
    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    
    const query = `
      SELECT pc.*, u.name, u.business_name
      FROM post_comments pc
      JOIN users u ON pc.user_id = u.id
      WHERE pc.post_id = $1
      ORDER BY pc.created_at ASC
    `;
    
    const result = await pool.query(query, [postId]);
    
    const comments = result.rows.map(comment => ({
      id: comment.id,
      comment: comment.comment,
      authorName: comment.business_name || comment.name || 'User',
      createdAt: comment.created_at
    }));
    
    res.json(comments);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createPost, getUserPosts, getAllPosts, toggleLike, addComment, getComments };