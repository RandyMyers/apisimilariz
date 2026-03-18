/**
 * Reads X-Locale request header and sets req.locale (e.g. 'en-US', 'de-DE').
 * Used by public API to return localized content when i18n is present.
 */
module.exports = (req, res, next) => {
  const raw = (req.headers['x-locale'] || req.headers['X-Locale'] || '').trim();
  req.locale = raw || null;
  next();
};
