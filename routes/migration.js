const express = require('express');
const { runEngagementMigration } = require('../controllers/migrationController');

const router = express.Router();

router.post('/engagement', runEngagementMigration);

module.exports = router;