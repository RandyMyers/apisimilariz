/**
 * Reads X-Locale and optional X-Country-Code (ISO 3166-1 alpha-2, lowercase).
 * Used by public API for localized content and ad geo targeting.
 */
module.exports = (req, res, next) => {
  const raw = (req.headers['x-locale'] || req.headers['X-Locale'] || '').trim();
  req.locale = raw || null;
  const countryRaw = (req.headers['x-country-code'] || req.headers['X-Country-Code'] || '').trim().toLowerCase();
  req.country = countryRaw && /^[a-z]{2}$/.test(countryRaw) ? countryRaw : '';
  next();
};
