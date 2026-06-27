const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');

router.get('/', async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      }
    });
    res.json(categories);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const category = await prisma.category.findUnique({ 
      where: { id: String(req.params.id) },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });
    if (!category) return res.status(404).json({ error: "Không tìm thấy danh mục" });
    res.json(category);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const category = await prisma.category.create({
      data: {
        id: req.body.id || `CAT${Date.now()}`,
        name: req.body.name,
        images: req.body.images,
        description: req.body.description,
        isActive: req.body.isActive ?? true,
      }
    });
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const category = await prisma.category.update({
      where: { id: String(req.params.id) },
      data: {
        name: req.body.name,
        images: req.body.images,
        description: req.body.description,
        isActive: req.body.isActive,
      }
    });
    res.json(category);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.category.delete({ where: { id: String(req.params.id) } });
    res.json({ message: "Xóa danh mục thành công" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
