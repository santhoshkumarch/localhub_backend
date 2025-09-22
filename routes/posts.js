const express = require('express');
const { 
  getPosts, 
  getPostById, 
  updatePostStatus, 
  setPostDuration, 
  setPostViewLimit, 
  assignPostLabel, 
  createPost, 
  deletePost 
} = require('../controllers/postController');
const router = express.Router();

router.get('/', getPosts);
router.get('/:id', getPostById);
router.post('/', createPost);
router.delete('/:id', deletePost);
router.patch('/:id/status', updatePostStatus);
router.patch('/:id/duration', setPostDuration);
router.patch('/:id/view-limit', setPostViewLimit);
router.patch('/:id/label', assignPostLabel);

module.exports = router;