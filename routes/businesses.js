const express = require('express');
const { 
  getBusinesses, 
  getBusinessById, 
  updateBusinessStatus, 
  createBusiness, 
  updateBusiness, 
  deleteBusiness 
} = require('../controllers/businessController');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

router.get('/', getBusinesses);
router.get('/:id', getBusinessById);
router.post('/', createBusiness);
router.put('/:id', updateBusiness);
router.delete('/:id', deleteBusiness);
router.patch('/:id/status', updateBusinessStatus);

module.exports = router;