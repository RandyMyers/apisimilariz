const express = require('express');
const router = express.Router();
const { list, getById, create, update, delete: deleteSponsored } = require('../controllers/adminSponsoredController');

router.get('/', list);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.patch('/:id', update);
router.delete('/:id', deleteSponsored);

module.exports = router;
