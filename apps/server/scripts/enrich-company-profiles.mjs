/**
 * Enrich writable companies with English category + 3D profile fields,
 * then sync into haarlem bundle + worker-demo when present.
 */
import fs from "node:fs";
import path from "node:path";

const profiles = {
  "Budget Schilderwerk": {
    category: "painting",
    capabilities: ["interior painting", "exterior painting"],
    serviceContexts: ["private"],
    differentiators: ["low price"],
    profileSnippet:
      "Budget-oriented painting for private homes in Haarlemmermeer. Fast jobs, limited specialisations.",
    profileSourceUrl: "https://example.nl/budget-schilderwerk",
    profileHarvestedAt: "2026-07-18T10:00:00.000Z",
    profileProducer: "OmegaClaw",
  },
  "Vakschilder Jansen": {
    category: "painting",
    capabilities: [
      "interior painting",
      "exterior painting",
      "wood-rot repair",
      "colour advice",
    ],
    serviceContexts: ["private", "hoa"],
    differentiators: ["trade association member", "colour advice"],
    profileSnippet:
      "Vakschilder Jansen handles interior and exterior painting including wood-rot repair for private clients and HOAs in Badhoevedorp.",
    profileSourceUrl: "https://example.nl/vakschilder-jansen",
    profileHarvestedAt: "2026-07-18T10:00:00.000Z",
    profileProducer: "OmegaClaw",
  },
  "Reekers Schilders": {
    category: "painting",
    capabilities: ["exterior painting", "spray painting", "wood-rot repair"],
    serviceContexts: ["private", "commercial"],
    differentiators: ["spray painting", "facade specialist"],
    profileSnippet:
      "Reekers Schilders specialises in exterior painting and airless spray work for homes and commercial buildings.",
    profileSourceUrl: "https://example.nl/reekers-schilders",
    profileHarvestedAt: "2026-07-18T10:00:00.000Z",
    profileProducer: "OmegaClaw",
  },
  "Kevin Peter Schilderwerken": {
    category: "painting",
    capabilities: ["interior painting", "exterior painting", "wallpapering"],
    serviceContexts: ["private"],
    differentiators: ["wallpapering", "finishing"],
    profileSnippet:
      "Kevin Peter Schilderwerken offers painting and wallpapering for private homes in the Haarlemmermeer area.",
    profileSourceUrl: "https://example.nl/kevin-peter",
    profileHarvestedAt: "2026-07-18T10:00:00.000Z",
    profileProducer: "Human",
  },
  "Schildersbedrijf De Veen": {
    category: "painting",
    capabilities: ["interior painting", "exterior painting"],
    serviceContexts: ["private", "hoa"],
    differentiators: ["local reputation"],
    profileSnippet:
      "Schildersbedrijf De Veen is a local painting firm for interior and exterior work for private clients and HOAs.",
    profileSourceUrl: "https://example.nl/de-veen",
    profileHarvestedAt: "2026-07-18T10:00:00.000Z",
    profileProducer: "OmegaClaw",
  },
  "Verf & Co Haarlemmermeer": {
    category: "painting",
    capabilities: ["interior painting", "spray painting", "colour advice"],
    serviceContexts: ["private", "commercial"],
    differentiators: ["colour advice", "showroom"],
    profileSnippet:
      "Verf & Co combines painting with colour advice from a local showroom in Haarlemmermeer.",
    profileSourceUrl: "https://example.nl/verf-co",
    profileHarvestedAt: "2026-07-18T10:00:00.000Z",
    profileProducer: "OmegaClaw",
  },
  "Atelier Kleurrijk": {
    category: "painting",
    capabilities: ["interior painting", "colour advice", "wallpapering"],
    serviceContexts: ["private"],
    differentiators: ["colour advice", "design finish"],
    profileSnippet:
      "Atelier Kleurrijk focuses on interior painting, wallpapering and colour advice for private clients.",
    profileSourceUrl: "https://example.nl/atelier-kleurrijk",
    profileHarvestedAt: "2026-07-18T10:00:00.000Z",
    profileProducer: "OmegaClaw",
  },
  "SnelSchilder Direct": {
    category: "painting",
    capabilities: ["interior painting"],
    serviceContexts: ["private"],
    differentiators: ["fast scheduling"],
    profileSnippet:
      "SnelSchilder Direct claims fast interior painting jobs for private clients; limited track record.",
    profileSourceUrl: "https://example.nl/snelschilder",
    profileHarvestedAt: "2026-07-18T10:00:00.000Z",
    profileProducer: "OmegaClaw",
  },
  "Onderhoudsbedrijf K&VK": {
    category: "painting",
    capabilities: ["exterior painting", "wood-rot repair", "interior painting"],
    serviceContexts: ["private", "hoa", "commercial"],
    differentiators: ["maintenance contracts", "heritage experience"],
    profileSnippet:
      "Onderhoudsbedrijf K&VK combines painting with wood-rot repair and maintenance contracts for HOAs and businesses.",
    profileSourceUrl: "https://example.nl/k-en-vk",
    profileHarvestedAt: "2026-07-18T10:00:00.000Z",
    profileProducer: "OmegaClaw",
  },
  "Van der Laan Schilderwerken": {
    category: "painting",
    capabilities: [
      "interior painting",
      "exterior painting",
      "spray painting",
      "wood-rot repair",
    ],
    serviceContexts: ["private", "hoa", "commercial"],
    differentiators: ["full service", "project coordination"],
    profileSnippet:
      "Van der Laan Schilderwerken delivers full-service painting including spray work and wood-rot repair for homes, HOAs and commercial sites.",
    profileSourceUrl: "https://example.nl/van-der-laan",
    profileHarvestedAt: "2026-07-18T10:00:00.000Z",
    profileProducer: "OmegaClaw",
  },
  "Schilderwerken Van Dijk": {
    category: "painting",
    capabilities: ["interior painting", "exterior painting"],
    serviceContexts: ["private"],
    differentiators: ["family business"],
    profileSnippet:
      "Schilderwerken Van Dijk is a family business for classic interior and exterior painting for private clients.",
    profileSourceUrl: "https://example.nl/van-dijk",
    profileHarvestedAt: "2026-07-18T10:00:00.000Z",
    profileProducer: "Human",
  },
  "Meesters in Verf BV": {
    category: "painting",
    capabilities: ["exterior painting", "spray painting", "wood-rot repair"],
    serviceContexts: ["commercial", "hoa", "municipal"],
    differentiators: ["large projects", "scaffolding"],
    profileSnippet:
      "Meesters in Verf BV focuses on larger painting projects for HOAs, businesses and municipalities, including spray work.",
    profileSourceUrl: "https://example.nl/meesters-in-verf",
    profileHarvestedAt: "2026-07-18T10:00:00.000Z",
    profileProducer: "OmegaClaw",
  },
  "Schilderbedrijf Voorbeeld BV": {
    category: "painting",
    capabilities: [
      "interior painting",
      "exterior painting",
      "spray painting",
      "colour advice",
    ],
    serviceContexts: ["private", "hoa", "commercial"],
    differentiators: ["colour advice", "warranty"],
    profileSnippet:
      "Schilderbedrijf Voorbeeld BV offers broad painting with colour advice and warranty for private clients, HOAs and businesses.",
    profileSourceUrl: "https://example.nl/voorbeeld",
    profileHarvestedAt: "2026-07-18T10:00:00.000Z",
    profileProducer: "OmegaClaw",
  },
  "De Lokale Schilder": {
    category: "painting",
    capabilities: ["interior painting", "exterior painting"],
    serviceContexts: ["private"],
    differentiators: ["neighbourhood focus"],
    profileSnippet:
      "De Lokale Schilder works neighbourhood-focused for private clients in Haarlemmermeer.",
    profileSourceUrl: "https://example.nl/lokale-schilder",
    profileHarvestedAt: "2026-07-18T10:00:00.000Z",
    profileProducer: "OmegaClaw",
  },
  "QuickPaint Online": {
    category: "painting",
    capabilities: ["interior painting", "spray painting"],
    serviceContexts: ["private", "commercial"],
    differentiators: ["online scheduling"],
    profileSnippet:
      "QuickPaint Online schedules painting jobs digitally; focus on fast interior and spray work.",
    profileSourceUrl: "https://example.nl/quickpaint",
    profileHarvestedAt: "2026-07-18T10:00:00.000Z",
    profileProducer: "OmegaClaw",
  },
  "Schilderbedrijf Zwanenburg": {
    category: "painting",
    capabilities: ["interior painting", "exterior painting", "wallpapering"],
    serviceContexts: ["private", "hoa"],
    differentiators: ["local network"],
    profileSnippet:
      "Schilderbedrijf Zwanenburg handles painting and wallpapering for private clients and HOAs in Zwanenburg and nearby.",
    profileSourceUrl: "https://example.nl/zwanenburg",
    profileHarvestedAt: "2026-07-18T10:00:00.000Z",
    profileProducer: "Human",
  },
  "Schildersbedrijf T. de Wit": {
    category: "painting",
    capabilities: ["exterior painting", "wood-rot repair"],
    serviceContexts: ["private", "hoa"],
    differentiators: ["heritage experience", "historic finishes"],
    profileSnippet:
      "Schildersbedrijf T. de Wit specialises in exterior work and wood-rot repair, including heritage buildings.",
    profileSourceUrl: "https://example.nl/de-wit",
    profileHarvestedAt: "2026-07-18T10:00:00.000Z",
    profileProducer: "OmegaClaw",
  },
  "Renovatie Experts Haarlemmermeer": {
    category: "painting",
    capabilities: [
      "interior painting",
      "exterior painting",
      "wood-rot repair",
      "spray painting",
    ],
    serviceContexts: ["private", "hoa", "commercial"],
    differentiators: ["renovation programmes", "project leadership"],
    profileSnippet:
      "Renovatie Experts Haarlemmermeer combines painting with renovation and project leadership for homes and commercial sites.",
    profileSourceUrl: "https://example.nl/renovatie-experts",
    profileHarvestedAt: "2026-07-18T10:00:00.000Z",
    profileProducer: "OmegaClaw",
  },
};

