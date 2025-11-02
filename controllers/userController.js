const User = require('../models/User');
const pool = require('../config/database');

const getUsers = async (req, res) => {
  try {
    const { search, status, userType, district } = req.query;
    let query = `
      SELECT u.*, 
             COUNT(DISTINCT b.id) as business_count,
             COUNT(DISTINCT p.id) as posts_count
      FROM users u
      LEFT JOIN businesses b ON u.id = b.user_id
      LEFT JOIN posts p ON u.id = p.user_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      query += ` AND (u.name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (status && status !== 'all') {
      paramCount++;
      if (status === 'active') {
        query += ` AND u.is_active = $${paramCount}`;
        params.push(true);
      } else if (status === 'inactive') {
        query += ` AND u.is_active = $${paramCount}`;
        params.push(false);
      } else if (status === 'verified') {
        query += ` AND u.is_verified = $${paramCount}`;
        params.push(true);
      }
    }

    if (userType && userType !== 'all') {
      paramCount++;
      query += ` AND u.user_type = $${paramCount}`;
      params.push(userType);
    }

    query += ` GROUP BY u.id ORDER BY u.created_at DESC`;

    const result = await pool.query(query, params);
    
    const users = result.rows.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      district: user.district || 'N/A',
      businessCount: parseInt(user.business_count) || 0,
      postsCount: parseInt(user.posts_count) || 0,
      isActive: user.is_active,
      isVerified: user.is_verified,
      joinedDate: user.created_at,
      lastActive: user.last_active,
      userType: user.user_type || 'individual',
      avatar: user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    }));

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.getById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { name, email, phone, district, isActive, isVerified } = req.body;
    
    const query = `
      UPDATE users 
      SET name = $1, email = $2, phone = $3, district = $4, 
          is_active = $5, is_verified = $6, updated_at = NOW()
      WHERE id = $7
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      name, email, phone, district, isActive, isVerified, req.params.id
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User updated successfully', user: result.rows[0] });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, phone, password, district, userType } = req.body;
    
    const query = `
      INSERT INTO users (name, email, phone, password, district, user_type, is_active, is_verified)
      VALUES ($1, $2, $3, $4, $5, $6, true, false)
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      name, email, phone, password, district, userType || 'individual'
    ]);
    
    res.status(201).json({ 
      message: 'User created successfully', 
      user: result.rows[0] 
    });
  } catch (error) {
    console.error('Create user error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const query = 'DELETE FROM users WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const toggleUserStatus = async (req, res) => {
  try {
    const query = `
      UPDATE users 
      SET is_active = NOT is_active, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await pool.query(query, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ 
      message: 'User status updated successfully', 
      user: result.rows[0] 
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getProfileByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    
    const query = `
      SELECT name, email, profile_type, business_name, business_category, address
      FROM users 
      WHERE email = $1
    `;
    
    const result = await pool.query(query, [email]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get profile by email error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateProfileByEmail = async (req, res) => {
  try {
    const { name, profile_type, business_name, business_category, address } = req.body;
    const { email } = req.params;
    
    const query = `
      UPDATE users 
      SET name = $1, profile_type = $2, business_name = $3, 
          business_category = $4, address = $5, updated_at = NOW()
      WHERE email = $6
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      name, profile_type, business_name, business_category, address, email
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'Profile updated successfully', user: result.rows[0] });
  } catch (error) {
    console.error('Update profile by email error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getUsers, getUserById, createUser, updateUser, deleteUser, toggleUserStatus, getProfileByEmail, updateProfileByEmail };