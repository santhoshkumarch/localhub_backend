const express = require('express');
const { getBusinesses, getBusinessById, updateBusinessStatus } = require('../controllers/businessController');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticate, authorize('businesses:read'), getBusinesses);
router.get('/:id', authenticate, authorize('businesses:read'), getBusinessById);
router.patch('/:id/status', authenticate, authorize('businesses:write'), updateBusinessStatus);

module.exports = router;