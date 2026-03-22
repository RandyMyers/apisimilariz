const Website = require('../models/Website');
const BlogPost = require('../models/BlogPost');
const Site = require('../models/Site');
const { asyncHandler } = require('../middleware/errorHandler');
const { DEFAULT_LOCALE_CODE, allLocaleCodes, pathPrefixForCode } = require('../config/siteLocales');

const STATIC_PATHS = [
  '',
  'categories',
  'top-sites',
  'compare',
  'submit',
  'blog',
  'faq',
  'contact',
  'remove',
  'about',
  'privacy',
  'terms',
];

function escapeXml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Sitemap must list every locale route the client serves (/sv/..., /fr/..., etc.),
 * not only whatever is stored on Website.supportedLocales (often just en-US).
 */
function getLocalePathMap(website) {
  const custom = website.localePathMap && typeof website.localePathMap === 'object' ? website.localePathMap : {};
  const defaultLocale = website.defaultLocale || DEFAULT_LOCALE_CODE;
  const supported = [...allLocaleCodes];

  const pathByLocale = {};
  supported.forEach((code) => {
    if (code === defaultLocale) {
      pathByLocale[code] = '';
      return;
    }
    if (custom[code] !== undefined && String(custom[code]).trim() !== '') {
      pathByLocale[code] = String(custom[code]).trim().replace(/^\/+|\/+$/g, '');
      return;
    }
    pathByLocale[code] = pathPrefixForCode(code);
  });

  return { pathByLocale, supported, defaultLocale };
}

