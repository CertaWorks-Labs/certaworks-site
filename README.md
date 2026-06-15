# CertaWorks Site

Static marketing and product documentation site for CertaWorks, hosted from the `certaworks-site` repository.

The site presents the CertaWorks product suite, dashboard concept, company pages, sitemap, robots file, and product detail pages for local-first agent infrastructure. It is intentionally conservative about public availability: this repo does not by itself imply hosted SaaS availability, live checkout, legal/trademark clearance, or production readiness.

## What Is Included

| Path | Purpose |
| --- | --- |
| `index.html` | Homepage and suite positioning. |
| `products.html` | Product-suite overview. |
| `products/` | Individual product detail pages. |
| `dashboard.html` / `dashboard.js` | Static dashboard page with sample/local data behavior. |
| `about.html`, `contact.html`, `privacy.html`, `thanks.html`, `changelog.html` | Supporting site pages. |
| `styles.css` / `app.js` | Shared presentation and interaction layer. |
| `products.json` | Product metadata used by tests and site content checks. |
| `sitemap.xml` / `robots.txt` | Search-engine support files for `https://certaworks.dev/`. |
| `tests/` | Node-based content, SEO, and dashboard checks. |
| `wrangler.jsonc` | Cloudflare Workers static assets configuration. |

## Local Preview

Serve the folder with any static file server:

```bash
python3 -m http.server 8080
