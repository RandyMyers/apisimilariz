# Existing catalog inventory

This list was refreshed from the configured MongoDB database on **2026-11-02**
after importing the CiteMatch seed-data batches. It is a catalog-only
inventory intended to prevent duplicate seed-data research; it excludes
users, reviews, votes, and other operational records.

> Refresh this inventory before each acquisition/seed-data batch. The database
> can change after the date above. Domains are the primary deduplication key
> within a directory; check domain variants and redirects before adding a
> seemingly different hostname.

## Directories

| Name | Slug | Base URL |
|---|---|---|
| CiteMatch | `citematch` | `https://citematch.com` |

No other Website records were present in the database at the time of this
query.

## Categories

The initial four categories were expanded to 27. See the complete current
list, descriptions, and sort order in
[CATEGORY_INVENTORY.md](./CATEGORY_INVENTORY.md).

**Current count:** 27 categories for CiteMatch.

The following four were present before the seed import:

| Name | Slug |
|---|---|
| E-Commerce | `e-commerce` |
| Finance | `finance` |
| Social Media | `social-media` |
| Technology | `technology` |

For the category-specific inventory and fields to collect when adding one, see
[CATEGORY_INVENTORY.md](./CATEGORY_INVENTORY.md) and
[CATEGORY_SEED_DATA_FIELDS.md](./CATEGORY_SEED_DATA_FIELDS.md).

## Initial sites (before the seed import)

The 12 sites below were already in the database before adding the seed batches.
There are now **143 sites total** for CiteMatch. The 131 newly added site
records are listed in the source files
[SIMILAR_SITE_SEED_DATA.md](../SIMILAR_SITE_SEED_DATA.md) and
[SIMILAR_SITE_SEED_DATA_BATCH2.md](../SIMILAR_SITE_SEED_DATA_BATCH2.md).

| Category | Name | Domain | Site slug |
|---|---|---|---|
| E-Commerce | Amazon | `amazon.com` | `amazon-com` |
| E-Commerce | Shopify | `shopify.com` | `shopify-com` |
| Finance | Stripe | `stripe.com` | `stripe-com` |
| Social Media | Reddit | `reddit.com` | `reddit-com` |
| Technology | Bitbucket | `bitbucket.org` | `bitbucket-org` |
| Technology | CodePen | `codepen.io` | `codepen-io` |
| Technology | Figma | `figma.com` | `figma-com` |
| Technology | GitHub | `github.com` | `github-com` |
| Technology | GitLab | `gitlab.com` | `gitlab-com` |
| Technology | Notion | `notion.so` | `notion-so` |
| Technology | Stack Overflow | `stackoverflow.com` | `stackoverflow-com` |
| Technology | Vercel | `vercel.com` | `vercel-com` |

**Initial count:** 12 site records across 4 categories.

## Similar-site links

There are now **90 configured similar-site lists**, seeded from the
`similarSites` sections of the two CiteMatch site data files above. Each list
points to existing Site records and preserves the alternatives' order. The
database check found no dangling references.

## Acquisition deduplication checklist

- Do not re-research or add the domains in the 12-site baseline table or the
  two seed batch files for the `citematch` directory unless intentionally
  updating their existing records.
- Before adding a site, normalize its hostname (lowercase, no protocol, path,
  or trailing slash) and compare it against the baseline table and all domains
  in both seed batch files.
- A new product can still be an alternative to an existing one; represent that
  relationship in curated similar-site links rather than duplicating a Site.
- Assign new sites to one of the 27 existing categories when appropriate. Add
  a category only if none of those categories fit.
- Keep newly collected names, descriptions, feature lists, and source URLs
  separate from this deduplication list; this file records only the current
  database snapshot.

For the fields to collect for new or updated records, see
[SIMILAR_SITE_SEED_DATA_FIELDS.md](./SIMILAR_SITE_SEED_DATA_FIELDS.md).
For this import's record counts and SEO handling, see
[SEED_IMPORT_STATUS.md](./SEED_IMPORT_STATUS.md).
