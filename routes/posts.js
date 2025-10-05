const express = require('express');
const { createPost, getUserPosts } = require('../controllers/postController');

const router = express.Router();

router.post('/', createPost);
router.get('/user/:phoneNumber', getUserPosts);

module.exports = router;