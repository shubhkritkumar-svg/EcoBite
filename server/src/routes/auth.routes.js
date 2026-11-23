import { Router } from 'express';
import { User } from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, registerSchema } from '../validation/schemas.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { signToken } from '../utils/token.js';

const router = Router();

router.post(
  '/register',
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const { name, email, password, phone } = req.body;

    const existing = await User.findOne({ email });
    if (existing) throw new ApiError(409, 'An account with this email already exists.');

    const user = new User({ name, email, phone: phone || undefined });
    await user.setPassword(password);
    await user.save();

    res.status(201).json({ token: signToken(user), user });
  })
);

router.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+passwordHash');

    if (!user || !(await user.comparePassword(password))) {
      throw new ApiError(401, 'Incorrect email or password.');
    }

    user.passwordHash = undefined;
    res.json({ token: signToken(user), user });
  })
);

router.get(
  '/me',
  protect,
  asyncHandler(async (req, res) => {
    res.json({ user: req.user });
  })
);

export default router;
