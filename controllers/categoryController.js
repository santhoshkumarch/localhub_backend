const pool = require('../config/database');

const getCategories = async (req, res) => {
  try {
    const query = 'SELECT * FROM business_categories ORDER BY name ASC';
    const result = await pool.query(query);
    
    const categories = result.rows.map(cat => ({
      id: cat.id,
      name: cat.name,
      createdAt: cat.created_at
    }));
    
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const addCategory = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Category name is required' });
    }
    
    const query = 'INSERT INTO business_categories (name) VALUES ($1) RETURNING *';
    const result = await pool.query(query, [name.trim()]);
    
    const category = result.rows[0];
    res.status(201).json({
      message: 'Category added successfully',
      category: {
        id: category.id,
        name: category.name,
        createdAt: category.created_at
      }
    });
  } catch (error) {
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ message: 'Category already exists' });
    }
    console.error('Add category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getCategories, addCategory };