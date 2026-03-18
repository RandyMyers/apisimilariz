const express = require('express');
const router = express.Router();
const { list, getById, create, update, delete: deleteWebsite } = require('../controllers/adminWebsiteController');

router.get('/', list);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.patch('/:id', update);
router.delete('/:id', deleteWebsite);

module.exports = router;
