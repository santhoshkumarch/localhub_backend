const express = require('express');
const { getUsers, getUserById, createUser, updateUser, deleteUser, toggleUserStatus, updateProfileByEmail } = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticate, authorize('users:read'), getUsers);
router.get('/:id', authenticate, authorize('users:read'), getUserById);
router.post('/', authenticate, authorize('users:write'), createUser);
router.put('/:id', authenticate, authorize('users:write'), updateUser);
router.delete('/:id', authenticate, authorize('users:write'), deleteUser);
router.patch('/:id/toggle-status', authenticate, authorize('users:write'), toggleUserStatus);
router.put('/profile/:email', updateProfileByEmail);

module.exports = router;