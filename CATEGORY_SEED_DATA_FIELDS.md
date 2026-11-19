# Category seed data fields

Use this guide when researching or importing a category for a directory.
Categories are scoped to a `Website` (directory); the same name or slug may be
used by a different directory, but a slug must be unique within one directory.

For categories already in the database, see
[CATEGORY_INVENTORY.md](./CATEGORY_INVENTORY.md). Check that list before
proposing or adding a category.

## Fields to provide

| Field | Required? | Meaning / format |
|---|---|---|
| `website` | Yes | Parent Website MongoDB ObjectId or Website slug when using the admin API. When creating a raw database record, use the Website ObjectId. |
| `name` | Yes | Human-readable category name; 1–120 characters after trimming. |
| `slug` | Recommended to collect; optional for API create | URL/filter identifier, lowercase letters and numbers with single hyphens between words (e.g. `project-management`). If omitted on API create, generated from `name`; the server makes it unique within that Website. |
| `description` | Optional | Brief category explanation; max 2,000 characters; defaults to `""`. |
| `sortOrder` | Optional | Number controlling display order; defaults to `0`. |
| `active` | Optional | Whether the category is available in public category lists; defaults to `true`. |
| `createdAt`, `updatedAt` | No | Server-managed timestamps. |

The MongoDB model requires `website`, `name`, and `slug`. The admin create
handler only requires a valid Website and a non-empty name; it generates a
slug if missing, and applies defaults for the other fields. For raw database
seeding, make sure all three required model fields are present.

## Recommended research to gather

- **Name:** concise label users would expect to browse by.
- **Slug:** stable, lowercase URL segment derived from the name.
- **Description:** one or two sentences defining what belongs in the category.
- **Directory:** which Website owns it.
- **Sort order:** intended position among that directory's categories.
- **Active status:** normally `true` for a new category.

Do not create a new category only to represent one individual product or
brand. Prefer a reusable product/service type that can contain multiple sites.
Check the existing category inventory first to avoid overlapping concepts.

## Collection / import template

Use the directory slug as a research-time identifier. Resolve it to the
Website ObjectId when importing:

```json
{
  "website": "citematch",
  "name": "Project Management",
  "slug": "project-management",
  "description": "Tools for planning work, tracking tasks, and coordinating teams.",
  "sortOrder": 0,
  "active": true
}
```

The template's `website` value is a Website slug for convenience; a raw
MongoDB `Category` document needs the corresponding Website ObjectId.
Category slugs are unique per Website. The server may append a numeric suffix
when a generated or submitted slug already exists, so check the final stored
slug after creation.

## Updating and removing categories

- Category updates can change `name`, `description`, `sortOrder`, `active`, and
  `slug`; changing the slug can affect public category URLs and filters.
- A category with sites assigned to it cannot be deleted through the admin
  controller. Reassign those sites or set `active` to `false` instead.
