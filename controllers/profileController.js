const pool = require('../config/database');

const getProfile = async (req, res) => {
  try {
    const { phone } = req.params;
    
    const query = `
      SELECT id, phone, name, email, profile_type, business_name, 
             business_category, address, created_at, updated_at
      FROM users 
      WHERE phone = $1
    `;
    
    const result = await pool.query(query, [phone]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = result.rows[0];
    res.json({
      id: user.id,
      phone: user.phone,
      name: user.name,
      email: user.email,
      profileType: user.profile_type,
      businessName: user.business_name,
      businessCategory: user.business_category,
      address: user.address,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { phone } = req.params;
    const { name, email, profileType, businessName, businessCategory, address } = req.body;
    
    const query = `
      UPDATE users 
      SET name = $1, email = $2, profile_type = $3, business_name = $4, 
          business_category = $5, address = $6, updated_at = NOW()
      WHERE phone = $7
      RETURNING id, phone, name, email, profile_type, business_name, 
                business_category, address, updated_at
    `;
    
    const result = await pool.query(query, [
      name, email, profileType, businessName, businessCategory, address, phone
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = result.rows[0];
    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        profileType: user.profile_type,
        businessName: user.business_name,
        businessCategory: user.business_category,
        address: user.address,
        updatedAt: user.updated_at
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getProfile, updateProfile };