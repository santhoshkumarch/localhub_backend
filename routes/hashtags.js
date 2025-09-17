const express = require('express');
const { getHashtags, createHashtag, deleteHashtag } = require('../controllers/hashtagController');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticate, authorize('hashtags:read'), getHashtags);
router.post('/', authenticate, authorize('hashtags:write'), createHashtag);
router.delete('/:id', authenticate, authorize('hashtags:delete'), deleteHashtag);

module.exports = router;