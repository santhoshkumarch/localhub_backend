const express = require('express');
const { getDistricts } = require('../controllers/districtController');
const router = express.Router();

router.get('/', getDistricts);

module.exports = router;