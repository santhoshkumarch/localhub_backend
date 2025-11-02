const pool = require('../config/database');

const getBusinesses = async (req, res) => {
  try {
    const { search, category, status, district } = req.query;
    let query = `
      SELECT b.*, u.name as owner_name, u.email as owner_email,
             COUNT(DISTINCT p.id) as posts_count,
             AVG(r.rating) as avg_rating,
             COUNT(DISTINCT r.id) as review_count
      FROM businesses b
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN posts p ON b.id = p.business_id
      LEFT JOIN reviews r ON b.id = r.business_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      query += ` AND (b.name ILIKE $${paramCount} OR b.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (category && category !== 'all') {
      paramCount++;
      query += ` AND b.category = $${paramCount}`;
      params.push(category);
    }

    if (status && status !== 'all') {
      paramCount++;
      query += ` AND b.status = $${paramCount}`;
      params.push(status);
    }

    query += ` GROUP BY b.id, u.name, u.email ORDER BY b.created_at DESC`;

    const result = await pool.query(query, params);
    
    const businesses = result.rows.map(business => ({
      id: business.id,
      name: business.name,
      category: business.category,
      owner: business.owner_name || 'Unknown',
      phone: business.phone,
      email: business.owner_email || business.email,
      address: business.address,
      description: business.description,
      rating: parseFloat(business.avg_rating) || 0,
      reviewCount: parseInt(business.review_count) || 0,
      status: business.status,
      isVerified: business.is_verified,
      registeredDate: business.created_at,
      lastUpdated: business.updated_at,
      website: business.website,
      socialMedia: business.social_media
    }));

    res.json(businesses);
  } catch (error) {
    console.error('Get businesses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getBusinessById = async (req, res) => {
  try {
    const query = `
      SELECT b.*, u.name as owner_name, u.email as owner_email
      FROM businesses b
      LEFT JOIN users u ON b.user_id = u.id
      WHERE b.id = $1
    `;
    
    const result = await pool.query(query, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Business not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get business error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateBusinessStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const query = `
      UPDATE businesses 
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [status, req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Business not found' });
    }
    
    res.json({ 
      message: 'Business status updated successfully', 
      business: result.rows[0] 
    });
  } catch (error) {
    console.error('Update business status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createBusiness = async (req, res) => {
  try {
    const { 
      name, category, description, phone, email, address, 
      website, userId, socialMedia 
    } = req.body;
    
    const query = `
      INSERT INTO businesses (
        name, category, description, phone, email, address, 
        website, user_id, social_media, status, is_verified
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', false)
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      name, category, description, phone, email, address,
      website, userId, JSON.stringify(socialMedia || {})
    ]);
    
    res.status(201).json({ 
      message: 'Business created successfully', 
      business: result.rows[0] 
    });
  } catch (error) {
    console.error('Create business error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateBusiness = async (req, res) => {
  try {
    const { 
      name, category, description, phone, email, address, 
      website, isVerified, socialMedia 
    } = req.body;
    
    const query = `
      UPDATE businesses 
      SET name = $1, category = $2, description = $3, phone = $4, 
          email = $5, address = $6, website = $7, is_verified = $8,
          social_media = $9, updated_at = NOW()
      WHERE id = $10
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      name, category, description, phone, email, address,
      website, isVerified, JSON.stringify(socialMedia || {}), req.params.id
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Business not found' });
    }
    
    res.json({ 
      message: 'Business updated successfully', 
      business: result.rows[0] 
    });
  } catch (error) {
    console.error('Update business error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteBusiness = async (req, res) => {
  try {
    const query = 'DELETE FROM businesses WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Business not found' });
    }
    
    res.json({ message: 'Business deleted successfully' });
  } catch (error) {
    console.error('Delete business error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createBusinessByPhone = async (req, res) => {
  try {
    const { phoneNumber, name, category, address } = req.body;
    
    // Get user by phone
    const userQuery = 'SELECT id FROM users WHERE phone = $1';
    const userResult = await pool.query(userQuery, [phoneNumber]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const userId = userResult.rows[0].id;
    
    const query = `
      INSERT INTO businesses (name, category, address, phone, user_id, status, is_verified)
      VALUES ($1, $2, $3, $4, $5, 'pending', false)
      RETURNING *
    `;
    
    const result = await pool.query(query, [name, category, address, phoneNumber, userId]);
    
    res.status(201).json({ 
      message: 'Business created successfully', 
      business: result.rows[0] 
    });
  } catch (error) {
    console.error('Create business by phone error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createBusinessByEmail = async (req, res) => {
  try {
    const { email, name, category, address } = req.body;
    
    // Get user by email
    const userQuery = 'SELECT id FROM users WHERE email = $1';
    const userResult = await pool.query(userQuery, [email]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const userId = userResult.rows[0].id;
    
    const query = `
      INSERT INTO businesses (name, category, address, email, user_id, status, is_verified)
      VALUES ($1, $2, $3, $4, $5, 'pending', false)
      RETURNING *
    `;
    
    const result = await pool.query(query, [name, category, address, email, userId]);
    
    res.status(201).json({ 
      message: 'Business created successfully', 
      business: result.rows[0] 
    });
  } catch (error) {
    console.error('Create business by email error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { 
  getBusinesses, 
  getBusinessById, 
  updateBusinessStatus, 
  createBusiness, 
  updateBusiness, 
  deleteBusiness,
  createBusinessByPhone,
  createBusinessByEmail
};