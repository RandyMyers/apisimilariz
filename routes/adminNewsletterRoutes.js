const express = require('express');
const router = express.Router();
const { list, delete: deleteNewsletter } = require('../controllers/adminNewsletterController');

router.get('/', list);
router.delete('/:id', deleteNewsletter);

module.exports = router;
