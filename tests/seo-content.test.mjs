import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;

// ── Helpers ───────────────────────────────────────────────────────────────────

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

function parseJsonLdBlocks(html) {
  const blocks = [];
  for (const [, raw] of html.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    blocks.push(JSON.parse(raw));
  }
  return blocks;
}

// ── Page inventory ────────────────────────────────────────────────────────────

const TOP_PAGES = ["index.html", "products.html", "dashboard.html"];

const PRODUCT_SLUGS = [
  "confidence-gate-mcp-server",
  "agent-cost-router",
  "goal-drift-monitor",
  "audit-replay-logger",
  "cognitive-memory-mcp-server",
  "identity-engine-sdk",
  "multi-voice-deliberation-framework",
  "agent-skill-marketplace-plugin",
  "prompt-archaeology-tool",
  "agent-test-harness",
];

const PRODUCT_PAGES = PRODUCT_SLUGS.map((s) => `products/${s}.html`);
const ALL_PAGES = [...TOP_PAGES, ...PRODUCT_PAGES];

const PRODUCT_NAMES = [
  "Identity Engine SDK",
  "Confidence Gate MCP Server",
  "Multi-Voice Deliberation Framework",
  "Agent Cost Router",
  "Goal Drift Monitor",
  "Cognitive Memory MCP Server",
  "Agent Skill Marketplace Plugin",
  "Audit & Replay Logger",
  "Prompt Archaeology Tool",
  "Agent Test Harness",
];

// ── Load all pages once ───────────────────────────────────────────────────────

const pages = {};
for (const p of ALL_PAGES) {
  pages[p] = read(p);
}

// ── 1. Every page: title + meta description ───────────────────────────────────

for (const p of ALL_PAGES) {
  const html = pages[p];
  assert.ok(/<title>[^<]+<\/title>/.test(html), `${p}: missing <title>`);
  assert.ok(/name="description"\s+content="[^"]+"/.test(html) ||
            /content="[^"]+"\s+name="description"/.test(html),
    `${p}: missing meta description`);
}

// ── 2. Every page: canonical URL (placeholder domain only, not live) ──────────

for (const p of ALL_PAGES) {
  const html = pages[p];
  const m = html.match(/rel="canonical"\s+href="([^"]+)"/);
  assert.ok(m, `${p}: missing canonical link`);
  assert.ok(m[1].startsWith("https://www.certaworks.example/"), `${p}: canonical must use placeholder domain`);
  // No real TLD that implies live hosting
  assert.ok(!m[1].includes("certaworks.com"), `${p}: canonical must not use certaworks.com (not acquired)`);
  assert.ok(!m[1].includes("certaworks.io"), `${p}: canonical must not use certaworks.io (not acquired)`);
}

// ── 3. Every page: og:title, og:description, og:type, og:url, twitter:card ────

for (const p of ALL_PAGES) {
  const html = pages[p];
  assert.ok(/property="og:title"\s+content="[^"]+"/.test(html) ||
            /content="[^"]+"\s+property="og:title"/.test(html),
    `${p}: missing og:title`);
  assert.ok(/property="og:description"\s+content="[^"]+"/.test(html) ||
            /content="[^"]+"\s+property="og:description"/.test(html),
    `${p}: missing og:description`);
  assert.ok(/property="og:type"\s+content="[^"]+"/.test(html) ||
            /content="[^"]+"\s+property="og:type"/.test(html),
    `${p}: missing og:type`);
  assert.ok(/property="og:url"\s+content="[^"]+"/.test(html) ||
            /content="[^"]+"\s+property="og:url"/.test(html),
    `${p}: missing og:url`);
  assert.ok(/name="twitter:card"\s+content="[^"]+"/.test(html) ||
            /content="[^"]+"\s+name="twitter:card"/.test(html),
    `${p}: missing twitter:card`);
}

// ── 4. JSON-LD: present and valid on all pages ────────────────────────────────

