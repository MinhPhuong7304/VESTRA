const express = require('express');
const router = express.Router();
const {
  getAllOrders, getOrderById, createOrder, updateOrder, deleteOrder, getOrderItems,
} = require('../controllers/extendedController');

router.get('/', getAllOrders);
router.get('/items', getOrderItems);
router.get('/:id', getOrderById);
router.post('/', createOrder);
router.put('/:id', updateOrder);
router.patch('/:id', updateOrder);
router.delete('/:id', deleteOrder);

module.exports = router;
