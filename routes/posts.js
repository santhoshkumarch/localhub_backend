const express = require('express');
const { createPost, getUserPosts, getAllPosts } = require('../controllers/postController');

const router = express.Router();

router.post('/', createPost);
router.get('/', getAllPosts);
router.get('/user/:phoneNumber', getUserPosts);

module.exports = router;