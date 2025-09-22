const express = require('express');
const { 
  getHashtags, 
  createHashtag, 
  updateHashtag, 
  deleteHashtag, 
  getHashtagById, 
  getPopularHashtags 
} = require('../controllers/hashtagController');
const router = express.Router();

router.get('/', getHashtags);
router.get('/popular', getPopularHashtags);
router.get('/:id', getHashtagById);
router.post('/', createHashtag);
router.put('/:id', updateHashtag);
router.delete('/:id', deleteHashtag);

module.exports = router;