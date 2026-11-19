# Similar-site seed data fields

This guide describes the data the server needs for the site directory and its
"sites similar to X" pages. In this application, **Website** means the
directory/tenant configuration (for example, Similaris or CiteMatch).
Individual products and domains in that directory are **Site** records.

For a database snapshot of directories, categories, sites, and existing
similar-site links, see
[EXISTING_SEED_DATA_INVENTORY.md](./EXISTING_SEED_DATA_INVENTORY.md). Refresh
that snapshot before each new acquisition batch.

## Minimum data to gather

For every directory:

- Its display name and unique slug.
- At least one category with a name and slug.
- For every listed product/site: its domain, display title, and category.
- For every "similar to" page: the domain of the main site and the domains of
  its alternatives, in display order.

Descriptions, tags, features, and curated alternatives are strongly
recommended for a useful directory. Seed all alternative sites as normal Site
records too; a relationship cannot point to an unseeded site.

## Directory record: `Website`

One record scopes all categories, sites, and similarity links for a directory.
The server uses its `_id` as the `website` value on those records.

| Field | Required for seed? | Meaning / format |
|---|---|---|
| `name` | Yes | Public/admin display name; max 100 characters. |
| `slug` | Yes | Unique lowercase identifier, letters/numbers/hyphens only (e.g. `similaris`). |
| `baseUrl` | Recommended | Canonical base URL, e.g. `https://similaris.com`; defaults to an empty string. |
| `defaultLocale` | Optional | Locale code; defaults to `en-US`. |
| `supportedLocales` | Optional | Array of locale codes; defaults to `["en-US"]`. |
| `localePathMap` | Optional | Locale-to-path mapping object; defaults to `{}`. |
| `adsStaticEnabled` | Optional | Boolean; defaults to `false`. |
| `adsManagedEnabled` | Optional | Boolean; defaults to `false`. |
| `createdAt`, `updatedAt` | No | Server-managed timestamps. |

`Website` does **not** represent a listed external product/domain. Do not put
GitHub, Shopify, etc. in this collection; those belong in `Site`.

## Category record: `Category`

Each category belongs to one directory. `website` is the directory's MongoDB
ObjectId, not its slug.

| Field | Required for seed? | Meaning / format |
|---|---|---|
| `website` | Yes | Parent Website ObjectId. |
| `name` | Yes | Category label (max 120 characters). |
| `slug` | Yes | Unique lowercase URL slug within that Website (e.g. `project-management`). |
| `description` | Optional | Category description; defaults to `""`. |
| `sortOrder` | Optional | Number controlling category order; defaults to `0`. |
| `active` | Optional | Boolean; defaults to `true`. |
| `createdAt`, `updatedAt` | No | Server-managed timestamps. |

The site seed script accepts a category name in its source data, creates
category records, and replaces the name with the category ObjectId on each
Site.

## Listed product/domain record: `Site`

The main site and every alternative use the same schema. The core minimum for
each Site is `website`, `domain`, `title`, and a valid `category`.

| Field | Required for seed? | Meaning / format |
|---|---|---|
| `website` | Yes | Parent Website ObjectId. |
| `domain` | Yes | Normalized external hostname without a URL path (e.g. `github.com`); unique within a Website. |
| `title` | Yes | Display name (max 200 characters). |
| `category` | Yes | Category ObjectId belonging to the same Website. |
| `slug` | No | Public URL segment. If omitted, generated from `domain`; unique within the Website. |
| `description` | Recommended | Short summary, max 2,000 characters; defaults to `""`. Used in search. |
| `tags` | Recommended | String array of search/filter terms; defaults to `[]`. |
| `longDescription` | Recommended | Longer detail-page description; defaults to `""`. |
| `features` | Recommended | Array of feature strings; defaults to `[]`. |
| `trending` | Optional | One of `"Top choice"`, `"Rising"`, or `"Stable"`; defaults to `"Stable"`. |
| `similarityScore` | Optional | Number from 0 to 100; defaults to `0`. A ranking/display score, not the relationship itself. |
| `alternativeRank` | Optional | Number or `null`; defaults to `null`. |
| `alternativeTo` | Optional | Text label for the site it is an alternative to; defaults to `null`. This does **not** create a similar-site link. |
| `userScore` | Optional | Number from 0 to 5; defaults to `0`. Review-derived display score. |
| `reviewCount` | Optional | Non-negative count; defaults to `0`. Review-derived display count. |
| `seo` | Optional | SEO metadata for the Site detail page; see SEO fields below. |
| `similarPageSeo` | Optional | SEO metadata for the "similar to this site" page. |
| `i18n` | Optional | Locale-keyed overrides for `title`, `description`, `longDescription`, `features`, `seo`, and `similarPageSeo`. |
| `curatedSimilar` | Optional | Ordered references to other Site records; see the relationship section. |
| `createdAt`, `updatedAt` | No | Server-managed timestamps. |

