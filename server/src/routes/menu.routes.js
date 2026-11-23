import { Router } from 'express';
import { MenuItem } from '../models/MenuItem.js';
import { Restaurant } from '../models/Restaurant.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { menuItemSchema, menuItemUpdateSchema } from '../validation/schemas.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { restaurantId, category, veg } = req.query;
    if (!restaurantId) throw new ApiError(400, 'restaurantId query parameter is required.');

    const filter = { restaurant: restaurantId };
    if (category) filter.category = category;
    if (String(veg) === 'true') filter.isVeg = true;

    const items = await MenuItem.find(filter).sort({ category: 1, popularity: -1 });
    res.json({ count: items.length, items });
  })
);

router.post(
  '/',
  protect,
  adminOnly,
  validate(menuItemSchema),
  asyncHandler(async (req, res) => {
    const restaurant = await Restaurant.exists({ _id: req.body.restaurant });
    if (!restaurant) throw new ApiError(404, 'Restaurant not found.');
    const item = await MenuItem.create(req.body);
    res.status(201).json({ item });
  })
);

router.put(
  '/:id',
  protect,
  adminOnly,
  validate(menuItemUpdateSchema),
  asyncHandler(async (req, res) => {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!item) throw new ApiError(404, 'Menu item not found.');
    res.json({ item });
  })
);

router.delete(
  '/:id',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) throw new ApiError(404, 'Menu item not found.');
    res.json({ message: 'Menu item deleted.' });
  })
);

export default router;
