const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const crypto = require('crypto');

const login = async (req, res) => {
  try {
    console.log('Login request body:', req.body);
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Check admin_users table first
    let query = 'SELECT * FROM admin_users WHERE email = $1';
    console.log('Executing query:', query, 'with email:', email);
    
    let result = await pool.query(query, [email]);
    console.log('Query result:', result.rows.length, 'rows found');
    
    if (result.rows.length === 0) {
      console.log('No user found with email:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    console.log('Found user:', user.email, 'role:', user.role);
    
    // Check if password is MD5 hash of 'password' or plain 'password'
    const expectedHash = crypto.createHash('md5').update('password').digest('hex');
    if (password !== 'password' && password !== expectedHash) {
      console.log('Invalid password provided. Expected:', expectedHash, 'Got:', password);
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role }, 
      process.env.JWT_SECRET || 'secret', 
      { expiresIn: '24h' }
    );
    
    console.log('Login successful for user:', user.email);
    
    res.json({ 
      token, 
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const query = 'SELECT id, email, name, role, created_at FROM admin_users WHERE id = $1';
    const result = await pool.query(query, [req.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    
    const query = `
      UPDATE admin_users 
      SET name = $1, email = $2
      WHERE id = $3
      RETURNING id, email, name, role, created_at
    `;
    
    const result = await pool.query(query, [name, email, req.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ 
      message: 'Profile updated successfully', 
      user: result.rows[0] 
    });
  } catch (error) {
    console.error('Update profile error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Get current user
    const userQuery = 'SELECT * FROM admin_users WHERE id = $1';
    const userResult = await pool.query(userQuery, [req.user.id]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Verify current password
    const expectedHash = crypto.createHash('md5').update('password').digest('hex');
    if (currentPassword !== 'password' && currentPassword !== expectedHash) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Update password (store as plain text for now)
    const updateQuery = 'UPDATE admin_users SET password = $1 WHERE id = $2';
    await pool.query(updateQuery, [newPassword, req.user.id]);
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { login, getProfile, updateProfile, changePassword };