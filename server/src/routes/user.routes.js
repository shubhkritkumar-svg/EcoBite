import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { addressSchema, updateProfileSchema } from '../validation/schemas.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(protect);

router.get(
  '/me',
  asyncHandler(async (req, res) => {
    res.json({ user: req.user });
  })
);

router.patch(
  '/me',
  validate(updateProfileSchema),
  asyncHandler(async (req, res) => {
    const { name, phone } = req.body;
    if (name !== undefined) req.user.name = name;
    if (phone !== undefined) req.user.phone = phone;
    await req.user.save();
    res.json({ user: req.user });
  })
);

router.post(
  '/me/addresses',
  validate(addressSchema),
  asyncHandler(async (req, res) => {
    const address = req.body;
    if (req.user.addresses.length === 0) address.isDefault = true;
    if (address.isDefault) {
      req.user.addresses.forEach((saved) => {
        saved.isDefault = false;
      });
    }
    req.user.addresses.push(address);
    await req.user.save();
    res.status(201).json({ addresses: req.user.addresses });
  })
);

router.delete(
  '/me/addresses/:addressId',
  asyncHandler(async (req, res) => {
    const address = req.user.addresses.id(req.params.addressId);
    if (!address) throw new ApiError(404, 'Address not found.');

    address.deleteOne();
    if (!req.user.addresses.some((saved) => saved.isDefault) && req.user.addresses[0]) {
      req.user.addresses[0].isDefault = true;
    }
    await req.user.save();
    res.json({ addresses: req.user.addresses });
  })
);

export default router;
