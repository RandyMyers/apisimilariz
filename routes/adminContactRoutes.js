const express = require('express');
const router = express.Router();
const { list, getById, delete: deleteContact } = require('../controllers/adminContactController');

router.get('/', list);
router.get('/:id', getById);
router.delete('/:id', deleteContact);

module.exports = router;
