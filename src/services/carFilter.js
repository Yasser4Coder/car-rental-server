import { Op, literal } from 'sequelize';
import sequelize from '../config/database.js';
import { Booking, Car } from '../models/index.js';
import { getCached, setCached, CACHE_TTL } from '../utils/cache.js';
import { withCarMedia, withCarsMedia } from '../utils/media.js';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const BUSY_STATUSES = ['pending', 'confirmed', 'active'];

/** Lean columns for fleet cards / filters (avoid SELECT *). */
export const CAR_LIST_ATTRIBUTES = [
  'id',
  'name',
  'brand',
  'model',
  'year',
  'type',
  'price',
  'deposit',
  'dailyKm',
  'featured',
  'isActive',
  'image',
  'gallery',
  'alt',
  'color',
  'transmission',
  'seats',
  'doors',
  'powertrain',
  'drivetrain',
  'rating',
  'reviews',
  'badges',
  'locations',
  'highlights',
];

export const CAR_FEATURED_ATTRIBUTES = [
  'id',
  'name',
  'brand',
  'model',
  'year',
  'type',
  'price',
  'deposit',
  'dailyKm',
  'featured',
  'image',
  'alt',
  'transmission',
  'seats',
  'powertrain',
  'rating',
  'reviews',
  'badges',
];

function buildOrder(sort) {
  switch (sort) {
    case 'price-asc':
      return [
        ['price', 'ASC'],
        ['id', 'ASC'],
      ];
    case 'price-desc':
      return [
        ['price', 'DESC'],
        ['id', 'ASC'],
      ];
    case 'name':
      return [
        ['name', 'ASC'],
        ['id', 'ASC'],
      ];
    default:
      return [
        ['featured', 'DESC'],
        ['price', 'ASC'],
        ['id', 'ASC'],
      ];
  }
}

function escapeLike(value) {
  return value.replace(/[%_\\]/g, '\\$&');
}

/**
 * Text search: FULLTEXT when available, else prefix LIKE (index-friendly).
 * Avoids leading-wildcard LIKE '%term%'.
 */
function buildTextSearch(q) {
  const term = q.trim();
  if (!term) return null;

  // Boolean FULLTEXT: +word* requires word as prefix match
  const tokens = term
    .split(/\s+/)
    .map((t) => t.replace(/[+\-><()~*"@]+/g, ''))
    .filter((t) => t.length >= 2);

  if (tokens.length) {
    const against = tokens.map((t) => `+${t}*`).join(' ');
    return {
      mode: 'fulltext',
      clause: literal(
        `MATCH(name, brand, model) AGAINST(${sequelize.escape(against)} IN BOOLEAN MODE)`,
      ),
    };
  }

  const prefix = `${escapeLike(term)}%`;
  return {
    mode: 'prefix',
    clause: {
      [Op.or]: [
        { name: { [Op.like]: prefix } },
        { brand: { [Op.like]: prefix } },
        { model: { [Op.like]: prefix } },
      ],
    },
  };
}

export async function listCars(filters = {}) {
  const {
    location,
    type,
    q,
    sort = 'featured',
    date,
    returnDate,
    page = 1,
    limit = 12,
    featured,
    includeInactive = false,
    attributes,
  } = filters;

  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(50, Math.max(1, Number(limit) || 12));
  const offset = (safePage - 1) * safeLimit;

  const cacheKey =
    !includeInactive && !date && !q && !location
      ? `cars:${type || 'any'}:${featured ?? 'x'}:${sort}:${safePage}:${safeLimit}`
      : null;

  if (cacheKey) {
    const hit = getCached(cacheKey);
    if (hit) return hit;
  }

  const where = {};
  const and = [];

  if (!includeInactive) {
    where.isActive = true;
  }

  if (type && type !== 'any') {
    where.type = type;
  }

  if (featured !== undefined) {
    where.featured = featured;
  }

  if (q?.trim()) {
    const search = buildTextSearch(q);
    if (search?.mode === 'fulltext') {
      and.push(search.clause);
    } else if (search?.clause) {
      and.push(search.clause);
    }
  }

  if (location) {
    // Use model alias `Car` (Sequelize FROM `cars` AS `Car`). JSON_SEARCH works on MariaDB/MySQL.
    and.push(
      literal(
        `JSON_SEARCH(\`Car\`.\`locations\`, 'one', ${sequelize.escape(location)}) IS NOT NULL`,
      ),
    );
  }

  if (date && ISO_DATE.test(date)) {
    const end = returnDate && ISO_DATE.test(returnDate) && returnDate >= date ? returnDate : date;
    // ORM lookup avoids raw SQL alias bugs (`cars.id` vs `Car.id`) that 500 on Hostinger/MySQL
    const busyRows = await Booking.findAll({
      attributes: ['carId'],
      where: {
        status: { [Op.in]: BUSY_STATUSES },
        pickupDate: { [Op.lte]: end },
        returnDate: { [Op.gte]: date },
      },
      raw: true,
    });
    const busyIds = [...new Set(busyRows.map((row) => row.carId).filter(Boolean))];
    if (busyIds.length) {
      where.id = { [Op.notIn]: busyIds };
    }
  }

  if (and.length) {
    where[Op.and] = and;
  }

  const queryOpts = {
    attributes: attributes || CAR_LIST_ATTRIBUTES,
    where,
    order: buildOrder(sort),
    limit: safeLimit,
    offset,
    distinct: true,
  };

  let rows;
  let count;
  try {
    ({ rows, count } = await Car.findAndCountAll(queryOpts));
  } catch (err) {
    // FULLTEXT index missing → fall back to prefix LIKE
    const msg = String(err?.original?.message || err?.message || '');
    if (q?.trim() && /FULLTEXT|MATCH/i.test(msg)) {
      const prefix = `${escapeLike(q.trim())}%`;
      const fallbackWhere = { ...where };
      const fallbackAnd = (fallbackWhere[Op.and] || []).filter(
        (clause) => !(clause && typeof clause === 'object' && 'val' in clause && /MATCH\(name/.test(String(clause.val))),
      );
      fallbackAnd.push({
        [Op.or]: [
          { name: { [Op.like]: prefix } },
          { brand: { [Op.like]: prefix } },
          { model: { [Op.like]: prefix } },
        ],
      });
      fallbackWhere[Op.and] = fallbackAnd;
      ({ rows, count } = await Car.findAndCountAll({ ...queryOpts, where: fallbackWhere }));
    } else {
      throw err;
    }
  }

  const result = {
    data: withCarsMedia(rows),
    meta: {
      total: count,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(count / safeLimit) || 1,
    },
  };

  if (cacheKey) {
    setCached(cacheKey, result, CACHE_TTL.list);
  }

  return result;
}
