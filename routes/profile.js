const express = require('express');
const { getProfile, updateProfile } = require('../controllers/profileController');

const router = express.Router();

router.get('/:phone', getProfile);
router.put('/:phone', updateProfile);

module.exports = router;