const pool = require('../config/database');

const getMenus = async (req, res) => {
  try {
    const query = `
      SELECT m.*, 
             COUNT(p.id) as post_count
      FROM menus m
      LEFT JOIN posts p ON m.id = p.menu_id
      GROUP BY m.id
      ORDER BY m.created_at DESC
    `;
    
    const result = await pool.query(query);
    
    const menus = result.rows.map(menu => ({
      id: menu.id,
      name: menu.name,
      description: menu.description,
      icon: menu.icon,
      labels: menu.labels || [],
      timeFilter: menu.time_filter,
      postCount: parseInt(menu.post_count) || 0,
      isActive: menu.is_active,
      createdAt: menu.created_at
    }));

    res.json(menus);
  } catch (error) {
    console.error('Get menus error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getMenuPosts = async (req, res) => {
  try {
    const { id } = req.params;
    const { timeFilter } = req.query;
    
    let query = `
      SELECT p.*, 
             COALESCE(b.name, u.name) as author_name,
             CASE 
               WHEN p.business_id IS NOT NULL THEN 'business'
               ELSE 'individual'
             END as author_type,
             COUNT(DISTINCT l.id) as likes_count,
             COUNT(DISTINCT c.id) as comments_count
      FROM posts p
      LEFT JOIN businesses b ON p.business_id = b.id
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN likes l ON p.id = l.post_id
      LEFT JOIN comments c ON p.id = c.post_id
      WHERE p.menu_id = $1
    `;
    
    const params = [id];
    
    // Apply time filter
    if (timeFilter && timeFilter !== 'all') {
      const months = timeFilter === '1month' ? 1 : timeFilter === '3months' ? 3 : 6;
      query += ` AND p.created_at >= NOW() - INTERVAL '${months} months'`;
    }
    
    query += ` GROUP BY p.id, b.name, u.name ORDER BY p.created_at DESC`;
    
    const result = await pool.query(query, params);
    
    const posts = result.rows.map(post => ({
      id: post.id,
      title: post.title,
      content: post.content,
      author: post.author_name,
      authorType: post.author_type,
      assignedLabel: post.assigned_label,
      menuId: post.menu_id,
      likes: parseInt(post.likes_count) || 0,
      comments: parseInt(post.comments_count) || 0,
      createdAt: post.created_at
    }));
    
    res.json(posts);
  } catch (error) {
    console.error('Get menu posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createMenu = async (req, res) => {
  try {
    const { name, description, icon, labels, timeFilter } = req.body;
    
    const query = `
      INSERT INTO menus (name, description, icon, labels, time_filter, is_active)
      VALUES ($1, $2, $3, $4, $5, true)
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      name, description, icon, JSON.stringify(labels), timeFilter
    ]);
    
    res.status(201).json({ 
      message: 'Menu created successfully', 
      menu: result.rows[0] 
    });
  } catch (error) {
    console.error('Create menu error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, labels, timeFilter, isActive } = req.body;
    
    const query = `
      UPDATE menus 
      SET name = $1, description = $2, icon = $3, labels = $4, 
          time_filter = $5, is_active = $6, updated_at = NOW()
      WHERE id = $7
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      name, description, icon, JSON.stringify(labels), timeFilter, isActive, id
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Menu not found' });
    }
    
    res.json({ 
      message: 'Menu updated successfully', 
      menu: result.rows[0] 
    });
  } catch (error) {
    console.error('Update menu error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteMenu = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = 'DELETE FROM menus WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Menu not found' });
    }
    
    res.json({ message: 'Menu deleted successfully' });
  } catch (error) {
    console.error('Delete menu error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAllLabels = async (req, res) => {
  try {
    const query = `
      SELECT m.id as menu_id, m.name as menu_name, m.icon,
             jsonb_array_elements_text(m.labels) as label_name,
             COUNT(p.id) as post_count
      FROM menus m
      LEFT JOIN posts p ON m.id = p.menu_id AND p.assigned_label = jsonb_array_elements_text(m.labels)
      WHERE m.is_active = true
      GROUP BY m.id, m.name, m.icon, label_name
      ORDER BY m.name, label_name
    `;
    
    const result = await pool.query(query);
    
    const labels = result.rows.map(row => ({
      menuId: row.menu_id,
      menuName: row.menu_name,
      menuIcon: row.icon,
      labelName: row.label_name,
      postCount: parseInt(row.post_count) || 0
    }));
    
    res.json(labels);
  } catch (error) {
    console.error('Get all labels error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getLabelPosts = async (req, res) => {
  try {
    const { menuId, labelName } = req.params;
    
    const query = `
      SELECT p.*, 
             COALESCE(b.name, u.name) as author_name,
             CASE 
               WHEN p.business_id IS NOT NULL THEN 'business'
               ELSE 'individual'
             END as author_type,
             COUNT(DISTINCT l.id) as likes_count,
             COUNT(DISTINCT c.id) as comments_count
      FROM posts p
      LEFT JOIN businesses b ON p.business_id = b.id
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN likes l ON p.id = l.post_id
      LEFT JOIN comments c ON p.id = c.post_id
      WHERE p.menu_id = $1 AND p.assigned_label = $2
      GROUP BY p.id, b.name, u.name 
      ORDER BY p.created_at DESC
    `;
    
    const result = await pool.query(query, [menuId, labelName]);
    
    const posts = result.rows.map(post => ({
      id: post.id,
      title: post.title,
      content: post.content,
      author: post.author_name,
      authorType: post.author_type,
      assignedLabel: post.assigned_label,
      menuId: post.menu_id,
      likes: parseInt(post.likes_count) || 0,
      comments: parseInt(post.comments_count) || 0,
      createdAt: post.created_at
    }));
    
    res.json(posts);
  } catch (error) {
    console.error('Get label posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { 
  getMenus, 
  getMenuPosts,
  createMenu,
  updateMenu,
  deleteMenu,
  getAllLabels,
  getLabelPosts
};