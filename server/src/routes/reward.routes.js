import { Router } from 'express';
import { Order } from '../models/Order.js';
import { Reward } from '../models/Reward.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ecoTier, ECO_ASSUMPTIONS } from '../utils/eco.js';

const router = Router();
router.use(protect);

router.get(
  '/summary',
  asyncHandler(async (req, res) => {
    const user = req.user;

    const [ledger, orderCount, ecoOrderCount, savingsByMode] = await Promise.all([
      Reward.find({ user: user._id }).sort({ createdAt: -1 }).limit(20),
      Order.countDocuments({ user: user._id }),
      Order.countDocuments({ user: user._id, 'eco.co2SavedKg': { $gt: 0 }, status: { $ne: 'cancelled' } }),
      Order.aggregate([
        { $match: { user: user._id, status: { $ne: 'cancelled' } } },
        {
          $group: {
            _id: '$deliveryMode',
            orders: { $sum: 1 },
            saved: { $sum: '$eco.co2SavedKg' },
          },
        },
        { $sort: { saved: -1 } },
      ]),
    ]);

    const tier = ecoTier(user.greenPoints);

    res.json({
      greenPoints: user.greenPoints,
      lifetimeSavingsKg: Number(user.lifetimeSavingsKg.toFixed(3)),
      tier,
      progress:
        tier.nextAt === null
          ? 100
          : Math.min(100, Math.round((user.greenPoints / tier.nextAt) * 100)),
      orderCount,
      ecoOrderCount,
      treesEquivalent: Number((user.lifetimeSavingsKg / 21).toFixed(2)),
      savingsByMode,
      assumptions: ECO_ASSUMPTIONS,
      ledger,
    });
  })
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = 25;
    const [ledger, total] = await Promise.all([
      Reward.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Reward.countDocuments({ user: req.user._id }),
    ]);
    res.json({ ledger, total, page, pages: Math.ceil(total / limit) });
  })
);

export default router;
