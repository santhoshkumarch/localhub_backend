const express = require('express');
const { login, checkUser, registerUser, sendOtp, verifyOtp, logoutUser, getProfile, updateProfile, changePassword, loginUser } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.post('/login', login);
router.post('/user-login', loginUser);
router.post('/check-user', checkUser);
router.post('/register', registerUser);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/logout', logoutUser);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.post('/change-password', authenticate, changePassword);

module.exports = router;