import { Router } from 'express';
import { Restaurant } from '../models/Restaurant.js';
import { MenuItem } from '../models/MenuItem.js';
import { Order } from '../models/Order.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { restaurantSchema, restaurantUpdateSchema } from '../validation/schemas.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { search = '', cuisine = '', eco = 'false', sort = 'recommended' } = req.query;
    const filter = { isActive: true };

    if (search.trim()) {
      const pattern = new RegExp(escapeRegex(search.trim()), 'i');
      filter.$or = [
        { name: pattern },
        { area: pattern },
        { cuisines: pattern },
        { description: pattern },
      ];
    }
    if (cuisine && cuisine !== 'All') filter.cuisines = cuisine;
    if (String(eco) === 'true') filter.isEcoCertified = true;

    const sortMap = {
      recommended: { rating: -1 },
      rating: { rating: -1 },
      delivery: { deliveryTimeMins: 1 },
      price_low: { priceForTwo: 1 },
      price_high: { priceForTwo: -1 },
    };

    const restaurants = await Restaurant.find(filter)
      .sort(sortMap[sort] || sortMap.recommended)
      .limit(60);

    res.json({ count: restaurants.length, restaurants });
  })
);

router.get(
  '/cuisines',
  asyncHandler(async (_req, res) => {
    const cuisines = await Restaurant.distinct('cuisines', { isActive: true });
    res.json({ cuisines: cuisines.sort() });
  })
);

router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const restaurant = await Restaurant.findOne({ slug: req.params.slug, isActive: true });
    if (!restaurant) throw new ApiError(404, 'Restaurant not found.');

    const menu = await MenuItem.find({ restaurant: restaurant._id }).sort({ category: 1, popularity: -1 });
    res.json({ restaurant, menu });
  })
);

router.post(
  '/',
  protect,
  adminOnly,
  validate(restaurantSchema),
  asyncHandler(async (req, res) => {
    const payload = { ...req.body, slug: req.body.slug || slugify(req.body.name) };
    const restaurant = await Restaurant.create(payload);
    res.status(201).json({ restaurant });
  })
);

router.put(
  '/:id',
  protect,
  adminOnly,
  validate(restaurantUpdateSchema),
  asyncHandler(async (req, res) => {
    const payload = { ...req.body };
    if (payload.name && !payload.slug) payload.slug = slugify(payload.name);
    if (payload.slug) payload.slug = slugify(payload.slug);
    const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });
    if (!restaurant) throw new ApiError(404, 'Restaurant not found.');
    res.json({ restaurant });
  })
);

router.delete(
  '/:id',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) throw new ApiError(404, 'Restaurant not found.');

    const orderCount = await Order.countDocuments({ restaurant: restaurant._id });
    if (orderCount > 0) {
      throw new ApiError(
        409,
        'This restaurant has order history and cannot be deleted. Deactivate it instead.'
      );
    }

    await MenuItem.deleteMany({ restaurant: restaurant._id });
    await restaurant.deleteOne();
    res.json({ message: 'Restaurant deleted.' });
  })
);

export default router;