for (const p of ALL_PAGES) {
  const html = pages[p];
  assert.ok(html.includes('type="application/ld+json"'), `${p}: missing JSON-LD script block`);
  assert.doesNotThrow(
    () => parseJsonLdBlocks(html),
    `${p}: JSON-LD must parse as valid JSON`
  );
}

// ── 5. index.html: Organization + WebSite schemas ────────────────────────────

const indexBlocks = parseJsonLdBlocks(pages["index.html"]);
const indexTypes = indexBlocks.map((b) => b["@type"]);
assert.ok(indexTypes.includes("Organization"), "index.html: missing Organization JSON-LD");
assert.ok(indexTypes.includes("WebSite"), "index.html: missing WebSite JSON-LD");

// ── 6. products.html: ItemList with all 10 products ──────────────────────────

const productsBlocks = parseJsonLdBlocks(pages["products.html"]);
const itemList = productsBlocks.find((b) => b["@type"] === "ItemList");
assert.ok(itemList, "products.html: missing ItemList JSON-LD");
assert.equal(itemList.itemListElement.length, 10, "products.html: ItemList must contain exactly 10 products");
for (const name of PRODUCT_NAMES) {
  assert.ok(
    itemList.itemListElement.some((item) => item.name === name),
    `products.html: ItemList missing product: ${name}`
  );
}

// ── 7. Product pages: SoftwareApplication JSON-LD, no offers field ────────────

for (const p of PRODUCT_PAGES) {
  const blocks = parseJsonLdBlocks(pages[p]);
  const app = blocks.find((b) => b["@type"] === "SoftwareApplication");
  assert.ok(app, `${p}: missing SoftwareApplication JSON-LD`);
  assert.ok(!("offers" in app), `${p}: SoftwareApplication must not include offers (no live store)`);
  assert.ok(app.name, `${p}: SoftwareApplication missing name`);
  assert.ok(app.description, `${p}: SoftwareApplication missing description`);
  assert.ok(app.publisher, `${p}: SoftwareApplication missing publisher`);
}

// ── 8. dashboard.html: WebPage JSON-LD ───────────────────────────────────────

const dashBlocks = parseJsonLdBlocks(pages["dashboard.html"]);
const webPage = dashBlocks.find((b) => b["@type"] === "WebPage");
assert.ok(webPage, "dashboard.html: missing WebPage JSON-LD");

// ── 9. products.html: all 10 product detail pages linked ─────────────────────

const productsHtml = pages["products.html"];
for (const slug of PRODUCT_SLUGS) {
  assert.ok(
    productsHtml.includes(`./products/${slug}.html`) || productsHtml.includes(`products/${slug}.html`),
    `products.html: missing link to products/${slug}.html`
  );
}

// ── 10. index.html: spot-checks ───────────────────────────────────────────────

const indexHtml = pages["index.html"];
const requiredIndexSnippets = [
  "<title>CertaWorks — Infrastructure for Autonomous AI</title>",
  "Agentic Infrastructure",
  "infrastructure layer that makes AI agency accountable",
  "Join Hosted Beta",
  './dashboard.html">Dashboard</a>',
  "Building agentic infrastructure for safer, cheaper, and more accountable AI work.",
];
for (const snippet of requiredIndexSnippets) {
  assert.ok(indexHtml.includes(snippet), `index.html: missing snippet: ${snippet}`);
}

// ── 11. products.html: spot-checks ────────────────────────────────────────────

const requiredProductsSnippets = [
  "<title>Products — CertaWorks Suite</title>",
  "The full suite.",
  "Confidence Gate",
  "Install Local",
  "Confidence Gate is a decision-support layer",
];
for (const snippet of requiredProductsSnippets) {
  assert.ok(productsHtml.includes(snippet), `products.html: missing snippet: ${snippet}`);
}
for (const name of PRODUCT_NAMES) {
  assert.ok(productsHtml.includes(name), `products.html: missing product name: ${name}`);
}

// ── 12. Audit & Replay Logger: spot-checks ────────────────────────────────────

