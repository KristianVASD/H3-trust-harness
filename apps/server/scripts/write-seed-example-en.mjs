import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const demo = JSON.parse(
  readFileSync(path.join(root, "apps/server/src/seed-data/worker-demo.json"), "utf8"),
);

const out = `# Seed example — Haarlemmermeer · Painters (English)

Canonical worker-demo data used by \`pnpm seed\` (from \`apps/server/src/seed-data/worker-demo.json\`).
Place names and organisation names stay Dutch where they are real names; all narrative copy is English.

### A. \`sources.json\`

\`\`\`json
${JSON.stringify(demo.sources, null, 2)}
\`\`\`

### B. \`missionSources.json\`

\`\`\`json
${JSON.stringify(demo.missionSources, null, 2)}
\`\`\`

### C. \`companies.json\`

\`\`\`json
${JSON.stringify(demo.companies, null, 2)}
\`\`\`

### D. \`reviews.json\`

\`\`\`json
${JSON.stringify(demo.reviews, null, 2)}
\`\`\`

### E. Checklist

- Trusted lists: 5 (\`accepted\` / \`adjusted\`) → Import unlocked
- Pipeline: drafts + candidate + rejected SEO-farm + pending GBP
- Companies: 18 with ranking spread
- Reviews: source + company CARA trail (all \`producer: Human\`)
`;

writeFileSync(path.join(root, "writable/docs/seed example.md"), out);
console.log("Wrote writable/docs/seed example.md");
