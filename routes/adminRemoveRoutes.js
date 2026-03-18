const express = require('express');
const router = express.Router();
const { list, getById, updateStatus, delete: deleteRemove } = require('../controllers/adminRemoveController');

router.get('/', list);
router.get('/:id', getById);
router.patch('/:id', updateStatus);
router.delete('/:id', deleteRemove);

module.exports = router;
