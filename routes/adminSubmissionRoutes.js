const express = require('express');
const router = express.Router();
const { list, getById, updateStatus } = require('../controllers/adminSubmissionController');

router.get('/', list);
router.get('/:id', getById);
router.patch('/:id', updateStatus);

module.exports = router;
