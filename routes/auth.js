const express = require('express');
const { login, getProfile, updateProfile, changePassword } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.post('/login', login);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.post('/change-password', authenticate, changePassword);

module.exports = router;