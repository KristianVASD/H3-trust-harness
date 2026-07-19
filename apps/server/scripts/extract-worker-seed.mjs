import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const md = fs.readFileSync(path.join(root, "writable/docs/seed example.md"), "utf8");

function extract(filename) {
  const heading = md.indexOf(`\`${filename}\``);
  if (heading < 0) throw new Error(`heading not found for ${filename}`);
  const start = md.indexOf("```json", heading);
  if (start < 0) throw new Error(`fence not found for ${filename}`);
  const from = start + "```json".length;
  const end = md.indexOf("```", from);
  return JSON.parse(md.slice(from, end).trim());
}

/** Loose UUID shape — matches existing demo IDs (not all RFC version/variant). */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function assertUuid(id, label) {
  if (!UUID_RE.test(id)) throw new Error(`Invalid UUID ${label}: ${id}`);
}

const sources = extract("sources.json");
const missionSources = extract("missionSources.json");
const companies = extract("companies.json");
const reviews = extract("reviews.json");

const seo = sources.find((s) => s.id === "33333333-3333-4333-8333-333333333333");
if (seo) seo.category = "digital_presence";

const ovh = sources.find((s) => s.id === "d4e5f6a7-b8c9-0123-def0-234567890abc");
if (ovh) {
  ovh.suggestedWeight = 65;
  ovh.suggestedConfidence = 65;
}

const fair = sources.find((s) => s.id === "e5f6a7b8-c9d0-1234-ef01-345678901bcd");
if (fair) {
  fair.suggestedWeight = 40;
  fair.suggestedConfidence = 40;
}

const msIds = [
  "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1",
  "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2",
  "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3",
  "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4",
  "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb5",
  "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb6",
  "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb7",
  "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb8",
  "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb9",
  "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbba",
];
missionSources.forEach((ms, i) => {
  ms.id = msIds[i];
});

for (const s of sources) assertUuid(s.id, "source");
for (const ms of missionSources) assertUuid(ms.id, "missionSource");
for (const c of companies) assertUuid(c.id, "company");
for (const r of reviews) assertUuid(r.id, "review");

const outDir = path.join(root, "apps/server/src/seed-data");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "worker-demo.json");
fs.writeFileSync(
  outPath,
  `${JSON.stringify({ sources, missionSources, companies, reviews }, null, 2)}\n`,
);

console.log("Wrote", outPath);
console.log({
  sources: sources.length,
  missionSources: missionSources.length,
  companies: companies.length,
  reviews: reviews.length,
  trusted: sources.filter(
    (s) => s.status === "accepted" || s.status === "adjusted",
  ).length,
  seoCategory: seo?.category,
  ovhWeight: ovh?.suggestedWeight,
});
