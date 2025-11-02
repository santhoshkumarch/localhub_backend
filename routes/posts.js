const express = require('express');
const { createPost, getUserPosts, getUserPostsByEmail, getAllPosts, toggleLike, addComment, getComments, updatePostStatus, getPostsForAdmin, assignPostLabel, setPostDuration, setPostViewLimit } = require('../controllers/postController');

const router = express.Router();

router.post('/', createPost);
router.get('/', getAllPosts);
router.get('/admin', getPostsForAdmin);
router.get('/user/:phoneNumber', getUserPosts);
router.get('/user-email/:email', getUserPostsByEmail);
router.patch('/:id/status', updatePostStatus);
router.patch('/:id/label', assignPostLabel);
router.patch('/:id/duration', setPostDuration);
router.patch('/:id/view-limit', setPostViewLimit);
router.post('/:postId/like', toggleLike);
router.post('/:postId/comment', addComment);
router.get('/:postId/comments', getComments);

module.exports = router;