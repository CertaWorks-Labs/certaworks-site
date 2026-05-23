import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const dashboardHtml = readFileSync(join(root, "dashboard.html"), "utf8");
const dashboardJs = readFileSync(join(root, "dashboard.js"), "utf8");
const indexHtml = readFileSync(join(root, "index.html"), "utf8");
const productsHtml = readFileSync(join(root, "products.html"), "utf8");

const requiredDashboardSnippets = [
  "<title>CertaWorks Dashboard",
  "data-dashboard",
  "data-dashboard-endpoint",
  "data-dashboard-mode",
  "data-kpi-field",
  "data-check-table-body",
  "data-approval-queue",
  "data-dashboard-error",
  'id="overview"',
  'id="checks"',
  'id="review-queue"',
  'id="policy-routing"',
  'id="project-settings"',
  'id="api-keys"',
  "Total checks",
  "Allow / Review / Block",
  "Recent checks",
  "Check detail",
  "Approval queue",
  "Policy settings",
  "Source / project",
  "API keys",
  "Hosted beta is not live yet",
  "Confidence Gate is a decision-support layer"
];

for (const snippet of requiredDashboardSnippets) {
  assert.ok(dashboardHtml.includes(snippet), `Missing dashboard snippet: ${snippet}`);
}

const requiredDashboardJsSnippets = [
  "fetch(",
  "sampleDashboardData",
  "normalizeGateResult",
  "score.score",
  "renderRows",
  "renderApprovalQueue"
];

for (const snippet of requiredDashboardJsSnippets) {
  assert.ok(dashboardJs.includes(snippet), `Missing dashboard.js snippet: ${snippet}`);
}

for (const html of [indexHtml, productsHtml]) {
  assert.ok(
    html.includes('./dashboard.html">Dashboard</a>'),
    "Primary nav should link to the dashboard"
  );
}

const unsafeDashboardClaims = [
  /live\s+approval/i,
  /production\s+approved/i,
  /checkout/i,
  /payment\s+link/i,
  /guarantee(?:s|d)?\s+(?:ai\s+)?safety/i,
  /replaces?\s+human\s+review/i
];

for (const claim of unsafeDashboardClaims) {
  assert.ok(!claim.test(dashboardHtml), `Unsafe dashboard claim found: ${claim}`);
}

console.log("Dashboard content checks passed");
