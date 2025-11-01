const express = require('express');
const { createPost, getUserPosts, getAllPosts, toggleLike, addComment, getComments, updatePostStatus, getPostsForAdmin } = require('../controllers/postController');

const router = express.Router();

router.post('/', createPost);
router.get('/', getAllPosts);
router.get('/admin', getPostsForAdmin);
router.get('/user/:phoneNumber', getUserPosts);
router.patch('/:id/status', updatePostStatus);
router.post('/:postId/like', toggleLike);
router.post('/:postId/comment', addComment);
router.get('/:postId/comments', getComments);

module.exports = router;