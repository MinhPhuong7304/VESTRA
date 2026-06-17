const express = require('express');
const router = express.Router();
const {
  getNotificationsByUser, createNotification, updateNotification,
} = require('../controllers/extendedController');

router.get('/', getNotificationsByUser);
router.post('/', createNotification);
router.put('/:id', updateNotification);
router.patch('/:id', updateNotification);

module.exports = router;
