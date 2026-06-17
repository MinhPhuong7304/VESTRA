const prisma = require('../config/prisma');

// ---- ORDERS ----
const getAllOrders = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.user_id) where.user_id = String(req.query.user_id);
    if (req.query.status) where.status = String(req.query.status);
    if (req.query.store_id) where.store_id = String(req.query.store_id);

    const orders = await prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { created_at: 'desc' },
    });
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: String(req.params.id) },
      include: { items: true },
    });
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    res.json(order);
  } catch (error) {
    next(error);
  }
};

const createOrder = async (req, res, next) => {
  try {
    const { items, ...orderData } = req.body;
    const id = String(orderData.id ?? `ORD${Date.now()}`);

    const order = await prisma.order.create({
      data: {
        ...orderData,
        id,
        user_id: orderData.user_id ? String(orderData.user_id) : null,
        total_amount: orderData.total_amount ? Number(orderData.total_amount) : 0,
        status: orderData.status || "PENDING",
        payment_method: orderData.payment_method || "COD",
        payment_status: orderData.payment_status || "UNPAID",
        items: items
          ? {
              create: items.map((item, index) => ({
                id: String(item.id ?? `${id}-${index + 1}`),
                product_id: item.product_id ? String(item.product_id) : null,
                variant_id: item.variant_id ? String(item.variant_id) : null,
                quantity: item.quantity ? Number(item.quantity) : 1,
                price: item.price ? Number(item.price) : 0,
              })),
            }
          : undefined,
      },
      include: { items: true },
    });

    res.status(201).json(order);
  } catch (error) {
    console.error("❌ Lỗi tạo đơn hàng:", error);
    next(error);
  }
};

const updateOrder = async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const { items, ...orderData } = req.body;
    delete orderData.id;

    const order = await prisma.order.update({
      where: { id },
      data: {
        ...orderData,
        user_id: orderData.user_id ? String(orderData.user_id) : undefined,
        total_amount: orderData.total_amount !== undefined ? Number(orderData.total_amount) : undefined,
      },
      include: { items: true },
    });
    res.json(order);
  } catch (error) {
    next(error);
  }
};

const deleteOrder = async (req, res, next) => {
  try {
    await prisma.order.delete({ where: { id: String(req.params.id) } });
    res.json({ message: 'Xóa đơn hàng thành công' });
  } catch (error) {
    next(error);
  }
};

// ---- ORDER ITEMS ----
const getOrderItems = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.order_id) where.order_id = String(req.query.order_id);
    const items = await prisma.orderItem.findMany({ where });
    res.json(items);
  } catch (error) {
    next(error);
  }
};

// ---- CART ----
const getCartByUser = async (req, res, next) => {
  try {
    const user_id = String(req.params.user_id);
    let cart = await prisma.cart.findUnique({
      where: { user_id },
      include: { items: true },
    });
    if (!cart) {
      cart = await prisma.cart.create({
        data: { id: `CART${Date.now()}`, user_id },
        include: { items: true },
      });
    }
    res.json(cart);
  } catch (error) {
    next(error);
  }
};

const addCartItem = async (req, res, next) => {
  try {
    const user_id = String(req.params.user_id);
    let cart = await prisma.cart.findUnique({ where: { user_id } });
    if (!cart) {
      cart = await prisma.cart.create({
        data: { id: `CART${Date.now()}`, user_id },
      });
    }

    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cart_id: cart.id,
        product_id: String(req.body.product_id),
        variant_id: req.body.variant_id ? String(req.body.variant_id) : null,
      },
    });

    let item;
    if (existingItem) {
      item = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: (existingItem.quantity || 0) + (req.body.quantity || 1) },
      });
    } else {
      item = await prisma.cartItem.create({
        data: {
          id: `CI${Date.now()}`,
          cart_id: cart.id,
          product_id: String(req.body.product_id),
          variant_id: req.body.variant_id ? String(req.body.variant_id) : null,
          quantity: req.body.quantity || 1,
        },
      });
    }

    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
};

const updateCartItem = async (req, res, next) => {
  try {
    const item = await prisma.cartItem.update({
      where: { id: String(req.params.item_id) },
      data: { quantity: req.body.quantity ? Number(req.body.quantity) : undefined },
    });
    res.json(item);
  } catch (error) {
    next(error);
  }
};

const removeCartItem = async (req, res, next) => {
  try {
    await prisma.cartItem.delete({ where: { id: String(req.params.item_id) } });
    res.json({ message: 'Đã xóa khỏi giỏ hàng' });
  } catch (error) {
    next(error);
  }
};

const clearCart = async (req, res, next) => {
  try {
    const user_id = String(req.params.user_id);
    const cart = await prisma.cart.findUnique({ where: { user_id } });
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cart_id: cart.id } });
    }
    res.json({ message: 'Đã xóa giỏ hàng' });
  } catch (error) {
    next(error);
  }
};

// ---- ADDRESSES ----
const getAddressesByUser = async (req, res, next) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { user_id: String(req.params.user_id) },
    });
    res.json(addresses);
  } catch (error) {
    next(error);
  }
};

const getAllAddresses = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.user_id) where.user_id = String(req.query.user_id);
    const addresses = await prisma.address.findMany({ where });
    res.json(addresses);
  } catch (error) {
    next(error);
  }
};

const createAddress = async (req, res, next) => {
  try {
    const address = await prisma.address.create({
      data: {
        id: String(req.body.id ?? Date.now()),
        user_id: req.body.user_id ? String(req.body.user_id) : null,
        address_line: req.body.address_line,
        city: req.body.city,
        district: req.body.district,
        ward: req.body.ward,
        is_default: req.body.is_default ?? false,
      },
    });
    res.status(201).json(address);
  } catch (error) {
    next(error);
  }
};

const updateAddress = async (req, res, next) => {
  try {
    const address = await prisma.address.update({
      where: { id: String(req.params.id) },
      data: {
        address_line: req.body.address_line,
        city: req.body.city,
        district: req.body.district,
        ward: req.body.ward,
        is_default: req.body.is_default,
      },
    });
    res.json(address);
  } catch (error) {
    next(error);
  }
};

const deleteAddress = async (req, res, next) => {
  try {
    await prisma.address.delete({ where: { id: String(req.params.id) } });
    res.json({ message: 'Xóa địa chỉ thành công' });
  } catch (error) {
    next(error);
  }
};

// ---- NOTIFICATIONS ----
const getNotificationsByUser = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.user_id) where.user_id = String(req.query.user_id);
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });
    res.json(notifications);
  } catch (error) {
    next(error);
  }
};

const createNotification = async (req, res, next) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        id: String(req.body.id ?? Date.now()),
        user_id: req.body.user_id ? String(req.body.user_id) : null,
        title: req.body.title || "Thông báo mới",
        message: req.body.message || "",
        is_read: req.body.is_read ?? false,
      },
    });
    res.status(201).json(notification);
  } catch (error) {
    next(error);
  }
};

const updateNotification = async (req, res, next) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: String(req.params.id) },
      data: { is_read: req.body.is_read },
    });
    res.json(notification);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // Orders
  getAllOrders, getOrderById, createOrder, updateOrder, deleteOrder, getOrderItems,
  // Cart
  getCartByUser, addCartItem, updateCartItem, removeCartItem, clearCart,
  // Addresses
  getAllAddresses, getAddressesByUser, createAddress, updateAddress, deleteAddress,
  // Notifications
  getNotificationsByUser, createNotification, updateNotification,
};
