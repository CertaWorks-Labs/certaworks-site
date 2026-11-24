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
```

Then open:

```text
http://127.0.0.1:8080/
```

If you prefer Node tooling, any equivalent static server works as long as it serves this directory as the web root.

## Verification

Run the content checks from the site root:

```bash
node tests/seo-content.test.mjs
node tests/dashboard-content.test.mjs
```

These checks verify canonical URLs, Open Graph metadata, JSON-LD validity, product links, dashboard copy, and guardrails against stale domains or unsafe public-availability claims.

## Deployment Notes

The current canonical origin is:

```text
https://certaworks.dev/
```

`wrangler.jsonc` is configured for Cloudflare static asset hosting. Before public launch, confirm DNS, TLS, legal pages, trademark/name review, analytics/privacy posture, and any required business/account setup outside this repository.

## Status

- CertaWorks Labs LLC and the Certa Works DBA are established.
- `certaworks.dev` has been bought.
- Public launch, package publication, live payment flows, and hosted product availability still require separate approval and readiness checks.
- The site should remain cautious about claims until launch-readiness and legal review are complete.
