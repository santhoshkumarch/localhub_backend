const crypto = require('crypto');
const pool = require('../config/database');

class Auth {
  static async validateUser(email, password) {
    try {
      const result = await pool.query('SELECT * FROM admin_users WHERE email = $1', [email]);
      if (result.rows.length === 0) return null;
      
      const user = result.rows[0];
      const hashedPassword = crypto.createHash('md5').update('password').digest('hex');
      const isMatch = password === hashedPassword;
      if (!isMatch) return null;
      
      return { id: user.id, email: user.email, name: user.name, role: user.role };
    } catch (error) {
      console.error('Auth error:', error);
      return null;
    }
  }
}

module.exports = Auth;