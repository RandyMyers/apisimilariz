/**
 * Merges i18n overrides for a locale onto a document. Used for public API responses.
 * @param {Object} doc - Plain object (e.g. from .lean())
 * @param {string|null} locale - Locale code (e.g. 'de-DE')
 * @param {string[]} textFields - Field names to override from i18n (e.g. ['title', 'slug', 'excerpt', 'body'])
 * @param {string[]} [nestedObjects] - Optional nested objects to merge (e.g. ['seo'])
 * @returns {Object} New object with overrides applied; i18n key is omitted in the copy.
 */
function applyI18n(doc, locale, textFields, nestedObjects = []) {
  if (!doc || !locale) return doc;
  const i18n = doc.i18n;
  if (!i18n || typeof i18n !== 'object') return doc;

  const overrides = i18n[locale];
  if (!overrides || typeof overrides !== 'object') return doc;

  const out = { ...doc };
  delete out.i18n;

  for (const key of textFields) {
    if (overrides[key] !== undefined && overrides[key] !== null && String(overrides[key]).trim() !== '') {
      out[key] = overrides[key];
    }
  }
  for (const key of nestedObjects) {
    if (overrides[key] && typeof overrides[key] === 'object') {
      out[key] = { ...(out[key] || {}), ...overrides[key] };
    }
  }
  return out;
}

module.exports = { applyI18n };
