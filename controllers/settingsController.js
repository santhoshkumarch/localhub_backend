const pool = require('../config/database');

const getSettings = async (req, res) => {
  try {
    const query = 'SELECT * FROM settings ORDER BY category, key';
    const result = await pool.query(query);
    
    // Group settings by category
    const settings = {};
    result.rows.forEach(setting => {
      if (!settings[setting.category]) {
        settings[setting.category] = {};
      }
      
      let value = setting.value;
      // Parse JSON values
      if (setting.type === 'json') {
        try {
          value = JSON.parse(setting.value);
        } catch (e) {
          value = setting.value;
        }
      } else if (setting.type === 'boolean') {
        value = setting.value === 'true';
      } else if (setting.type === 'number') {
        value = parseInt(setting.value);
      }
      
      settings[setting.category][setting.key] = value;
    });
    
    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateSettings = async (req, res) => {
  try {
    const { category, settings } = req.body;
    
    // Update each setting in the category
    for (const [key, value] of Object.entries(settings)) {
      let stringValue = value;
      let type = 'string';
      
      if (typeof value === 'boolean') {
        stringValue = value.toString();
        type = 'boolean';
      } else if (typeof value === 'number') {
        stringValue = value.toString();
        type = 'number';
      } else if (typeof value === 'object') {
        stringValue = JSON.stringify(value);
        type = 'json';
      }
      
      const query = `
        INSERT INTO settings (category, key, value, type)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (category, key)
        DO UPDATE SET value = $3, type = $4, updated_at = NOW()
      `;
      
      await pool.query(query, [category, key, stringValue, type]);
    }
    
    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getSetting = async (req, res) => {
  try {
    const { category, key } = req.params;
    
    const query = 'SELECT * FROM settings WHERE category = $1 AND key = $2';
    const result = await pool.query(query, [category, key]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Setting not found' });
    }
    
    const setting = result.rows[0];
    let value = setting.value;
    
    // Parse value based on type
    if (setting.type === 'json') {
      try {
        value = JSON.parse(setting.value);
      } catch (e) {
        value = setting.value;
      }
    } else if (setting.type === 'boolean') {
      value = setting.value === 'true';
    } else if (setting.type === 'number') {
      value = parseInt(setting.value);
    }
    
    res.json({ ...setting, value });
  } catch (error) {
    console.error('Get setting error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createSetting = async (req, res) => {
  try {
    const { category, key, value, type = 'string', description } = req.body;
    
    let stringValue = value;
    if (typeof value === 'object') {
      stringValue = JSON.stringify(value);
    } else {
      stringValue = value.toString();
    }
    
    const query = `
      INSERT INTO settings (category, key, value, type, description)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const result = await pool.query(query, [category, key, stringValue, type, description]);
    
    res.status(201).json({ 
      message: 'Setting created successfully', 
      setting: result.rows[0] 
    });
  } catch (error) {
    console.error('Create setting error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Setting already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteSetting = async (req, res) => {
  try {
    const { category, key } = req.params;
    
    const query = 'DELETE FROM settings WHERE category = $1 AND key = $2 RETURNING *';
    const result = await pool.query(query, [category, key]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Setting not found' });
    }
    
    res.json({ message: 'Setting deleted successfully' });
  } catch (error) {
    console.error('Delete setting error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const resetSettings = async (req, res) => {
  try {
    const { category } = req.params;
    
    // Delete all settings in the category
    const query = 'DELETE FROM settings WHERE category = $1';
    await pool.query(query, [category]);
    
    // Insert default settings based on category
    const defaultSettings = getDefaultSettings(category);
    
    for (const [key, config] of Object.entries(defaultSettings)) {
      const insertQuery = `
        INSERT INTO settings (category, key, value, type, description)
        VALUES ($1, $2, $3, $4, $5)
      `;
      
      await pool.query(insertQuery, [
        category, 
        key, 
        config.value.toString(), 
        config.type, 
        config.description
      ]);
    }
    
    res.json({ message: `${category} settings reset to defaults` });
  } catch (error) {
    console.error('Reset settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getDefaultSettings = (category) => {
  const defaults = {
    general: {
      siteName: { value: 'LocalHub Admin', type: 'string', description: 'Site name' },
      siteDescription: { value: 'District-wise business directory', type: 'string', description: 'Site description' },
      contactEmail: { value: 'admin@localhub.com', type: 'string', description: 'Contact email' },
      timezone: { value: 'Asia/Kolkata', type: 'string', description: 'Default timezone' }
    },
    platform: {
      userRegistration: { value: true, type: 'boolean', description: 'Allow user registration' },
      businessRegistration: { value: true, type: 'boolean', description: 'Allow business registration' },
      postModeration: { value: true, type: 'boolean', description: 'Enable post moderation' }
    },
    security: {
      sessionTimeout: { value: 30, type: 'number', description: 'Session timeout in minutes' },
      passwordMinLength: { value: 8, type: 'number', description: 'Minimum password length' },
      requireEmailVerification: { value: true, type: 'boolean', description: 'Require email verification' }
    }
  };
  
  return defaults[category] || {};
};

module.exports = { 
  getSettings, 
  updateSettings, 
  getSetting, 
  createSetting, 
  deleteSetting, 
  resetSettings 
};