The server's current example seed data includes descriptions, tags, similarity
scores, ranks, `alternativeTo`, trending values, scores/counts, long
descriptions, and features. These are not all schema-required. In particular,
reviews can recalculate `userScore` and `reviewCount`; treat those as
review-derived values rather than primary facts to research.

### SEO fields

`seo` and `similarPageSeo` accept the same optional object:

| Field | Meaning / constraint |
|---|---|
| `title` | Meta title; max 70 characters. |
| `description` | Meta description; max 160 characters. |
| `keywords` | Comma-separated keywords; max 512 characters. |
| `canonicalPath` | Canonical path. |
| `robots` | `""`, `"index,follow"`, `"noindex,follow"`, `"index,nofollow"`, or `"noindex,nofollow"`. |
| `ogTitle`, `twitterTitle` | Social title; max 70 characters. |
| `ogDescription`, `twitterDescription` | Social description; max 200 characters. |
| `ogImage`, `twitterImage` | Image URL. |
| `sitemap` | Optional `{ include, priority, changefreq }`; defaults are `true`, `0.5`, and `"weekly"`. Priority is 0–1; changefreq is one of `always`, `hourly`, `daily`, `weekly`, `monthly`, `yearly`, `never`. |

## Similar-site relationship: `curatedSimilar`

The public `GET /api/sites/:domain/similar` endpoint returns only the records
listed in the main Site's `curatedSimilar`, ordered by `sortOrder`. It does not
automatically infer alternatives from category, tags, `alternativeTo`, or
`similarityScore`.

Each row has this shape:

```json
{
  "site": "<alternative Site ObjectId>",
  "sortOrder": 0
}
```

Collect the relationship data as a list of **main domain → alternative
domains in intended display order**. After all Site records have been created,
resolve each alternative domain to its Site ObjectId and write those rows onto
the main Site. Do not include the main Site itself. The relationship is
directional: if A should show B and B should show A, seed both lists.

`SimilarityVote` records are not seed catalog data. They are created by public
votes and contain `website`, `mainDomain`, `alternativeDomain`, `rating`
(1–5), optional `reason`, and server-captured user/IP/user-agent metadata.

## Suggested collection template

Gather one row per listed product/domain, plus a separate ordered relationship
list:

```json
{
  "directory": {
    "name": "Similaris",
    "slug": "similaris",
    "baseUrl": "https://similaris.com",
    "defaultLocale": "en-US",
    "supportedLocales": ["en-US"]
  },
  "categories": [
    { "name": "Project Management", "slug": "project-management" }
  ],
  "sites": [
    {
      "domain": "example.com",
      "title": "Example",
      "category": "Project Management",
      "description": "Short directory summary.",
      "tags": ["planning", "team"],
      "longDescription": "Longer description for the detail page.",
      "features": ["Task boards", "Team collaboration"],
      "trending": "Stable",
      "seo": {},
      "similarPageSeo": {}
    }
  ],
  "similarSites": [
    {
      "mainDomain": "example.com",
      "alternatives": ["alternative-one.com", "alternative-two.com"]
    }
  ]
}
```

This is a research/collection template, not a directly importable database
document: `category` must be resolved to a Category ObjectId, `website` to a
Website ObjectId, and each `curatedSimilar[].site` to a Site ObjectId.
`slug` can be omitted and generated from the domain. The current
`server/scripts/seed.js` seeds Websites, Categories, and Sites, but does not
currently populate `curatedSimilar`; seed or manage those references in a
separate step after the Site records exist.

## Not currently Site fields

The Site model does not define fields for a logo/favicon, screenshots, pricing,
company size, platform availability, or social profile URLs. Gather these only
if the model/API/UI is extended to store and use them; adding them to source
seed objects alone will not make them part of the defined Site schema.
