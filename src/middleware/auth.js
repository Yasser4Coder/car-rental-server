import { User } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyAccessToken } from '../utils/tokens.js';

export const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    throw new AppError('Authentication required', 401);
  }

  const payload = verifyAccessToken(token);
  const user = await User.findByPk(payload.sub);

  if (!user || !user.isActive) {
    throw new AppError('Account not found or inactive', 401);
  }

  req.user = user;
  next();
});

export const optionalAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) return next();

  try {
    const payload = verifyAccessToken(token);
    const user = await User.findByPk(payload.sub);
    if (user?.isActive) req.user = user;
  } catch {
    // ignore invalid token for optional auth
  }

  next();
});

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return next(new AppError('Admin access required', 403));
  }
  next();
};
