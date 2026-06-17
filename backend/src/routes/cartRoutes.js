const express = require('express');
const router = express.Router();
const {
  getCartByUser, addCartItem, updateCartItem, removeCartItem, clearCart,
} = require('../controllers/extendedController');

router.get('/user/:user_id', getCartByUser);
router.post('/user/:user_id', addCartItem);
router.put('/item/:item_id', updateCartItem);
router.delete('/item/:item_id', removeCartItem);
router.delete('/user/:user_id', clearCart);

module.exports = router;
