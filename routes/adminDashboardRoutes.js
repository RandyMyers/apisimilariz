const express = require('express');
const router = express.Router();
const adminDashboardController = require('../controllers/adminDashboardController');

router.get('/', adminDashboardController.getStats);

module.exports = router;
