const Website = require('../models/Website');
const StaticPage = require('../models/StaticPage');
const { asyncHandler } = require('../middleware/errorHandler');

exports.list = asyncHandler(async (req, res) => {
  const websites = await Website.find({}).sort({ slug: 1 }).lean();
  res.status(200).json({ success: true, data: websites });
});

exports.getById = asyncHandler(async (req, res) => {
  const website = await Website.findById(req.params.id).lean();
  if (!website) {
    return res.status(404).json({ success: false, message: 'Website not found' });
  }
  res.status(200).json({ success: true, data: website });
});

const normalizeBaseUrl = (url) => {
  const s = String(url || '').trim();
  if (!s) return '';
  let u = s;
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
  return u.replace(/\/+$/, '');
};

exports.create = asyncHandler(async (req, res) => {
  const { name, slug, baseUrl, defaultLocale, supportedLocales, localePathMap } = req.body;
  const website = await Website.create({
    name: (name || '').trim(),
    slug: (slug || '').trim().toLowerCase(),
    ...(baseUrl !== undefined && { baseUrl: normalizeBaseUrl(baseUrl) }),
    ...(defaultLocale !== undefined && { defaultLocale: String(defaultLocale).trim() || 'en-US' }),
    ...(supportedLocales !== undefined && {
      supportedLocales: Array.isArray(supportedLocales) ? supportedLocales.map((l) => String(l).trim()).filter(Boolean) : ['en-US'],
    }),
    ...(localePathMap !== undefined && typeof localePathMap === 'object' && { localePathMap }),
  });

  // Seed default static pages (non-destructive)
  try {
    const defaultPages = [
      { slug: 'about', path: 'about', title: 'About', body: '<h1>About</h1><p>Edit this page in Admin.</p>' },
      { slug: 'privacy', path: 'privacy', title: 'Privacy Policy', body: '<h1>Privacy Policy</h1><p>Edit this page in Admin.</p>' },
      { slug: 'terms', path: 'terms', title: 'Terms of Service', body: '<h1>Terms of Service</h1><p>Edit this page in Admin.</p>' },
    ];
    await Promise.all(
      defaultPages.map((p) =>
        StaticPage.updateOne(
          { website: website._id, slug: p.slug },
          { $setOnInsert: { ...p, website: website._id } },
          { upsert: true }
        )
      )
    );
  } catch {
    // Do not fail website creation if seeding fails
  }

  res.status(201).json({ success: true, data: website });
});

exports.update = asyncHandler(async (req, res) => {
  const { name, slug, baseUrl, defaultLocale, supportedLocales, localePathMap } = req.body;
  const updateFields = { updatedAt: new Date() };
  if (name !== undefined) updateFields.name = String(name).trim();
  if (slug !== undefined) updateFields.slug = String(slug).trim().toLowerCase();
  if (baseUrl !== undefined) updateFields.baseUrl = normalizeBaseUrl(baseUrl);
  if (defaultLocale !== undefined) updateFields.defaultLocale = String(defaultLocale).trim() || 'en-US';
  if (supportedLocales !== undefined)
    updateFields.supportedLocales = Array.isArray(supportedLocales) ? supportedLocales.map((l) => String(l).trim()).filter(Boolean) : ['en-US'];
  if (localePathMap !== undefined && typeof localePathMap === 'object') updateFields.localePathMap = localePathMap;

  const website = await Website.findByIdAndUpdate(req.params.id, updateFields, {
    new: true,
    runValidators: true,
  }).lean();
  if (!website) {
    return res.status(404).json({ success: false, message: 'Website not found' });
  }
  res.status(200).json({ success: true, data: website });
});

exports.delete = asyncHandler(async (req, res) => {
  const website = await Website.findByIdAndDelete(req.params.id);
  if (!website) {
    return res.status(404).json({ success: false, message: 'Website not found' });
  }
  res.status(200).json({ success: true, message: 'Website deleted' });
});
