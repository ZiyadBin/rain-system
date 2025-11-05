const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// Get analytics data
router.get('/analytics', reportController.getAnalytics);

// Get statistics
router.get('/stats', reportController.getStats);

module.exports = router;
