import { Router } from 'express';
import { Order, ACTIVE_STATUSES } from '../models/Order.js';
import { Restaurant } from '../models/Restaurant.js';
import { MenuItem } from '../models/MenuItem.js';
import { User } from '../models/User.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { orderStatusSchema } from '../validation/schemas.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { setOrderStatus } from '../services/order.service.js';

const router = Router();
router.use(protect, adminOnly);

router.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const [orderCount, activeOrders, customerCount, restaurantCount, revenue, eco, recentOrders] =
      await Promise.all([
        Order.countDocuments(),
        Order.countDocuments({ status: { $in: ACTIVE_STATUSES } }),
        User.countDocuments({ role: 'customer' }),
        Restaurant.countDocuments({ isActive: true }),
        Order.aggregate([
          { $match: { status: { $ne: 'cancelled' } } },
          { $group: { _id: null, revenue: { $sum: '$total' }, avgOrder: { $avg: '$total' } } },
        ]),
        Order.aggregate([
          { $match: { status: { $ne: 'cancelled' } } },
          { $group: { _id: null, co2: { $sum: '$eco.co2SavedKg' }, points: { $sum: '$eco.greenPointsEarned' } } },
        ]),
        Order.find()
          .sort({ createdAt: -1 })
          .limit(6)
          .populate('user', 'name')
          .populate('restaurant', 'name'),
      ]);

    res.json({
      stats: {
        orderCount,
        activeOrders,
        customerCount,
        restaurantCount,
        revenue: revenue[0]?.revenue || 0,
        avgOrderValue: Math.round(revenue[0]?.avgOrder || 0),
        co2SavedKg: Number((eco[0]?.co2 || 0).toFixed(2)),
        greenPointsAwarded: eco[0]?.points || 0,
      },
      recentOrders,
    });
  })
);

router.get(
  '/orders',
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = 12;
    const filter = {};

    if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;

    if (req.query.search?.trim()) {
      const pattern = new RegExp(req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const users = await User.find({ $or: [{ name: pattern }, { email: pattern }] }).select('_id');
      filter.$or = [{ user: { $in: users.map((user) => user._id) } }];
      if (/^[0-9a-fA-F]{24}$/.test(req.query.search.trim())) {
        filter.$or.push({ _id: req.query.search.trim() });
      }
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('user', 'name email')
        .populate('restaurant', 'name'),
      Order.countDocuments(filter),
    ]);

    res.json({ orders, total, page, pages: Math.ceil(total / limit) });
  })
);

router.get(
  '/restaurants',
  asyncHandler(async (_req, res) => {
    const restaurants = await Restaurant.find().sort({ name: 1 });
    const counts = await MenuItem.aggregate([
      { $group: { _id: '$restaurant', count: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((row) => [String(row._id), row.count]));

    res.json({
      restaurants: restaurants.map((restaurant) => ({
        ...restaurant.toJSON(),
        menuItemCount: countMap.get(String(restaurant._id)) || 0,
      })),
    });
  })
);

router.patch(
  '/orders/:id/status',
  validate(orderStatusSchema),
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order) throw new ApiError(404, 'Order not found.');
    await setOrderStatus(order, req.body.status);
    const populated = await Order.findById(order._id)
      .populate('user', 'name email')
      .populate('restaurant', 'name');
    res.json({ order: populated });
  })
);

export default router;
