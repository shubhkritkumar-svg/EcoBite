import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function extractToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  return null;
}

export const protect = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) throw new ApiError(401, 'Please log in to continue.');

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    throw new ApiError(401, 'Your session is invalid or has expired. Please log in again.');
  }

  const user = await User.findById(payload.sub);
  if (!user) throw new ApiError(401, 'This account no longer exists.');

  req.user = user;
  next();
});

export const adminOnly = (req, _res, next) => {
  if (req.user?.role !== 'admin') {
    return next(new ApiError(403, 'Admin access is required for this action.'));
  }
  next();
};
