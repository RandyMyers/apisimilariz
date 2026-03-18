const express = require('express');
const router = express.Router();
const { getRobotsTxt } = require('../controllers/sitemapController');

router.get('/', getRobotsTxt);

module.exports = router;
