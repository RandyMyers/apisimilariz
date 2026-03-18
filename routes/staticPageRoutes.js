const express = require('express');
const router = express.Router();
const { getBySlug } = require('../controllers/staticPageController');

router.get('/:slug', getBySlug);

module.exports = router;

