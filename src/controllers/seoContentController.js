import { SeoContent } from '../models/index.js';
import { HOMEPAGE_SEO_KEY, DEFAULT_HOMEPAGE_SEO } from '../config/seoContent.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getPublicHomepageSeo = asyncHandler(async (_req, res) => {
  const row = await SeoContent.findOne({
    where: { key: HOMEPAGE_SEO_KEY, isActive: true },
  });
  if (!row) {
    res.json({
      data: {
        key: DEFAULT_HOMEPAGE_SEO.key,
        title: DEFAULT_HOMEPAGE_SEO.title,
        body: DEFAULT_HOMEPAGE_SEO.body,
        isActive: true,
      },
    });
    return;
  }
  res.json({ data: row });
});

export const adminGetHomepageSeo = asyncHandler(async (_req, res) => {
  let row = await SeoContent.findOne({ where: { key: HOMEPAGE_SEO_KEY } });
  if (!row) {
    row = await SeoContent.create({
      key: DEFAULT_HOMEPAGE_SEO.key,
      title: DEFAULT_HOMEPAGE_SEO.title,
      body: DEFAULT_HOMEPAGE_SEO.body,
      isActive: true,
    });
  }
  res.json({ data: row });
});

export const adminUpdateHomepageSeo = asyncHandler(async (req, res) => {
  let row = await SeoContent.findOne({ where: { key: HOMEPAGE_SEO_KEY } });
  if (!row) {
    row = await SeoContent.create({
      key: DEFAULT_HOMEPAGE_SEO.key,
      title: req.body.title || DEFAULT_HOMEPAGE_SEO.title,
      body: req.body.body || DEFAULT_HOMEPAGE_SEO.body,
      isActive: req.body.isActive !== false,
    });
  } else {
    await row.update(req.body);
  }
  if (!row) throw new AppError('SEO content not found', 404);
  res.json({ data: row });
});
