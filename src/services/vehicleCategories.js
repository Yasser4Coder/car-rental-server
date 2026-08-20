import { Op, fn, col } from 'sequelize';
import { Car, VehicleCategory } from '../models/index.js';
import { DEFAULT_VEHICLE_CATEGORIES, VEHICLE_CATEGORY_TYPES } from '../config/vehicleCategories.js';

async function loadFleetStats() {
  const rows = await Car.findAll({
    attributes: [
      'type',
      [fn('COUNT', col('id')), 'carCount'],
      [fn('MIN', col('price')), 'startingFrom'],
    ],
    where: { isActive: true },
    group: ['type'],
    raw: true,
  });

  const byType = Object.fromEntries(
    rows.map((row) => [
      row.type,
      {
        carCount: Number(row.carCount) || 0,
        startingFrom: row.startingFrom != null ? Number(row.startingFrom) : null,
      },
    ]),
  );

  for (const type of VEHICLE_CATEGORY_TYPES) {
    if (!byType[type]?.carCount) continue;
    const sample = await Car.findOne({
      attributes: ['image'],
      where: {
        isActive: true,
        type,
        image: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] },
      },
      order: [
        ['featured', 'DESC'],
        ['updatedAt', 'DESC'],
      ],
    });
    if (sample?.image) {
      byType[type].sampleImage = sample.image;
    }
  }

  return byType;
}

function defaultsByType() {
  return Object.fromEntries(DEFAULT_VEHICLE_CATEGORIES.map((item) => [item.type, item]));
}

function serializeCategory(cms, stats, { includeHidden }) {
  const defaults = defaultsByType()[cms.type] || {};
  const carCount = stats?.carCount || 0;
  const isActive = cms.isActive !== false;

  if (!includeHidden && (!isActive || carCount === 0)) {
    return null;
  }

  return {
    id: cms.id,
    type: cms.type,
    title: cms.title || defaults.title || cms.type,
    description: cms.description || defaults.description || '',
    icon: cms.icon || defaults.icon || 'directions_car',
    image: cms.image || stats?.sampleImage || null,
    sortOrder: cms.sortOrder ?? defaults.sort_order ?? 0,
    isActive,
    carCount,
    startingFrom: stats?.startingFrom ?? null,
    href: `/cars?type=${encodeURIComponent(cms.type)}`,
  };
}

/**
 * @param {{ publicOnly?: boolean }} [opts]
 */
export async function listVehicleCategories(opts = {}) {
  const publicOnly = Boolean(opts.publicOnly);
  const [cmsRows, stats] = await Promise.all([
    VehicleCategory.findAll({
      order: [
        ['sortOrder', 'ASC'],
        ['id', 'ASC'],
      ],
    }),
    loadFleetStats(),
  ]);

  const byType = Object.fromEntries(cmsRows.map((row) => [row.type, row]));

  const orderedTypes = [
    ...VEHICLE_CATEGORY_TYPES,
    ...Object.keys(stats).filter((t) => !VEHICLE_CATEGORY_TYPES.includes(t)),
  ];

  const items = [];
  for (const type of orderedTypes) {
    const cms = byType[type];
    if (!cms) {
      if (publicOnly) continue;
      const defaults = defaultsByType()[type];
      if (!defaults && !stats[type]) continue;
      items.push({
        id: null,
        type,
        title: defaults?.title || type,
        description: defaults?.description || '',
        icon: defaults?.icon || 'directions_car',
        image: stats[type]?.sampleImage || null,
        sortOrder: defaults?.sort_order ?? 999,
        isActive: true,
        carCount: stats[type]?.carCount || 0,
        startingFrom: stats[type]?.startingFrom ?? null,
        href: `/cars?type=${encodeURIComponent(type)}`,
      });
      continue;
    }

    const item = serializeCategory(cms.get({ plain: true }), stats[type], {
      includeHidden: !publicOnly,
    });
    if (item) items.push(item);
  }

  return items.sort((a, b) => a.sortOrder - b.sortOrder || (a.id || 0) - (b.id || 0));
}
