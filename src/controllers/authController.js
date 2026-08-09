import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { RefreshToken, User } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  createRefreshTokenValue,
  hashToken,
  refreshExpiryDate,
  signAccessToken,
} from '../utils/tokens.js';

const REFRESH_COOKIE = 'refreshToken';

function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: env.nodeEnv === 'production' ? 'none' : 'lax',
    maxAge: env.jwt.refreshExpiresDays * 24 * 60 * 60 * 1000,
    path: '/api/auth',
  });
}

function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
}

async function issueSession(user, req, res) {
  const accessToken = signAccessToken(user);
  const refreshToken = createRefreshTokenValue();

  await RefreshToken.create({
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    expiresAt: refreshExpiryDate(),
    userAgent: req.get('user-agent') || null,
    ip: req.ip,
  });

  setRefreshCookie(res, refreshToken);

  return {
    user: user.toSafeJSON(),
    token: accessToken,
  };
}

export const register = asyncHandler(async (req, res) => {
  const { fullName, email, phone, password } = req.body;
  const existing = await User.findOne({ where: { email } });
  if (existing) throw new AppError('Email already registered', 409);

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    fullName,
    email,
    phone: phone || null,
    passwordHash,
    role: 'client',
  });

  const session = await issueSession(user, req, res);
  res.status(201).json(session);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user || !user.isActive) throw new AppError('Invalid email or password', 401);

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new AppError('Invalid email or password', 401);

  const session = await issueSession(user, req, res);
  res.json(session);
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) throw new AppError('Refresh token missing', 401);

  const tokenHash = hashToken(token);
  const stored = await RefreshToken.findOne({
    where: { tokenHash, revokedAt: null },
    include: [{ model: User, as: 'user' }],
  });

  if (!stored || stored.expiresAt < new Date() || !stored.user?.isActive) {
    clearRefreshCookie(res);
    throw new AppError('Invalid refresh token', 401);
  }

  stored.revokedAt = new Date();
  await stored.save();

  const session = await issueSession(stored.user, req, res);
  res.json(session);
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (token) {
    await RefreshToken.update(
      { revokedAt: new Date() },
      { where: { tokenHash: hashToken(token), revokedAt: null } },
    );
  }
  clearRefreshCookie(res);
  res.json({ message: 'Logged out' });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user.toSafeJSON() });
});

export const updateMe = asyncHandler(async (req, res) => {
  const { fullName, phone, password } = req.body;
  if (fullName !== undefined) req.user.fullName = fullName;
  if (phone !== undefined) req.user.phone = phone;
  if (password) req.user.passwordHash = await bcrypt.hash(password, 12);
  await req.user.save();
  res.json({ user: req.user.toSafeJSON() });
});
