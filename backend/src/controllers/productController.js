const prisma = require('../config/prisma');
const { listOptions } = require('../utils/query');

const includeProduct = {
  category: true,
  images: true,
  variants: true,
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const mapProduct = (product) => ({
  id: product.id,
  name: product.name,
  category: product.category?.name ?? '',
  category_id: product.category_id,
  description: product.description,
  images: (product.images || []).map((image) => image.image_url),
  variants: (product.variants || []).map((variant) => ({
    id: variant.id,
    color: variant.color,
    size: variant.size,
    quantity: variant.quantity,
    sold: variant.sold,
    price_import: variant.price_import,
    price_sale: variant.price_sale,
  })),
  stock: product.stock,
  stock_quantity: product.stock,
  price_sale: product.price_sale,
  base_price: product.price_sale,
  price_cost: product.price_cost,
  sold: product.sold,
  status: product.status,
  created_at: product.created_at,
  
  // Các trường mới hỗ trợ đề tài:
  is_pass_item: product.is_pass_item,
  owner_id: product.owner_id,
  condition: product.condition,
  is_vto_enabled: product.is_vto_enabled,
  garment_3d_url: product.garment_3d_url,
});

const findCategoryId = async (categoryName) => {
  if (!categoryName) return null;
  const category = await prisma.category.findFirst({ where: { name: categoryName } });
  return category?.id ?? null;
};

const getProductData = async (body) => {
  const variants = Array.isArray(body.variants) ? body.variants : [];
  const stock = body.stock ?? variants.reduce((sum, variant) => sum + toNumber(variant.quantity), 0);
  const priceSale =
    body.price_sale ?? (variants.length ? Math.min(...variants.map((variant) => toNumber(variant.price_sale))) : 0);

  return {
    id: String(body.id ?? `SP${Date.now()}`),
    name: body.name,
    category_id: body.category_id ? String(body.category_id) : await findCategoryId(body.category),
    description: body.description ?? null,
    stock: toNumber(stock),
    price_sale: toNumber(priceSale),
    price_cost: toNumber(body.price_cost),
    sold: toNumber(body.sold),
    status: body.status ?? 'active',
    store_id: body.store_id ? String(body.store_id) : null,
    
    // Thuộc tính phục vụ đề tài khóa luận:
    is_pass_item: body.is_pass_item === true || body.is_pass_item === 'true',
    owner_id: body.owner_id ? String(body.owner_id) : null,
    condition: body.condition !== undefined ? toNumber(body.condition) : null,
    is_vto_enabled: body.is_vto_enabled === true || body.is_vto_enabled === 'true',
    garment_3d_url: body.garment_3d_url || null,
  };
};

const getAllProducts = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.status) where.status = String(req.query.status);
    if (req.query.store_id) where.store_id = String(req.query.store_id);
    if (req.query.owner_id) where.owner_id = String(req.query.owner_id);
    if (req.query.is_pass_item !== undefined) {
      where.is_pass_item = req.query.is_pass_item === 'true';
    }

    const options = listOptions(req.query, ['id', 'name', 'created_at', 'price_sale', 'status']);
    const products = await prisma.product.findMany({
      where,
      include: includeProduct,
      ...options,
      orderBy: options.orderBy ?? { id: 'asc' },
    });

    res.json(products.map(mapProduct));
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: String(req.params.id) },
      include: includeProduct,
    });

    if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    res.json(mapProduct(product));
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const productData = await getProductData(req.body);
    const images = Array.isArray(req.body.images) ? req.body.images : [];
    const variants = Array.isArray(req.body.variants) ? req.body.variants : [];

    const product = await prisma.product.create({
      data: {
        ...productData,
        images: { create: images.map((image) => ({ image_url: image })) },
        variants: {
          create: variants.map((variant, index) => ({
            id: String(variant.id ?? `${productData.id}-${index + 1}`),
            color: variant.color ?? null,
            size: variant.size ?? null,
            quantity: toNumber(variant.quantity),
            sold: toNumber(variant.sold),
            price_import: toNumber(variant.price_import),
            price_sale: toNumber(variant.price_sale),
          })),
        },
      },
      include: includeProduct,
    });

    res.status(201).json(mapProduct(product));
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

    const productData = await getProductData({ ...existing, ...req.body, id });
    const images = Array.isArray(req.body.images) ? req.body.images : null;
    const variants = Array.isArray(req.body.variants) ? req.body.variants : null;

    const product = await prisma.$transaction(async (tx) => {
      if (images) await tx.productImage.deleteMany({ where: { product_id: id } });
      if (variants) await tx.productVariant.deleteMany({ where: { product_id: id } });

      return tx.product.update({
        where: { id },
        data: {
          ...productData,
          images: images ? { create: images.map((image) => ({ image_url: image })) } : undefined,
          variants: variants
            ? {
                create: variants.map((variant, index) => ({
                  id: String(variant.id ?? `${id}-${index + 1}`),
                  color: variant.color ?? null,
                  size: variant.size ?? null,
                  quantity: toNumber(variant.quantity),
                  sold: toNumber(variant.sold),
                  price_import: toNumber(variant.price_import),
                  price_sale: toNumber(variant.price_sale),
                })),
              }
            : undefined,
        },
        include: includeProduct,
      });
    });

    res.json(mapProduct(product));
  } catch (error) {
    next(error);
  }
};

const patchProduct = async (req, res, next) => {
  try {
    const data = {};
    if (req.body.status !== undefined) data.status = req.body.status;
    if (req.body.sold !== undefined) data.sold = toNumber(req.body.sold);
    if (req.body.stock !== undefined) data.stock = toNumber(req.body.stock);
    if (req.body.is_vto_enabled !== undefined) data.is_vto_enabled = req.body.is_vto_enabled === true || req.body.is_vto_enabled === 'true';

    const product = await prisma.product.update({
      where: { id: String(req.params.id) },
      data,
      include: includeProduct,
    });

    res.json(mapProduct(product));
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    await prisma.product.delete({ where: { id: String(req.params.id) } });
    res.json({ message: 'Đã xóa sản phẩm thành công' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProduct,
  deleteProduct,
  getAllProducts,
  getProductById,
  patchProduct,
  updateProduct,
};
