const jwt = require('jsonwebtoken');
const Auth = require('../models/Auth');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await Auth.validateUser(email, password);
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' });
    
    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { login };