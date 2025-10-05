const twilioService = require('../services/twilioService');
const pool = require('../config/database');

const sendOTP = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Bypass for blocked number
    if (phoneNumber === '+917904175862') {
      return res.json({ message: 'OTP sent successfully (test mode - use 123456)' });
    }

    const result = await twilioService.sendOTP(phoneNumber);
    
    if (result.success) {
      res.json({ message: 'OTP sent successfully' });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Send OTP controller error:', error.message);
    
    if (error.message.includes('credentials not configured')) {
      res.status(500).json({ error: 'SMS service not configured properly' });
    } else {
      res.status(500).json({ error: 'Failed to send OTP: ' + error.message });
    }
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { phoneNumber, code } = req.body;
    
    if (!phoneNumber || !code) {
      return res.status(400).json({ error: 'Phone number and code are required' });
    }

    // Bypass for blocked number
    if (phoneNumber === '+917904175862' && code === '123456') {
      // Create user entry after OTP verification
      try {
        const userQuery = 'SELECT id FROM users WHERE phone = $1';
        const userResult = await pool.query(userQuery, [phoneNumber]);
        
        if (userResult.rows.length === 0) {
          const createUserQuery = `
            INSERT INTO users (phone, name, email, is_active, is_verified, profile_type)
            VALUES ($1, $2, $3, true, true, 'individual')
          `;
          const defaultName = 'User';
          const defaultEmail = `${phoneNumber.replace(/[^0-9]/g, '')}@temp.com`;
          await pool.query(createUserQuery, [phoneNumber, defaultName, defaultEmail]);
        }
      } catch (error) {
        console.error('Error creating user after OTP:', error);
      }
      return res.json({ message: 'OTP verified successfully (test mode)', verified: true });
    }

    const result = await twilioService.verifyOTP(phoneNumber, code);
    
    if (result.success) {
      // Create user entry after OTP verification
      try {
        const userQuery = 'SELECT id FROM users WHERE phone = $1';
        const userResult = await pool.query(userQuery, [phoneNumber]);
        
        if (userResult.rows.length === 0) {
          const createUserQuery = `
            INSERT INTO users (phone, name, email, is_active, is_verified, profile_type)
            VALUES ($1, $2, $3, true, true, 'individual')
          `;
          const defaultName = 'User';
          const defaultEmail = `${phoneNumber.replace(/[^0-9]/g, '')}@temp.com`;
          await pool.query(createUserQuery, [phoneNumber, defaultName, defaultEmail]);
        }
      } catch (error) {
        console.error('Error creating user after OTP:', error);
      }
      res.json({ message: 'OTP verified successfully', verified: true });
    } else {
      res.status(400).json({ error: result.error || 'Invalid OTP', verified: false });
    }
  } catch (error) {
    console.error('Verify OTP controller error:', error.message);
    
    if (error.message.includes('credentials not configured')) {
      res.status(500).json({ error: 'SMS service not configured properly', verified: false });
    } else {
      res.status(500).json({ error: 'Failed to verify OTP: ' + error.message, verified: false });
    }
  }
};

module.exports = { sendOTP, verifyOTP };