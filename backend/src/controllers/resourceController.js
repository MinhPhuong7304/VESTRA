const prisma = require('../config/prisma');
const { listOptions, pickFilters, toStringId } = require('../utils/query');

const resourceConfig = {
  users: {
    model: prisma.user,
    filters: ['username', 'email', 'phone', 'user_type', 'account_status', 'wallet_address'],
    sorts: ['id', 'username', 'email', 'created_at', 'user_type'],
    normalize: (body) => {
      const normalized = { ...body };
      
      // Auto-hash password if provided
      if (body.password) {
        const bcrypt = require('bcryptjs');
        normalized.password = bcrypt.hashSync(body.password, 10);
      }
      
      // Auto-create custodial wallet if not present and it's a creation request (no body.id)
      if (!body.wallet_address && !body.id) {
        try {
          const { createCustodialWallet } = require('../web3/walletHelper');
          const wallet = createCustodialWallet();
          normalized.wallet_address = wallet.address;
          console.log(`🔑 [Admin API] Đã tự động tạo ví ngầm cho tài khoản: ${wallet.address}`);
        } catch (e) {
          console.error("❌ [Admin API] Lỗi khi tạo ví ngầm tự động:", e.message);
        }
      }
      
      return {
        ...normalized,
        id: toStringId(body.id ?? `usr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`),
        wallet_address: normalized.wallet_address ? String(normalized.wallet_address) : undefined,
      };
    },
  },
  banners: {
    model: prisma.banner,
    filters: ['status'],
    sorts: ['id', 'title', 'created_at', 'display_order'],
    normalize: (body) => ({
      ...body,
      id: toStringId(body.id ?? `BN${Date.now()}`),
      click_count: body.click_count === undefined ? undefined : Number(body.click_count),
      display_order: body.display_order === undefined ? undefined : Number(body.display_order),
    }),
  },
  vouchers: {
    model: prisma.voucher,
    filters: ['code', 'status', 'discount_type', 'store_id'],
    sorts: ['id', 'code', 'start_date', 'end_date', 'status'],
    normalize: (body) => ({
      id: toStringId(body.id ?? `VC${Date.now()}`),
      code: body.code ? String(body.code).toUpperCase().trim() : undefined,
      description: body.description !== undefined ? String(body.description) : undefined,
      discount_type: body.discount_type ? String(body.discount_type) : undefined,
      discount_value: body.discount_value === undefined ? undefined : Number(body.discount_value),
      max_discount: body.max_discount === undefined || body.max_discount === null || body.max_discount === '' ? null : Number(body.max_discount),
      min_order_value: body.min_order_value === undefined ? undefined : Number(body.min_order_value),
      start_date: body.start_date ? new Date(body.start_date) : null,
      end_date: body.end_date ? new Date(body.end_date) : null,
      status: body.status ? String(body.status) : undefined,
      store_id: body.store_id ? String(body.store_id) : null,
    }),
    include: {
      _count: {
        select: { orders: true }
      }
    }
  },
  stores: {
    model: prisma.store,
    filters: ['owner_id', 'status'],
    sorts: ['id', 'name', 'created_at'],
    normalize: (body) => ({
      ...body,
      id: toStringId(body.id ?? `STR${Date.now()}`),
    }),
  },
  shifts: {
    model: prisma.shift,
    filters: ['staffId', 'staffName', 'date'],
    sorts: ['id', 'date', 'startTime'],
    normalize: (body) => ({
      ...body,
      id: toStringId(body.id ?? Date.now()),
      staffId: body.staffId === undefined ? undefined : toStringId(body.staffId),
    }),
  },
  chats: {
    model: prisma.chat,
    filters: ['customer_id', 'chat_status'],
    sorts: ['id', 'updated_at', 'started_at'],
    normalize: (body) => ({
      ...body,
      id: toStringId(body.id ?? Date.now()),
      customer_id: body.customer_id === undefined ? undefined : toStringId(body.customer_id),
      unread: body.unread === undefined ? undefined : Number(body.unread),
    }),
  },
  chat_messages: {
    model: prisma.chatMessage,
    filters: ['chat_id', 'sender_id', 'sender_type'],
    sorts: ['id', 'sent_at'],
    normalize: (body) => ({
      ...body,
      id: toStringId(body.id ?? Date.now()),
      chat_id: toStringId(body.chat_id),
      sender_id: body.sender_id === undefined ? undefined : toStringId(body.sender_id),
    }),
  },
  reviews: {
    model: prisma.review,
    filters: ['product_id', 'customer_id'],
    sorts: ['id', 'created_at', 'rating'],
    normalize: (body) => ({
      ...body,
      id: toStringId(body.id ?? Date.now()),
      customer_id: body.customer_id === undefined ? undefined : toStringId(body.customer_id),
      product_id: toStringId(body.product_id),
      rating: body.rating === undefined ? undefined : Number(body.rating),
    }),
  },
};

const cleanUndefined = (data) =>
  Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));

const createResourceController = (resourceName) => {
  const config = resourceConfig[resourceName];

  const list = async (req, res, next) => {
    try {
      let where = pickFilters(req.query, config.filters);

      if (resourceName === 'users' && req.query.username) {
        const input = String(req.query.username);
        delete where.username;
        where = {
          ...where,
          OR: [
            { username: input },
            { email: input },
            { phone: input }
          ]
        };
      }

      const options = listOptions(req.query, config.sorts);
      const rows = await config.model.findMany({
        where,
        ...options,
        orderBy: options.orderBy,
        ...(config.include ? { include: config.include } : {}),
      });
      res.json(rows);
    } catch (error) {
      next(error);
    }
  };

  const getById = async (req, res, next) => {
    try {
      const row = await config.model.findUnique({
        where: { id: String(req.params.id) },
        ...(config.include ? { include: config.include } : {}),
      });
      if (!row) return res.status(404).json({ message: 'Không tìm thấy dữ liệu' });
      res.json(row);
    } catch (error) {
      next(error);
    }
  };

  const create = async (req, res, next) => {
    try {
      const row = await config.model.create({
        data: cleanUndefined(config.normalize(req.body)),
      });
      res.status(201).json(row);
    } catch (error) {
      next(error);
    }
  };

  const update = async (req, res, next) => {
    try {
      const data = cleanUndefined(config.normalize({ ...req.body, id: String(req.params.id) }));
      delete data.id;

      const row = await config.model.update({
        where: { id: String(req.params.id) },
        data,
      });
      res.json(row);
    } catch (error) {
      next(error);
    }
  };

  const remove = async (req, res, next) => {
    try {
      await config.model.delete({ where: { id: String(req.params.id) } });
      res.json({ message: 'Xóa thành công' });
    } catch (error) {
      next(error);
    }
  };

  return { create, getById, list, remove, update };
};

module.exports = {
  createResourceController,
};
