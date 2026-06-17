const express = require('express');
const router = express.Router();
const {
  getAllAddresses, getAddressesByUser, createAddress, updateAddress, deleteAddress,
} = require('../controllers/extendedController');

router.get('/', getAllAddresses);
router.get('/user/:user_id', getAddressesByUser);
router.post('/', createAddress);
router.put('/:id', updateAddress);
router.patch('/:id', updateAddress);
router.delete('/:id', deleteAddress);

module.exports = router;
