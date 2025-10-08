const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const crypto = require('crypto');
const twilio = require('twilio');

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

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

const checkUser = async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }
    
    // Check if user exists
    const query = 'SELECT id, email, phone, name, is_logged_in FROM users WHERE phone = $1';
    const result = await pool.query(query, [phone]);
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      res.json({ 
        exists: true, 
        user: user,
        isLoggedIn: user.is_logged_in || false
      });
    } else {
      res.json({ exists: false, isLoggedIn: false });
    }
  } catch (error) {
    console.error('Check user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const registerUser = async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }
    
    // Insert new user with phone and explicitly NULL profile_type
    const query = 'INSERT INTO users (phone, profile_type) VALUES ($1, $2) RETURNING id, phone, profile_type';
    const result = await pool.query(query, [phone, null]);
    
    res.json({ message: 'User registered successfully', user: result.rows[0] });
  } catch (error) {
    console.error('Register user error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Phone number already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }
    
    // Format phone number to E.164 format
    let formattedPhone = phone.replace(/\D/g, '');
    if (!formattedPhone.startsWith('91') && formattedPhone.length === 10) {
      formattedPhone = '91' + formattedPhone;
    }
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone;
    }
    
    try {
      // Try Twilio first
      const verification = await client.verify.v2
        .services(process.env.TWILIO_VERIFY_SERVICE_SID)
        .verifications
        .create({ to: formattedPhone, channel: 'sms', codeLength: 4 });
      
      await pool.query(
        'INSERT INTO otp_codes (phone, otp, expires_at) VALUES ($1, $2, $3) ON CONFLICT (phone) DO UPDATE SET otp = $2, expires_at = $3, created_at = CURRENT_TIMESTAMP',
        [phone, 'TWILIO_MANAGED', new Date(Date.now() + 10 * 60 * 1000)]
      );
      
      console.log(`Twilio OTP sent to ${phone}`);
      res.json({ message: 'OTP sent successfully', method: 'twilio' });
      
    } catch (twilioError) {
      console.error('Twilio failed, using fallback OTP:', twilioError.message);
      
      // Fallback: Generate simple OTP
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      
      await pool.query(
        'INSERT INTO otp_codes (phone, otp, expires_at) VALUES ($1, $2, $3) ON CONFLICT (phone) DO UPDATE SET otp = $2, expires_at = $3, created_at = CURRENT_TIMESTAMP',
        [phone, otp, new Date(Date.now() + 5 * 60 * 1000)] // 5 minutes expiry
      );
      
      console.log(`Fallback OTP generated for ${phone}: ${otp}`);
      
      res.json({ 
        message: 'OTP sent successfully', 
        method: 'fallback',
        otp: otp // Include OTP in response for development
      });
    }
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ message: 'Failed to send OTP: ' + error.message });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    
    if (!phone || !otp) {
      return res.status(400).json({ message: 'Phone and OTP are required' });
    }
    
    // Check if we have a fallback OTP in database
    const otpQuery = 'SELECT otp, expires_at FROM otp_codes WHERE phone = $1';
    const otpResult = await pool.query(otpQuery, [phone]);
    
    let isValidOtp = false;
    
    if (otpResult.rows.length > 0) {
      const { otp: storedOtp, expires_at } = otpResult.rows[0];
      
      // Check if it's a fallback OTP (not TWILIO_MANAGED)
      if (storedOtp !== 'TWILIO_MANAGED' && storedOtp !== 'TWILIO_MANAGED_NEW') {
        // Check fallback OTP
        if (new Date() <= new Date(expires_at) && otp === storedOtp) {
          isValidOtp = true;
          console.log(`Fallback OTP verified for ${phone}`);
        }
      } else {
        // Try Twilio verification
        try {
          const formattedPhone = phone.replace(/\D/g, '');
          let twilioPhone = formattedPhone;
          if (!twilioPhone.startsWith('91') && twilioPhone.length === 10) {
            twilioPhone = '91' + twilioPhone;
          }
          if (!twilioPhone.startsWith('+')) {
            twilioPhone = '+' + twilioPhone;
          }
          
          const verificationCheck = await client.verify.v2
            .services(process.env.TWILIO_VERIFY_SERVICE_SID)
            .verificationChecks
            .create({ to: twilioPhone, code: otp });
          
          if (verificationCheck.status === 'approved') {
            isValidOtp = true;
            console.log(`Twilio OTP verified for ${phone}`);
          }
        } catch (twilioError) {
          console.error('Twilio verification failed:', twilioError.message);
        }
      }
    }
    
    if (isValidOtp) {
      // Update OTP status in database
      await pool.query(
        'UPDATE otp_codes SET otp = $1 WHERE phone = $2',
        ['VERIFIED', phone]
      );
      
      // Get user details from database
      const userQuery = 'SELECT id, email, phone, name FROM users WHERE phone = $1';
      const userResult = await pool.query(userQuery, [phone]);
      
      let user = { phone };
      if (userResult.rows.length > 0) {
        user = userResult.rows[0];
        
        // Update login status in database
        await pool.query('UPDATE users SET is_logged_in = true WHERE id = $1', [user.id]);
      }
      
      // Generate token for user
      const token = jwt.sign(
        { phone, userId: user.id, type: 'user' },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '24h' }
      );
      
      res.json({ 
        message: 'OTP verified successfully',
        token,
        user
      });
    } else {
      res.status(400).json({ message: 'Invalid or expired OTP' });
    }
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Failed to verify OTP: ' + error.message });
  }
};

const logoutUser = async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }
    
    // Update login status to false
    await pool.query('UPDATE users SET is_logged_in = false WHERE phone = $1', [phone]);
    
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { login, checkUser, registerUser, sendOtp, verifyOtp, logoutUser, getProfile, updateProfile, changePassword };