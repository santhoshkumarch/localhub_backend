const express = require('express');
const { getUsers, getUserById, updateUser, toggleUserStatus } = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticate, authorize('users:read'), getUsers);
router.get('/:id', authenticate, authorize('users:read'), getUserById);
router.put('/:id', authenticate, authorize('users:write'), updateUser);
router.patch('/:id/toggle-status', authenticate, authorize('users:write'), toggleUserStatus);

module.exports = router;