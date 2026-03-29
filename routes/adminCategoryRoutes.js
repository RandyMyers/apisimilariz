const express = require('express');
const router = express.Router();
const {
  list,
  getById,
  create,
  update,
  delete: deleteCategory,
} = require('../controllers/adminCategoryController');

router.get('/', list);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', deleteCategory);

module.exports = router;
