const express = require('express');
const { createResourceController } = require('../controllers/resourceController');

const createResourceRouter = (resourceName) => {
  const router = express.Router();
  const controller = createResourceController(resourceName);

  router.get('/', controller.list);
  router.get('/:id', controller.getById);
  router.post('/', controller.create);
  router.put('/:id', controller.update);
  router.patch('/:id', controller.update);
  router.delete('/:id', controller.remove);

  return router;
};

module.exports = createResourceRouter;
