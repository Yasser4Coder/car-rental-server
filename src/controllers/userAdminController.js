import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import { Booking, User } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function escapeLike(value) {
  return String(value).replace(/[%_\\]/g, '\\$&');
}

async function countActiveAdmins(excludeId = null) {
  const where = { role: 'admin', isActive: true };
  if (excludeId != null) {
    where.id = { [Op.ne]: excludeId };
  }
  return User.count({ where });
}

/** Prevent locking yourself (or the last admin) out of the dashboard. */
async function assertAdminSafety(target, payload, actorId) {
  const nextRole = payload.role ?? target.role;
  const nextActive = payload.isActive ?? target.isActive;
  const wasAdmin = target.role === 'admin' && target.isActive;
  const staysAdmin = nextRole === 'admin' && nextActive;

  if (wasAdmin && !staysAdmin) {
    const others = await countActiveAdmins(target.id);
    if (others < 1) {
      throw new AppError('Cannot remove or deactivate the last active admin', 400);
    }
  }

  if (Number(target.id) === Number(actorId)) {
    if (payload.isActive === false) {
      throw new AppError('You cannot deactivate your own account', 400);
    }
    if (payload.role === 'client') {
      throw new AppError('You cannot demote your own account', 400);
    }
  }
}

export const adminListUsers = asyncHandler(async (req, res) => {
  const { q, role, isActive, page, limit } = req.query;
  const where = {};

  if (role) where.role = role;
  if (isActive !== undefined) where.isActive = isActive;

  if (q?.trim()) {
    const prefix = `${escapeLike(q.trim())}%`;
    const contains = `%${escapeLike(q.trim())}%`;
    where[Op.or] = [
      { fullName: { [Op.like]: contains } },
      { email: { [Op.like]: contains } },
      { phone: { [Op.like]: contains } },
      { email: { [Op.like]: prefix } },
    ];
  }

  const offset = (page - 1) * limit;
  const { rows, count } = await User.findAndCountAll({
    attributes: ['id', 'fullName', 'email', 'phone', 'role', 'isActive', 'createdAt', 'updatedAt'],
    where,
    order: [
      ['role', 'ASC'],
      ['createdAt', 'DESC'],
    ],
    limit,
    offset,
  });

  res.json({
    data: rows.map((u) => u.toSafeJSON()),
    meta: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit) || 1,
    },
  });
});

export const adminGetUser = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id, {
    attributes: ['id', 'fullName', 'email', 'phone', 'role', 'isActive', 'createdAt', 'updatedAt'],
  });
  if (!user) throw new AppError('User not found', 404);

  const bookingCount = await Booking.count({ where: { userId: user.id } });

  res.json({
    data: {
      ...user.toSafeJSON(),
      bookingCount,
    },
  });
});

export const adminCreateUser = asyncHandler(async (req, res) => {
  const { fullName, email, phone, password, role, isActive } = req.body;
  const existing = await User.findOne({ where: { email } });
  if (existing) throw new AppError('Email already registered', 409);

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    fullName,
    email: email.toLowerCase(),
    phone: phone || null,
    passwordHash,
    role,
    isActive,
  });

  res.status(201).json({ data: user.toSafeJSON() });
});

export const adminUpdateUser = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) throw new AppError('User not found', 404);

  const payload = { ...req.body };
  await assertAdminSafety(user, payload, req.user.id);

  if (payload.email && payload.email.toLowerCase() !== user.email.toLowerCase()) {
    const existing = await User.findOne({ where: { email: payload.email.toLowerCase() } });
    if (existing) throw new AppError('Email already registered', 409);
    payload.email = payload.email.toLowerCase();
  }

  if (payload.password) {
    payload.passwordHash = await bcrypt.hash(payload.password, 12);
    delete payload.password;
  }

  await user.update(payload);
  res.json({ data: user.toSafeJSON() });
});

export const adminDeleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) throw new AppError('User not found', 404);

  if (Number(user.id) === Number(req.user.id)) {
    throw new AppError('You cannot delete your own account', 400);
  }

  if (user.role === 'admin' && user.isActive) {
    const others = await countActiveAdmins(user.id);
    if (others < 1) {
      throw new AppError('Cannot delete the last active admin', 400);
    }
  }

  const bookingCount = await Booking.count({ where: { userId: user.id } });
  if (bookingCount > 0) {
    await user.update({ isActive: false });
    return res.json({
      data: user.toSafeJSON(),
      message: 'User deactivated (has bookings)',
    });
  }

  await user.destroy();
  res.json({ message: 'User deleted' });
});
