import { Router } from 'express';
import { Order } from '../models/Order.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createOrderSchema } from '../validation/schemas.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { advanceOrder, cancelOrder, placeOrder } from '../services/order.service.js';

const router = Router();
router.use(protect);

const canAccess = (order, user) =>
  String(order.user) === String(user._id) || user.role === 'admin';

router.post(
  '/',
  validate(createOrderSchema),
  asyncHandler(async (req, res) => {
    const { order, greenPointsEarned } = await placeOrder(req.user, req.body);
    const populated = await Order.findById(order._id).populate('restaurant', 'name image slug area');
    res.status(201).json({ order: populated, greenPointsEarned });
  })
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = 10;
    const filter = { user: req.user._id };

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('restaurant', 'name image slug area'),
      Order.countDocuments(filter),
    ]);

    res.json({ orders, total, page, pages: Math.ceil(total / limit) });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).populate(
      'restaurant',
      'name image slug area deliveryTimeMins'
    );
    if (!order) throw new ApiError(404, 'Order not found.');
    if (!canAccess(order, req.user)) throw new ApiError(403, 'You cannot view this order.');
    res.json({ order });
  })
);

router.post(
  '/:id/advance',
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order) throw new ApiError(404, 'Order not found.');
    if (!canAccess(order, req.user)) throw new ApiError(403, 'You cannot update this order.');
    await advanceOrder(order);
    const populated = await Order.findById(order._id).populate('restaurant', 'name image slug area');
    res.json({ order: populated, simulated: true });
  })
);

router.patch(
  '/:id/cancel',
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order) throw new ApiError(404, 'Order not found.');
    if (!canAccess(order, req.user)) throw new ApiError(403, 'You cannot cancel this order.');
    await cancelOrder(order);
    const populated = await Order.findById(order._id).populate('restaurant', 'name image slug area');
    res.json({ order: populated });
  })
);

export default router;
