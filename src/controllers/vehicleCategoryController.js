import { VehicleCategory } from '../models/index.js';
import { listVehicleCategories } from '../services/vehicleCategories.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listPublicVehicleCategories = asyncHandler(async (_req, res) => {
  const data = await listVehicleCategories({ publicOnly: true });
  res.json({ data });
});

export const adminListVehicleCategories = asyncHandler(async (_req, res) => {
  const data = await listVehicleCategories({ publicOnly: false });
  res.json({ data });
});

export const adminCreateVehicleCategory = asyncHandler(async (req, res) => {
  const existing = await VehicleCategory.findOne({ where: { type: req.body.type } });
  if (existing) {
    throw new AppError('A category for this fleet type already exists', 409);
  }
  const item = await VehicleCategory.create(req.body);
  const [enriched] = (await listVehicleCategories({ publicOnly: false })).filter(
    (row) => row.id === item.id,
  );
  res.status(201).json({ data: enriched || item });
});

export const adminUpdateVehicleCategory = asyncHandler(async (req, res) => {
  const item = await VehicleCategory.findByPk(req.params.id);
  if (!item) throw new AppError('Category not found', 404);
  await item.update(req.body);
  const [enriched] = (await listVehicleCategories({ publicOnly: false })).filter(
    (row) => row.id === item.id,
  );
  res.json({ data: enriched || item });
});

export const adminDeleteVehicleCategory = asyncHandler(async (req, res) => {
  const item = await VehicleCategory.findByPk(req.params.id);
  if (!item) throw new AppError('Category not found', 404);
  await item.destroy();
  res.json({ data: { id: item.id } });
});