const auditHtml = pages["products/audit-replay-logger.html"];
const requiredAuditSnippets = [
  "<title>Audit & Replay Logger — CertaWorks</title>",
  "Product 08 · Logger / API / MCP / Dashboard · Local Slice",
  "Hash-chain audit trail",
  "Redaction",
  "Replay bundles",
  "Causal chains",
  "Local dashboard — prototype status",
  "start_session",
  "end_session",
  "log_event",
  "log_decision",
  "log_tool_call",
  "log_tool_result",
  "log_state_change",
  "replay_session",
  "causal_chain",
  "list_sessions",
  "export_bundle",
  "Hosted audit cloud is not live yet",
  "Hash-chain events provide local tamper evidence, not notarized compliance storage",
  "npm package publication is pending",
  'id="ar-betaForm"',
  'id="ar-beta-name"',
  'id="ar-beta-email"',
  'id="ar-beta-company"',
  'id="ar-beta-usage"',
  'id="ar-formStatus"',
];
for (const snippet of requiredAuditSnippets) {
  assert.ok(auditHtml.includes(snippet), `audit-replay-logger.html: missing snippet: ${snippet}`);
}

// ── 13. Unsafe/restricted claims ─────────────────────────────────────────────
//
// Tier A — checked on ALL 13 pages.
// These patterns are safe to check everywhere: they represent claims that
// would never appear even in disclaimer text in the correct form.
//   - Structured data pricing (offers.price) — never correct for a pre-launch prototype
//   - Legal/trademark clearance — these assertions are always unsafe
const unsafeClaimsAllPages = [
  /"offers":\s*\{[^}]*"price":/,               // no pricing in JSON-LD structured data
  /legally\s+cleared/i,                         // never state legal clearance
  /trademark\s+cleared/i,                       // never state trademark clearance
];

for (const p of ALL_PAGES) {
  const html = pages[p];
  for (const claim of unsafeClaimsAllPages) {
    assert.ok(!claim.test(html), `${p}: unsafe or restricted claim found: ${claim}`);
  }
}

// Tier B — checked on top-level pages only (index, products, dashboard).
// Product detail pages have "What This Doesn't Do" disclaimer sections that
// legitimately use these terms in negative context, e.g.:
//   "No live checkout or SaaS availability"
//   "Guarantee safety or prevent all harmful agent actions"
//   "@certaworks/confidence-gate-mcp-server — publication is pending"
// Checking top-level pages catches accidental positive claims in primary content.
const unsafeClaimsTopPages = [
  /guarantee(?:s|d)?\s+(?:ai\s+)?safety/i,
  /prevents?\s+all\s+(?:agent\s+)?mistakes/i,
  /eliminates?\s+hallucinations/i,
  /replaces?\s+human\s+review/i,
  /makes?\s+agents?\s+compliant/i,
  /removes?\s+the\s+need\s+for\s+human\s+oversight/i,
  /live\s+checkout/i,
  /payment\s+link/i,
  /\bnpm\s+publish\b/i,
  /@certaworks\//i,
  /SOC\s*2\s+certif(?:ied|ication)/i,
  /HIPAA\s+certif(?:ied|ication)/i,
  /ISO\s+27001\s+certif(?:ied|ication)/i,
  /live\s+(?:saas|hosted\s+service)\s+available/i,
];

for (const p of TOP_PAGES) {
  const html = pages[p];
  for (const claim of unsafeClaimsTopPages) {
    assert.ok(!claim.test(html), `${p}: unsafe or restricted claim found: ${claim}`);
  }
}

// ── 14. og:image gap — documented, not required ───────────────────────────────
// og:image is intentionally absent — no static image assets exist yet.
// This is a known gap recorded in the continuity doc. No assertion here.
// When a real social preview image is created, add:
//   assert.ok(/property="og:image"\s+content="/.test(html), `${p}: missing og:image`);

// ── Done ──────────────────────────────────────────────────────────────────────

console.log(`SEO/content checks passed (${ALL_PAGES.length} pages)`);
