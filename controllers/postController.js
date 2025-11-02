const pool = require('../config/database');

const createPost = async (req, res) => {
  try {
    const { title, content, menuId, assignedLabel, phoneNumber, email, mediaUrls } = req.body;
    
    if (!title || !content || !menuId || (!phoneNumber && !email)) {
      return res.status(400).json({ message: 'Title, content, menu, and phone number or email are required' });
    }
    
    // Get user by phone number or email, create if doesn't exist
    let userQuery, userParam;
    if (phoneNumber) {
      userQuery = 'SELECT id, profile_type, business_name, name FROM users WHERE phone = $1';
      userParam = phoneNumber;
    } else {
      userQuery = 'SELECT id, profile_type, business_name, name FROM users WHERE email = $1';
      userParam = email;
    }
    
    let userResult = await pool.query(userQuery, [userParam]);
    
    if (userResult.rows.length === 0) {
      // Create user if doesn't exist
      const createUserQuery = `
        INSERT INTO users (phone, email, name, is_active, is_verified)
        VALUES ($1, $2, $3, true, true)
        RETURNING id, profile_type, business_name, name
      `;
      const defaultName = 'User';
      const defaultEmail = email || `${phoneNumber.replace(/[^0-9]/g, '')}@temp.com`;
      userResult = await pool.query(createUserQuery, [phoneNumber, defaultEmail, defaultName]);
    }
    
    const user = userResult.rows[0];
    
    // Create post without media_urls column for now
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

const getUserPostsByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    
    const query = `
      SELECT p.*, m.name as menu_name, m.icon as menu_icon, u.name, u.business_name, u.profile_type
      FROM posts p
      JOIN menus m ON p.menu_id = m.id
      JOIN users u ON p.user_id = u.id
      WHERE u.email = $1
      ORDER BY p.created_at DESC
    `;
    
    const result = await pool.query(query, [email]);
    
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
    console.error('Get user posts by email error:', error);
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

const updatePostStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['approved', 'pending', 'rejected', 'expired'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const query = 'UPDATE posts SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *';
    const result = await pool.query(query, [status, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    res.json({ message: 'Post status updated successfully', post: result.rows[0] });
  } catch (error) {
    console.error('Update post status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getPostsForAdmin = async (req, res) => {
  try {
    const { status, search, category } = req.query;
    
    let query = `
      SELECT p.*, m.name as menu_name, m.icon as menu_icon, u.name, u.business_name, u.profile_type
      FROM posts p
      JOIN menus m ON p.menu_id = m.id
      JOIN users u ON p.user_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (status && status !== 'all') {
      paramCount++;
      query += ` AND p.status = $${paramCount}`;
      params.push(status);
    }
    
    if (search) {
      paramCount++;
      query += ` AND (p.title ILIKE $${paramCount} OR p.content ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }
    
    if (category && category !== 'all') {
      paramCount++;
      query += ` AND m.name = $${paramCount}`;
      params.push(category);
    }
    
    query += ' ORDER BY p.created_at DESC LIMIT 100';
    
    const result = await pool.query(query, params);
    
    const posts = result.rows.map(post => ({
      id: post.id,
      title: post.title,
      content: post.content,
      author: post.business_name || post.name || 'User',
      authorType: post.profile_type || 'individual',
      category: post.menu_name,
      hashtags: [],
      likes: post.likes_count || 0,
      comments: post.comments_count || 0,
      shares: 0,
      status: post.status,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      menuId: post.menu_id,
      assignedLabel: post.assigned_label,
      viewDuration: post.view_duration,
      expiresAt: post.expires_at,
      viewLimit: post.view_limit,
      currentViews: post.views_count || 0
    }));
    
    res.json(posts);
  } catch (error) {
    console.error('Get posts for admin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const assignPostLabel = async (req, res) => {
  try {
    const { id } = req.params;
    const { menuId, assignedLabel } = req.body;
    
    if (!menuId || !assignedLabel) {
      return res.status(400).json({ message: 'Menu ID and assigned label are required' });
    }
    
    const query = 'UPDATE posts SET menu_id = $1, assigned_label = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *';
    const result = await pool.query(query, [menuId, assignedLabel, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    res.json({ message: 'Post label assigned successfully', post: result.rows[0] });
  } catch (error) {
    console.error('Assign post label error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const setPostDuration = async (req, res) => {
  try {
    const { id } = req.params;
    const { viewDuration } = req.body;
    
    if (!viewDuration || viewDuration <= 0) {
      return res.status(400).json({ message: 'Valid view duration is required' });
    }
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + viewDuration);
    
    const query = 'UPDATE posts SET view_duration = $1, expires_at = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *';
    const result = await pool.query(query, [viewDuration, expiresAt.toISOString(), id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    res.json({ message: 'Post duration set successfully', post: result.rows[0] });
  } catch (error) {
    console.error('Set post duration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const setPostViewLimit = async (req, res) => {
  try {
    const { id } = req.params;
    const { viewLimit } = req.body;
    
    if (!viewLimit || viewLimit <= 0) {
      return res.status(400).json({ message: 'Valid view limit is required' });
    }
    
    const query = 'UPDATE posts SET view_limit = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *';
    const result = await pool.query(query, [viewLimit, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    res.json({ message: 'Post view limit set successfully', post: result.rows[0] });
  } catch (error) {
    console.error('Set post view limit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createPost, getUserPosts, getUserPostsByEmail, getAllPosts, toggleLike, addComment, getComments, updatePostStatus, getPostsForAdmin, assignPostLabel, setPostDuration, setPostViewLimit };