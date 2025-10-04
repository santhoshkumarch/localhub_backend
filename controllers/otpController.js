const twilioService = require('../services/twilioService');

const sendOTP = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
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

    const result = await twilioService.verifyOTP(phoneNumber, code);
    
    if (result.success) {
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