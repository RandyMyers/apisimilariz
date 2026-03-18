# Similaris API Server

Express + MongoDB API for the Similaris app. **Multi-tenant:** one server can serve many client websites; data is scoped by website.

## Setup

1. Copy `.env.example` to `.env` (or ensure `.env` exists) and set:
   - `MONGO_URL` (required)
   - `JWT_SECRET` (required)
   - `PORT` (default 5000)
   - `CLIENT_URL` (optional, for CORS)
   - `DEFAULT_WEBSITE_SLUG` (optional, default `similaris` — used when client doesn’t send a website slug)

2. Install and run:
   ```bash
   npm install
   npm start
   ```

## Multi-website (tenants)

Every request that reads or writes sites, reviews, blog, FAQ, sponsored, or form submissions must identify the **website**. Clients do this in one of two ways:

- **Header (recommended):** `X-Website-Slug: similaris` (or your website’s slug)
- **Query:** `?website=similaris`

If neither is sent, the server uses `DEFAULT_WEBSITE_SLUG` from env (default `similaris`). If the slug is unknown, the API returns 400.

To add a new website (tenant), insert a document into the `websites` collection:

```js
{ "name": "My Client", "slug": "my-client" }
```

Slug must be unique, lowercase, letters/numbers/hyphens only. Then seed or create data for that website (sites, blog, FAQ, etc.) with that website’s `_id`.

## Seed data

Run once to populate the default website (`similaris`):

```bash
# Creates default website if missing, then sites
npm run seed
# If sites already exist for this website, use --force to replace:
node scripts/seed.js --force

# Blog, FAQ, and sponsored items for default website
npm run seed:content
node scripts/seedBlogFaqSponsored.js --force   # to replace
```

To seed a different website, set `DEFAULT_WEBSITE_SLUG` when running the script, and ensure that website exists in the `websites` collection first.

## API overview

- **Auth:** `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/forgot-password`, `GET /api/auth/me` (protected) — no website scope
- **Sites (require website):** `GET /api/sites`, `GET /api/sites/categories`, `GET /api/sites/top`, `GET /api/sites/:domain`, `GET /api/sites/:domain/reviews`, `POST /api/sites/:domain/reviews`, `GET /api/sites/:domain/sponsored`
- **Forms (require website):** `POST /api/submit`, `POST /api/contact`, `POST /api/remove`, `POST /api/newsletter/subscribe`, `POST /api/report`
- **Content (require website):** `GET /api/blog`, `GET /api/blog/:slug`, `GET /api/faq`
- **Health:** `GET /health`