exports.getSitemap = asyncHandler(async (req, res) => {
  const website = req.website;
  if (!website) {
    return res.status(400).json({ success: false, message: 'Website required (X-Website-Slug or ?website=slug)' });
  }

  let baseUrl = (website.baseUrl || '').trim();
  if (!baseUrl) {
    return res.status(400).json({
      success: false,
      message: 'Website has no baseUrl. Set baseUrl in admin (e.g. https://yoursite.com) to generate the sitemap.',
    });
  }
  if (!/^https?:\/\//i.test(baseUrl)) baseUrl = `https://${baseUrl}`;
  baseUrl = baseUrl.replace(/\/+$/, '');

  const { pathByLocale, supported, defaultLocale } = getLocalePathMap(website);
  const xmlns = 'http://www.sitemaps.org/schemas/sitemap/0.9';
  const xhtmlNs = 'http://www.w3.org/1999/xhtml';

  const urlEntries = [];

  const lastmodIso = new Date().toISOString().slice(0, 10);
  const defaultPriority = '0.8';
  const changefreq = 'weekly';

  // Static routes for each locale
  STATIC_PATHS.forEach((path) => {
    supported.forEach((locale) => {
      const prefix = pathByLocale[locale] || '';
      const pathSegment = path ? `/${path}` : '';
      const loc = `${baseUrl}${prefix ? `/${prefix}` : ''}${pathSegment}`;
      const links = supported.map((locCode) => {
        const p = pathByLocale[locCode] || '';
        const seg = path ? `/${path}` : '';
        const href = `${baseUrl}${p ? `/${p}` : ''}${seg}`;
        const hreflang = locCode === defaultLocale ? 'x-default' : locCode.replace('_', '-');
        return `    <xhtml:link rel="alternate" hreflang="${escapeXml(hreflang)}" href="${escapeXml(href)}"/>`;
      });
      urlEntries.push({
        loc,
        lastmod: lastmodIso,
        changefreq,
        priority: path === '' ? '1.0' : defaultPriority,
        links,
      });
    });
  });

  // Blog posts
  const posts = await BlogPost.find({ website: website._id }).select('slug updatedAt seo').lean();
  posts.forEach((post) => {
    const seo = post.seo || {};
    const sm = seo.sitemap || {};
    if (sm.include === false) return;
    const slug = post.slug || post._id.toString();
    const lastmod = post.updatedAt ? new Date(post.updatedAt).toISOString().slice(0, 10) : lastmodIso;
    const cf = sm.changefreq || 'monthly';
    const pr = sm.priority != null ? String(sm.priority) : '0.6';
    supported.forEach((locale) => {
      const prefix = pathByLocale[locale] || '';
      const loc = `${baseUrl}${prefix ? `/${prefix}` : ''}/blog/${escapeXml(slug)}`;
      const links = supported.map((locCode) => {
        const p = pathByLocale[locCode] || '';
        const href = `${baseUrl}${p ? `/${p}` : ''}/blog/${escapeXml(slug)}`;
        const hreflang = locCode === defaultLocale ? 'x-default' : locCode.replace('_', '-');
        return `    <xhtml:link rel="alternate" hreflang="${escapeXml(hreflang)}" href="${escapeXml(href)}"/>`;
      });
      urlEntries.push({ loc, lastmod, changefreq: cf, priority: pr, links });
    });
  });

  // Site detail pages
  const sites = await Site.find({ website: website._id }).select('slug domain updatedAt seo similarPageSeo').lean();
  sites.forEach((site) => {
    const domain = site.domain || '';
    if (!domain) return;
    const pathSeg = (site.slug || domain.replace(/\./g, '-')).toLowerCase();
    const lastmod = site.updatedAt ? new Date(site.updatedAt).toISOString().slice(0, 10) : lastmodIso;

    const seo = site.seo || {};
    const sm = seo.sitemap || {};
    if (sm.include !== false) {
      const cf = sm.changefreq || 'weekly';
      const pr = sm.priority != null ? String(sm.priority) : '0.7';
      supported.forEach((locale) => {
        const prefix = pathByLocale[locale] || '';
        const loc = `${baseUrl}${prefix ? `/${prefix}` : ''}/site/${encodeURIComponent(pathSeg)}`;
        const links = supported.map((locCode) => {
          const p = pathByLocale[locCode] || '';
          const href = `${baseUrl}${p ? `/${p}` : ''}/site/${encodeURIComponent(pathSeg)}`;
          const hreflang = locCode === defaultLocale ? 'x-default' : locCode.replace('_', '-');
          return `    <xhtml:link rel="alternate" hreflang="${escapeXml(hreflang)}" href="${escapeXml(href)}"/>`;
        });
        urlEntries.push({ loc, lastmod, changefreq: cf, priority: pr, links });
      });
    }

    const simSeo = site.similarPageSeo || {};
    const simSm = simSeo.sitemap || {};
    if (simSm.include === false) return;
    const cfSim = simSm.changefreq || 'weekly';
    const prSim = simSm.priority != null ? String(simSm.priority) : '0.65';
    supported.forEach((locale) => {
      const prefix = pathByLocale[locale] || '';
      const loc = `${baseUrl}${prefix ? `/${prefix}` : ''}/similar/${encodeURIComponent(pathSeg)}`;
      const links = supported.map((locCode) => {
        const p = pathByLocale[locCode] || '';
        const href = `${baseUrl}${p ? `/${p}` : ''}/similar/${encodeURIComponent(pathSeg)}`;
        const hreflang = locCode === defaultLocale ? 'x-default' : locCode.replace('_', '-');
        return `    <xhtml:link rel="alternate" hreflang="${escapeXml(hreflang)}" href="${escapeXml(href)}"/>`;
      });
      urlEntries.push({ loc, lastmod, changefreq: cfSim, priority: prSim, links });
    });
  });

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<urlset xmlns="${xmlns}" xmlns:xhtml="${xhtmlNs}">`,
    ...urlEntries.map(
      (e) =>
        `  <url>
    <loc>${escapeXml(e.loc)}</loc>
    <lastmod>${e.lastmod}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
${e.links.join('\n')}
  </url>`
    ),
    '</urlset>',
  ].join('\n');

  res.set('Content-Type', 'application/xml');
  res.send(xml);
});

exports.getRobotsTxt = asyncHandler(async (req, res) => {
  const website = req.website;
  if (!website) {
    return res.status(400).json({ success: false, message: 'Website required (X-Website-Slug or ?website=slug)' });
  }

  let baseUrl = (website.baseUrl || '').trim();
  if (!baseUrl) baseUrl = 'https://example.com';
  else {
    if (!/^https?:\/\//i.test(baseUrl)) baseUrl = `https://${baseUrl}`;
    baseUrl = baseUrl.replace(/\/+$/, '');
  }

  const lines = [
    '# https://www.robotstxt.org/robotstxt.html',
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/admin/',
    'Disallow: /api/auth/',
    '',
    `Sitemap: ${baseUrl}/api/sitemap.xml`,
  ];
  res.set('Content-Type', 'text/plain; charset=utf-8');
  res.send(lines.join('\n'));
});
