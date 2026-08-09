import {
  getLocationStats,
  getOverviewStats,
  getTimeseries,
  getTopCars,
} from '../services/statsService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const overview = asyncHandler(async (_req, res) => {
  res.json({ data: await getOverviewStats() });
});

export const timeseries = asyncHandler(async (req, res) => {
  const range = Number(String(req.query.range || '30d').replace('d', '')) || 30;
  res.json({ data: await getTimeseries(range) });
});

export const topCars = asyncHandler(async (req, res) => {
  res.json({ data: await getTopCars(Number(req.query.limit) || 5) });
});

export const locations = asyncHandler(async (_req, res) => {
  res.json({ data: await getLocationStats() });
});
