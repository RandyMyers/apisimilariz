# Existing category inventory

This list was refreshed from the configured MongoDB database on **2026-11-02**
after importing the CiteMatch category seed batches. Refresh it before adding
categories because database contents can change.

## Categories by directory

### CiteMatch (`citematch`)

| Category name | Slug | Description | Active | Sort order |
|---|---|---|---|---:|
| E-Commerce | `e-commerce` | Online marketplaces and platforms for buying, selling, and running web stores. | Yes | 0 |
| Finance | `finance` | Payment processors, online banking, and money-transfer services. | Yes | 0 |
| Social Media | `social-media` | Social networks, community forums, and sharing platforms. | Yes | 0 |
| Technology | `technology` | Developer platforms, code hosting, and software tools. | Yes | 0 |
| Productivity & Collaboration | `productivity-collaboration` | Tools for planning work, tracking tasks, taking notes, and coordinating teams. | Yes | 10 |
| Communication & Messaging | `communication-messaging` | Chat, video meeting, and messaging platforms for teams, communities, and individuals. | Yes | 20 |
| Entertainment & Streaming | `entertainment-streaming` | Video, music, and live-streaming services for watching and listening online. | Yes | 30 |
| Education & Learning | `education-learning` | Online courses, language learning, and educational platforms for students and professionals. | Yes | 40 |
| Travel & Hospitality | `travel-hospitality` | Booking and planning sites for flights, hotels, vacation rentals, and travel reviews. | Yes | 50 |
| Cloud & Hosting | `cloud-hosting` | Platforms for hosting, deploying, and scaling websites, apps, and infrastructure. | Yes | 60 |
| Design & Creative | `design-creative` | Design, prototyping, whiteboarding, and graphic creation tools. | Yes | 70 |
| Marketing & Analytics | `marketing-analytics` | Email marketing, CRM, SEO, and web analytics platforms for growing and measuring a business. | Yes | 80 |
| Search & Reference | `search-reference` | Search engines and reference resources for finding information online. | Yes | 90 |
| Gaming | `gaming` | PC and console game stores, launchers, and indie game platforms. | Yes | 100 |
| Food & Recipes | `food-recipes` | Recipe collections, cooking guides, and food publications. | Yes | 110 |
| Sports | `sports` | Sports news, scores, and coverage across leagues and events. | Yes | 120 |
| Pets | `pets` | Pet supplies, pet care services, and resources for animal owners. | Yes | 130 |
| Jobs & Careers | `jobs-careers` | Job boards, employer reviews, and freelance marketplaces. | Yes | 140 |
| Real Estate | `real-estate` | Property listing portals for buying, selling, and renting homes. | Yes | 150 |
| Automotive | `automotive` | Marketplaces and research sites for buying and selling cars. | Yes | 160 |
| Books & Reading | `books-reading` | Book discovery, reading trackers, and reader communities. | Yes | 170 |
| Photography & Stock Media | `photography-stock-media` | Stock photo libraries, photo sharing, and royalty-free media sources. | Yes | 180 |
| AI Tools | `ai-tools` | AI chat assistants and AI-powered search and productivity tools. | Yes | 190 |
| Security & Privacy | `security-privacy` | VPN services and password managers for protecting accounts and online privacy. | Yes | 200 |
| Shopping & Deals | `shopping-deals` | Coupon, cashback, and deal-hunting sites for saving money online. | Yes | 210 |
| Home & Garden | `home-garden` | Home improvement, furniture, and household retailers. | Yes | 220 |
| Cloud Storage & Email | `cloud-storage-email` | File storage, sync services, and email providers. | Yes | 230 |

All categories currently have descriptions. No categories were found under any
other directory.

**Count:** 27 categories for CiteMatch; 27 total (4 existing, 23 added).

Before creating a new category, check both its name and slug against the list.
The slug must be unique within its directory. If a category is already close
enough in meaning, prefer reusing it over creating a near-duplicate.

For category creation fields, defaults, and the input template, see
[CATEGORY_SEED_DATA_FIELDS.md](./CATEGORY_SEED_DATA_FIELDS.md).
