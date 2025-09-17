const express = require('express');
const { getPosts, updatePostStatus } = require('../controllers/postController');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticate, authorize('posts:read'), getPosts);
router.patch('/:id/status', authenticate, authorize('posts:write'), updatePostStatus);

module.exports = router;