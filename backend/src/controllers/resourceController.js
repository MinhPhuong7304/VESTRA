const prisma = require('../config/prisma');
const { listOptions, pickFilters, toStringId } = require('../utils/query');

const resourceConfig = {
  users: {
    model: prisma.user,
    filters: ['username', 'email', 'phone', 'user_type', 'account_status', 'wallet_address'],
    sorts: ['id', 'username', 'email', 'created_at', 'user_type'],
    normalize: (body) => ({
      ...body,
      id: toStringId(body.id ?? Date.now()),
      wallet_address: body.wallet_address ? String(body.wallet_address) : undefined,
    }),
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
    filters: ['code', 'status', 'discount_type'],
    sorts: ['id', 'code', 'start_date', 'end_date', 'status'],
    normalize: (body) => ({
      ...body,
      id: toStringId(body.id ?? `VC${Date.now()}`),
      discount_value: body.discount_value === undefined ? undefined : Number(body.discount_value),
      max_discount: body.max_discount === undefined ? undefined : Number(body.max_discount),
      min_order_value: body.min_order_value === undefined ? undefined : Number(body.min_order_value),
      start_date: body.start_date ? new Date(body.start_date) : undefined,
      end_date: body.end_date ? new Date(body.end_date) : undefined,
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
      });
      res.json(rows);
    } catch (error) {
      next(error);
    }
  };

  const getById = async (req, res, next) => {
    try {
      const row = await config.model.findUnique({ where: { id: String(req.params.id) } });
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
