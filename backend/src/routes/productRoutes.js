const express = require('express');
const router = express.Router();
const {
  getAllProducts, getProductById, createProduct, updateProduct, deleteProduct, patchProduct
} = require('../controllers/productController');

router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.patch('/:id', patchProduct);
router.delete('/:id', deleteProduct);

module.exports = router;
