/**
 * Path prefixes for locale-prefixed routes — must match client/src/config/locales.js.
 * Default locale (en-US) has no prefix; others use pathPrefix (e.g. /sv, /fr, /uk).
 */
const DEFAULT_LOCALE_CODE = 'en-US';

const LOCALES = [
  { code: 'en-US', pathPrefix: '' },
  { code: 'en-GB', pathPrefix: 'uk' },
  { code: 'en-AU', pathPrefix: 'au' },
  { code: 'ga-IE', pathPrefix: 'ga' },
  { code: 'de-DE', pathPrefix: 'de' },
  { code: 'de-AT', pathPrefix: 'at' },
  { code: 'es-ES', pathPrefix: 'es' },
  { code: 'it-IT', pathPrefix: 'it' },
  { code: 'fr-FR', pathPrefix: 'fr' },
  { code: 'pt-PT', pathPrefix: 'pt' },
  { code: 'nl-NL', pathPrefix: 'nl' },
  { code: 'no-NO', pathPrefix: 'no' },
  { code: 'fi-FI', pathPrefix: 'fi' },
  { code: 'da-DK', pathPrefix: 'da' },
  { code: 'sv-SE', pathPrefix: 'sv' },
];

function pathPrefixForCode(code) {
  const row = LOCALES.find((l) => l.code === code);
  return row && row.pathPrefix ? row.pathPrefix : String(code).split('-')[0].toLowerCase();
}

module.exports = {
  DEFAULT_LOCALE_CODE,
  LOCALES,
  /** All locale codes that appear in the sitemap (every translated route). */
  allLocaleCodes: LOCALES.map((l) => l.code),
  pathPrefixForCode,
};