const dir = "writable/companies";
const byId = {};
let n = 0;
for (const f of fs.readdirSync(dir)) {
  if (!f.endsWith(".json")) continue;
  const p = path.join(dir, f);
  const c = JSON.parse(fs.readFileSync(p, "utf8"));
  const extra = profiles[c.name];
  if (!extra) {
    console.warn("No profile for", c.name);
    continue;
  }
  Object.assign(c, extra);
  c.updatedAt = new Date().toISOString();
  fs.writeFileSync(p, JSON.stringify(c, null, 2) + "\n");
  byId[c.id] = c;
  n++;
}
console.log("Updated", n, "writable companies");

const bundlePath = "fixtures/demos/haarlem_painters/bundle.json";
if (fs.existsSync(bundlePath)) {
  const bundle = JSON.parse(fs.readFileSync(bundlePath, "utf8"));
  if (Array.isArray(bundle.companies)) {
    bundle.companies = bundle.companies.map((c) => byId[c.id] || c);
    fs.writeFileSync(bundlePath, JSON.stringify(bundle, null, 2) + "\n");
    console.log("Synced bundle companies", bundle.companies.length);
  }
}

const demoPath = "apps/server/src/seed-data/worker-demo.json";
if (fs.existsSync(demoPath)) {
  const demo = JSON.parse(fs.readFileSync(demoPath, "utf8"));
  if (Array.isArray(demo.companies)) {
    demo.companies = demo.companies.map((c) => {
      const enriched = byId[c.id];
      if (!enriched) return c;
      return {
        ...c,
        category: enriched.category,
        capabilities: enriched.capabilities,
        serviceContexts: enriched.serviceContexts,
        differentiators: enriched.differentiators,
        profileSnippet: enriched.profileSnippet,
        profileSourceUrl: enriched.profileSourceUrl,
        profileHarvestedAt: enriched.profileHarvestedAt,
        profileProducer: enriched.profileProducer,
        updatedAt: enriched.updatedAt,
      };
    });
    fs.writeFileSync(demoPath, JSON.stringify(demo, null, 2) + "\n");
    console.log("Synced worker-demo companies", demo.companies.length);
  } else {
    console.log("worker-demo has no companies array");
  }
}
