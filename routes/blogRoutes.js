const express = require('express');
const router = express.Router();
const { list, getBySlug } = require('../controllers/blogController');

router.get('/', list);
router.get('/:slug', getBySlug);

module.exports = router;
