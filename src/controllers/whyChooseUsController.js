import { WhyChooseUsItem } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listPublicWhyChooseUs = asyncHandler(async (_req, res) => {
  const rows = await WhyChooseUsItem.findAll({
    where: { isActive: true },
    order: [
      ['sortOrder', 'ASC'],
      ['id', 'ASC'],
    ],
  });
  res.json({ data: rows });
});

export const adminListWhyChooseUs = asyncHandler(async (_req, res) => {
  const rows = await WhyChooseUsItem.findAll({
    order: [
      ['sortOrder', 'ASC'],
      ['id', 'ASC'],
    ],
  });
  res.json({ data: rows });
});

export const adminCreateWhyChooseUs = asyncHandler(async (req, res) => {
  const item = await WhyChooseUsItem.create(req.body);
  res.status(201).json({ data: item });
});

export const adminUpdateWhyChooseUs = asyncHandler(async (req, res) => {
  const item = await WhyChooseUsItem.findByPk(req.params.id);
  if (!item) throw new AppError('Item not found', 404);
  await item.update(req.body);
  res.json({ data: item });
});

export const adminDeleteWhyChooseUs = asyncHandler(async (req, res) => {
  const item = await WhyChooseUsItem.findByPk(req.params.id);
  if (!item) throw new AppError('Item not found', 404);
  await item.destroy();
  res.json({ data: { id: item.id } });
});
