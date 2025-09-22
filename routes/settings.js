const express = require('express');
const { 
  getSettings, 
  updateSettings, 
  getSetting, 
  createSetting, 
  deleteSetting, 
  resetSettings 
} = require('../controllers/settingsController');
const router = express.Router();

router.get('/', getSettings);
router.post('/', updateSettings);
router.get('/:category/:key', getSetting);
router.post('/create', createSetting);
router.delete('/:category/:key', deleteSetting);
router.post('/:category/reset', resetSettings);

module.exports = router;