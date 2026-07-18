/**
 * Full mock walkthrough for every investigation step.
 * Run: pnpm seed
 * Opens as Mission Control → "Haarlemmermeer · Painters (DEMO)"
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FileStore } from "@h3-trust/store";
import type {
  Company,
  ConfidenceProposal,
  Evidence,
  Finding,
  Hypothesis,
  Investigation,
  JournalEntry,
  Mission,
  MissionSource,
  Observation,
  Pattern,
  Review,
  Signal,
  Source,
} from "@h3-trust/schema";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const writableRoot = path.resolve(__dirname, "../../../writable");
const store = new FileStore(writableRoot);

const now = new Date().toISOString();
const earlier = new Date(Date.now() - 3600_000).toISOString();
const later = new Date(Date.now() - 600_000).toISOString();

/** Stable IDs so re-seed is deterministic and links stay valid. */
const ids = {
  mission: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  // journal
  journalKickoff: "11111111-1111-4111-8111-111111111101",
  journalTaskKvK: "11111111-1111-4111-8111-111111111102",
  journalNoteLists: "11111111-1111-4111-8111-111111111103",
  journalTaskCara: "11111111-1111-4111-8111-111111111104",
  // observations
  obsGemeente: "22222222-2222-4222-8222-222222222201",
  obsKvK: "22222222-2222-4222-8222-222222222202",
  obsAssoc: "22222222-2222-4222-8222-222222222203",
  obsDns: "22222222-2222-4222-8222-222222222204",
  // hypotheses
  hypAssoc: "33333333-3333-4333-8333-333333333301",
  hypGbp: "33333333-3333-4333-8333-333333333302",
  hypRejected: "33333333-3333-4333-8333-333333333303",
  // sources
  srcKvK: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  srcGbp: "c3d4e5f6-a7b8-9012-cdef-123456789012",
  srcAssoc: "d4e5f6a7-b8c9-0123-def0-234567890abc",
  srcFair: "e5f6a7b8-c9d0-1234-ef01-345678901bcd",
  // evidence
  evKvK: "44444444-4444-4444-8444-444444444401",
  evAssoc: "44444444-4444-4444-8444-444444444402",
  evSite: "44444444-4444-4444-8444-444444444403",
  // signals
  sigRegistry: "55555555-5555-4555-8555-555555555501",
  sigLongevity: "55555555-5555-4555-8555-555555555502",
  sigAssoc: "55555555-5555-4555-8555-555555555503",
  sigInfraNeg: "55555555-5555-4555-8555-555555555504",
  // confidence
  confKvK: "66666666-6666-4666-8666-666666666601",
  confAssoc: "66666666-6666-4666-8666-666666666602",
  confGbp: "66666666-6666-4666-8666-666666666603",
  // companies
  coVoorbeeld: "d4e5f6a7-b8c9-0123-def0-234567890123",
  coQuick: "e5f6a7b8-c9d0-1234-ef01-345678901234",
  coDeWit: "f6a7b8c9-d0e1-2345-f012-456789012cde",
  coBlack: "a7b8c9d0-e1f2-3456-0123-567890123def",
  coTarget: "b8c9d0e1-f2a3-4567-1234-678901234efa",
  // reviews / findings
  revKvK: "77777777-7777-4777-8777-777777777701",
  revCompany: "77777777-7777-4777-8777-777777777702",
  findKvK: "88888888-8888-4888-8888-888888888801",
  findCompany: "88888888-8888-4888-8888-888888888802",
  // investigation / pattern
  inv1: "99999999-9999-4999-8999-999999999901",
  inv2: "99999999-9999-4999-8999-999999999902",
  inv3: "99999999-9999-4999-8999-999999999903",
  inv4: "99999999-9999-4999-8999-999999999904",
  inv5: "99999999-9999-4999-8999-999999999905",
  pattern1: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
  // missionSources
  msKvK: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1",
  msGbp: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2",
  msAssoc: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3",
  msFair: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4",
} as const;

const mission: Mission = {
  id: ids.mission,
  location: "Haarlemmermeer",
  country: "Nederland",
  sector: "Home Maintenance",
  subsector: "Painters (DEMO)",
  goal: "DEMO walkthrough: every pipeline step filled with mock data so you can click through Journal → CARA → Export.",
  notes: "Safe to delete. Re-run `pnpm seed` to reset this mission.",
  discoveryBrief: {
    approach:
      "Fase 0: inventariseer geschikte lijsten voor Haarlemmermeer × schilders (KvK, lokale OV, keurmerken). CARA op sources vóór company deep-check.",
    candidateListTypes: [
      "registry",
      "local_business_association",
      "quality_mark",
      "trade_fair",
    ],
    successCriteria:
      "≥3 CARA-accepted/adjusted lists; then rank companies by weighted list coverage.",
    notes: "Website/positionering = later (fase 2).",
    producer: "Human",
    updatedAt: earlier,
  },
  phases: [
    { key: "observation", status: "done" },
    { key: "hypothesis", status: "done" },
    { key: "evidence", status: "active" },
    { key: "cara", status: "active" },
    { key: "patterns", status: "waiting" },
    { key: "companies", status: "active" },
    { key: "deep_check", status: "waiting" },
  ],
  producer: "Human",
  createdAt: earlier,
  updatedAt: now,
  v: 1,
};

const journal: JournalEntry[] = [
  {
    id: ids.journalKickoff,
    missionId: ids.mission,
    producer: "Human",
    kind: "journal",
    title: "Kickoff — DEMO",
    body: "Human investigator run. No OmegaClaw. Goal: map sources first, then company lists.",
    createdAt: earlier,
    updatedAt: earlier,
    v: 1,
  },
  {
    id: ids.journalTaskKvK,
    missionId: ids.mission,
    producer: "Human",
    kind: "task",
    title: "Verify KvK as registry source",
    body: "Confirm KvK is usable as hard identity gate (not weighted vibe).",
    done: true,
    createdAt: earlier,
    updatedAt: later,
    v: 1,
  },
  {
    id: ids.journalNoteLists,
    missionId: ids.mission,
    producer: "Human",
    kind: "note",
    title: "Member list found",
    body: "Local schildersvereniging published a 2024 member PDF — good bulk-import candidate.",
    createdAt: later,
    updatedAt: later,
    v: 1,
  },
  {
    id: ids.journalTaskCara,
    missionId: ids.mission,
    producer: "Human",
    kind: "task",
    title: "CARA: finish pending sources + company candidates",
    body: "Agree/adjust GBP; review Schilderbedrijf De Wit as target.",
    done: false,
    createdAt: later,
    updatedAt: later,
    v: 1,
  },
];

const observations: Observation[] = [
  {
    id: ids.obsGemeente,
    missionId: ids.mission,
    producer: "Human",
    statement:
      "Gemeente Haarlemmermeer website links to local ondernemersvereniging pages.",
    evidenceUrls: ["https://www.haarlemmermeer.nl"],
    evidenceIds: [],
    tags: ["municipality", "association"],
    createdAt: earlier,
    updatedAt: earlier,
    v: 1,
  },
  {
    id: ids.obsKvK,
    missionId: ids.mission,
    producer: "Human",
    statement:
      "KvK Handelsregister lists active chamber registration numbers for Dutch companies.",
    evidenceUrls: ["https://www.kvk.nl"],
    evidenceIds: [ids.evKvK],
    tags: ["registry"],
    createdAt: earlier,
    updatedAt: earlier,
    v: 1,
  },
  {
    id: ids.obsAssoc,
    missionId: ids.mission,
    producer: "Human",
    statement:
      "Ondernemersvereniging Haarlemmermeer publishes a public member directory for painters.",
    evidenceUrls: ["https://example.com/ovh-leden"],
    evidenceIds: [ids.evAssoc],
    tags: ["association", "list"],
    createdAt: later,
    updatedAt: later,
    v: 1,
  },
  {
    id: ids.obsDns,
    missionId: ids.mission,
    producer: "Human",
    statement:
      "Company site schilderbedrijfvoorbeeld.nl has WHOIS creation date 2003-04-11.",
    evidenceUrls: ["https://schilderbedrijfvoorbeeld.nl"],
    evidenceIds: [ids.evSite],
    tags: ["longevity", "website"],
    createdAt: later,
    updatedAt: later,
    v: 1,
  },
];

const hypotheses: Hypothesis[] = [
  {
    id: ids.hypAssoc,
    missionId: ids.mission,
    producer: "Human",
    statement:
      "Local business associations are better trust indicators than commercial directories.",
    status: "Testing",
    observationIds: [ids.obsGemeente, ids.obsAssoc],
    rationale: "Longevity and local accountability may outperform paid listings.",
    createdAt: earlier,
    updatedAt: later,
    v: 1,
  },
  {
    id: ids.hypGbp,
    missionId: ids.mission,
    producer: "Human",
    statement:
      "Google Business Profile alone is a weak primary trust source for painters.",
    status: "Draft",
    observationIds: [],
    rationale: "Commercial incentives and thin verification.",
    createdAt: later,
    updatedAt: later,
    v: 1,
  },
  {
    id: ids.hypRejected,
    missionId: ids.mission,
    producer: "Human",
    statement: "DNS age alone is sufficient to certify trustworthiness.",
    status: "Rejected",
    observationIds: [ids.obsDns],
    rationale:
      "Rejected: longevity helps as a signal, never as a sole decision. Kept as knowledge.",
    createdAt: later,
    updatedAt: later,
    v: 1,
  },
];

const sources: Source[] = [
  {
    id: ids.srcKvK,
    first_seen_mission: ids.mission,
    reused_in_missions: [],
    producer: "Human",
    name: "KvK Handelsregister",
    type: "registry",
    category: "registry",
    url: "https://www.kvk.nl",
    reason: "Official company registry for the Netherlands.",
    suggestedWeight: 95,
    suggestedConfidence: 90,
    signalIds: [ids.sigRegistry],
    evidenceIds: [ids.evKvK],
    status: "accepted",
    notes: "CARA agreed in DEMO seed.",
    createdAt: earlier,
    updatedAt: later,
    v: 1,
  },
  {
    id: ids.srcGbp,
    first_seen_mission: ids.mission,
    reused_in_missions: [],
    producer: "Human",
    name: "Google Business Profile",
    type: "directory",
    category: "digital_presence",
    url: "https://business.google.com",
    reason: "Widely used but commercially influenced.",
    suggestedWeight: 55,
    suggestedConfidence: 47,
    signalIds: [ids.sigInfraNeg],
    evidenceIds: [],
    status: "pending_review",
    createdAt: earlier,
    updatedAt: later,
    v: 1,
  },
  {
    id: ids.srcAssoc,
    first_seen_mission: ids.mission,
    reused_in_missions: [],
    producer: "Human",
    name: "Ondernemersvereniging Haarlemmermeer",
    type: "association",
    category: "local_business_association",
    url: "https://example.com/ovh",
    reason: "Local association with multi-year member archive.",
    suggestedWeight: 80,
    suggestedConfidence: 78,
    signalIds: [ids.sigAssoc, ids.sigLongevity],
    evidenceIds: [ids.evAssoc],
    status: "adjusted",
    notes: "CARA adjusted — still a trusted list for coverage.",
    createdAt: later,
    updatedAt: later,
    v: 1,
  },
  {
    id: ids.srcFair,
    first_seen_mission: ids.mission,
    reused_in_missions: [],
    producer: "Human",
    name: "BouwBeurs deelnemerslijst 2024",
    type: "other",
    category: "trade_fair",
    url: "https://example.com/bouwbeurs",
    reason: "Trade fair exhibitor list — useful for discovery, weak as trust alone.",
    suggestedWeight: 40,
    suggestedConfidence: 40,
    signalIds: [],
    evidenceIds: [],
    status: "accepted",
    notes: "Accepted as weak-but-valid discovery list (low weight).",
    createdAt: later,
    updatedAt: later,
    v: 1,
  },
];

const missionSources: MissionSource[] = [
  {
    id: ids.msKvK,
    mission_id: ids.mission,
    source_id: ids.srcKvK,
    added_at: earlier,
    producer: "Human",
    updatedAt: earlier,
    v: 1,
  },
  {
    id: ids.msGbp,
    mission_id: ids.mission,
    source_id: ids.srcGbp,
    added_at: earlier,
    producer: "Human",
    updatedAt: earlier,
    v: 1,
  },
  {
    id: ids.msAssoc,
    mission_id: ids.mission,
    source_id: ids.srcAssoc,
    added_at: later,
    producer: "Human",
    updatedAt: later,
    v: 1,
  },
  {
    id: ids.msFair,
    mission_id: ids.mission,
    source_id: ids.srcFair,
    added_at: later,
    producer: "Human",
    updatedAt: later,
    v: 1,
  },
];

const evidence: Evidence[] = [
  {
    id: ids.evKvK,
    missionId: ids.mission,
    producer: "Human",
    title: "KvK extract — Schilderbedrijf Voorbeeld BV",
    url: "https://www.kvk.nl",
    snippet: "KvK 12345678 · SBI 4331 · Actief",
    observationIds: [ids.obsKvK],
    sourceIds: [ids.srcKvK],
    capturedAt: earlier,
    createdAt: earlier,
    updatedAt: earlier,
    v: 1,
  },
  {
    id: ids.evAssoc,
    missionId: ids.mission,
    producer: "Human",
    title: "OVH member directory screenshot / PDF page",
    url: "https://example.com/ovh-leden",
    snippet: "Voorbeeld BV and De Wit listed as painting members since 2011.",
    observationIds: [ids.obsAssoc],
    sourceIds: [ids.srcAssoc],
    capturedAt: later,
    createdAt: later,
    updatedAt: later,
    v: 1,
  },
  {
    id: ids.evSite,
    missionId: ids.mission,
    producer: "Human",
    title: "WHOIS / DNS creation note",
    url: "https://schilderbedrijfvoorbeeld.nl",
    snippet: "Domain created 2003-04-11.",
    observationIds: [ids.obsDns],
    sourceIds: [ids.srcAssoc],
    capturedAt: later,
    createdAt: later,
    updatedAt: later,
    v: 1,
  },
];

const signals: Signal[] = [
  {
    id: ids.sigRegistry,
    missionId: ids.mission,
    producer: "Human",
    key: "registry",
    label: "Official registry",
    delta: 12,
    note: "KvK verified active registration.",
    evidenceIds: [ids.evKvK],
    observationIds: [ids.obsKvK],
    sourceId: ids.srcKvK,
    createdAt: earlier,
    updatedAt: earlier,
    v: 1,
  },
  {
    id: ids.sigLongevity,
    missionId: ids.mission,
    producer: "Human",
    key: "longevity",
    label: "Domain longevity",
    delta: 8,
    note: "Website since 2003.",
    evidenceIds: [ids.evSite],
    observationIds: [ids.obsDns],
    sourceId: ids.srcAssoc,
    createdAt: later,
    updatedAt: later,
    v: 1,
  },
  {
    id: ids.sigAssoc,
    missionId: ids.mission,
    producer: "Human",
    key: "association",
    label: "Local association membership",
    delta: 10,
    note: "Listed in OVH directory.",
    evidenceIds: [ids.evAssoc],
    observationIds: [ids.obsAssoc],
    sourceId: ids.srcAssoc,
    createdAt: later,
    updatedAt: later,
    v: 1,
  },
  {
    id: ids.sigInfraNeg,
    missionId: ids.mission,
    producer: "Human",
    key: "infra",
    label: "Thin digital footprint risk",
    delta: -6,
    note: "GBP-only presence, no independent site.",
    evidenceIds: [],
    observationIds: [],
    sourceId: ids.srcGbp,
    createdAt: later,
    updatedAt: later,
    v: 1,
  },
];

const confidenceProposals: ConfidenceProposal[] = [
  {
    id: ids.confKvK,
    missionId: ids.mission,
    producer: "Human",
    targetType: "source",
    targetId: ids.srcKvK,
    suggested: 90,
    explanation: "Base 50 → registry +12 → locality context → suggested 90 (demo).",
    signalIds: [ids.sigRegistry],
    createdAt: earlier,
    updatedAt: earlier,
    v: 1,
  },
  {
    id: ids.confAssoc,
    missionId: ids.mission,
    producer: "Human",
    targetType: "source",
    targetId: ids.srcAssoc,
    suggested: 78,
    explanation: "Base 50 → association +10 → longevity +8 → suggested 68–78 (demo).",
    signalIds: [ids.sigAssoc, ids.sigLongevity],
    createdAt: later,
    updatedAt: later,
    v: 1,
  },
  {
    id: ids.confGbp,
    missionId: ids.mission,
    producer: "Human",
    targetType: "source",
    targetId: ids.srcGbp,
    suggested: 47,
    explanation: "Base 50 → infra -6 → suggested 44–47 (demo).",
    signalIds: [ids.sigInfraNeg],
    createdAt: later,
    updatedAt: later,
    v: 1,
  },
];

const companies: Company[] = [
  {
    id: ids.coVoorbeeld,
    missionId: ids.mission,
    producer: "Human",
    name: "Schilderbedrijf Voorbeeld BV",
    address: "Hoofdweg 12, Hoofddorp",
    region: "Haarlemmermeer",
    sector: "Painters",
    kvk_number: "12345678",
    kvk_gate: "pass",
    // High-weight lists: KvK (95) + OVH (80) = 175 of 215 trusted weight
    source_ids: [ids.srcKvK, ids.srcAssoc],
    list_membership: ["OVH ledenlijst 2024", "Seed registry check"],
    blacklist_flags: [],
    status: "candidate",
    createdAt: earlier,
    updatedAt: later,
    v: 1,
  },
  {
    id: ids.coDeWit,
    missionId: ids.mission,
    producer: "Human",
    name: "Schildersbedrijf T. de Wit",
    address: "Kerkstraat 4, Nieuw-Vennep",
    region: "Haarlemmermeer",
    sector: "Painters",
    kvk_number: "87654321",
    kvk_gate: "pass",
    // Also on 2 trusted lists, but lower weights: OVH (80) + Fair (40) = 120
    source_ids: [ids.srcAssoc, ids.srcFair],
    list_membership: ["OVH ledenlijst 2024", "BouwBeurs 2024"],
    blacklist_flags: [],
    status: "target",
    createdAt: later,
    updatedAt: later,
    v: 1,
  },
  {
    id: ids.coTarget,
    missionId: ids.mission,
    producer: "Human",
    name: "Van der Laan Schilderwerken",
    address: "Stationsweg 9, Hoofddorp",
    region: "Haarlemmermeer",
    sector: "Painters",
    kvk_number: "11223344",
    kvk_gate: "unchecked",
    source_ids: [ids.srcAssoc],
    list_membership: ["OVH ledenlijst 2024"],
    blacklist_flags: [],
    status: "candidate",
    createdAt: later,
    updatedAt: later,
    v: 1,
  },
  {
    id: ids.coQuick,
    missionId: ids.mission,
    producer: "Human",
    name: "QuickPaint Online",
    address: "",
    region: "Haarlemmermeer",
    sector: "Painters",
    kvk_gate: "unchecked",
    source_ids: [ids.srcGbp],
    list_membership: ["Google Business scrape sample"],
    blacklist_flags: [],
    status: "staged",
    createdAt: earlier,
    updatedAt: earlier,
    v: 1,
  },
  {
    id: ids.coBlack,
    missionId: ids.mission,
    producer: "Human",
    name: "FlashCoat Express",
    address: "Onbekend",
    region: "Haarlemmermeer",
    sector: "Painters",
    kvk_gate: "fail",
    source_ids: [ids.srcGbp],
    list_membership: ["Google Business scrape sample"],
    blacklist_flags: ["no_kvk_match", "complaint_cluster_rumor"],
    status: "staged",
    createdAt: later,
    updatedAt: later,
    v: 1,
  },
];

const reviews: Review[] = [
  {
    id: ids.revKvK,
    missionId: ids.mission,
    producer: "Human",
    targetType: "source",
    targetId: ids.srcKvK,
    action: "agree",
    originalScore: 90,
    humanScore: 90,
    reason: undefined,
    valueTags: [],
    observationIds: [ids.obsKvK],
    hypothesisIds: [],
    evidenceIds: [ids.evKvK],
    version: 1,
    createdAt: later,
    updatedAt: later,
    v: 1,
  },
  {
    id: ids.revCompany,
    missionId: ids.mission,
    producer: "Human",
    targetType: "company",
    targetId: ids.coVoorbeeld,
    action: "adjust",
    originalScore: 84,
    humanScore: 88,
    reason:
      "Association longevity underestimated; OVH membership since 2011 strengthens confidence.",
    valueTags: ["locality", "accountability"],
    observationIds: [ids.obsAssoc],
    hypothesisIds: [ids.hypAssoc],
    evidenceIds: [ids.evAssoc],
    version: 1,
    createdAt: later,
    updatedAt: later,
    v: 1,
  },
];

const findings: Finding[] = [
  {
    id: ids.findKvK,
    missionId: ids.mission,
    producer: "Human",
    summary: "Agreed source KvK Handelsregister at suggested 90 (DEMO).",
    status: "Validated",
    confidence: 90,
    reviewIds: [ids.revKvK],
    observationIds: [ids.obsKvK],
    hypothesisIds: [],
    evidenceIds: [ids.evKvK],
    sourceIds: [ids.srcKvK],
    companyIds: [],
    createdAt: later,
    updatedAt: later,
    v: 1,
  },
  {
    id: ids.findCompany,
    missionId: ids.mission,
    producer: "Human",
    summary:
      "Adjusted company Schilderbedrijf Voorbeeld BV from 84 to 88: association longevity underestimated.",
    status: "Validated",
    confidence: 88,
    reviewIds: [ids.revCompany],
    observationIds: [ids.obsAssoc],
    hypothesisIds: [ids.hypAssoc],
    evidenceIds: [ids.evAssoc],
    sourceIds: [ids.srcKvK, ids.srcAssoc],
    companyIds: [ids.coVoorbeeld],
    createdAt: later,
    updatedAt: later,
    v: 1,
  },
];

const investigations: Investigation[] = [
  {
    id: ids.inv1,
    missionId: ids.mission,
    producer: "Human",
    title: "KvK as primary registry source",
    observationIds: [ids.obsKvK],
    hypothesisIds: [],
    evidenceIds: [ids.evKvK],
    sourceIds: [ids.srcKvK],
    reviewIds: [ids.revKvK],
    findingIds: [ids.findKvK],
    outcome: "Registry sources are hard gates, not vibe scores.",
    confidence: 90,
    status: "Validated",
    createdAt: earlier,
    updatedAt: later,
    v: 1,
  },
  {
    id: ids.inv2,
    missionId: ids.mission,
    producer: "Human",
    title: "Local association vs commercial directory",
    observationIds: [ids.obsAssoc, ids.obsGemeente],
    hypothesisIds: [ids.hypAssoc],
    evidenceIds: [ids.evAssoc],
    sourceIds: [ids.srcAssoc, ids.srcGbp],
    reviewIds: [ids.revCompany],
    findingIds: [ids.findCompany],
    outcome: "Association lists outperform GBP-only discovery for painters.",
    confidence: 82,
    status: "Validated",
    createdAt: later,
    updatedAt: later,
    v: 1,
  },
  {
    id: ids.inv3,
    missionId: ids.mission,
    producer: "Human",
    title: "DNS age as sole trust metric",
    observationIds: [ids.obsDns],
    hypothesisIds: [ids.hypRejected],
    evidenceIds: [ids.evSite],
    sourceIds: [],
    reviewIds: [],
    findingIds: [],
    outcome: "Rejected as sole metric; kept as supporting signal only.",
    confidence: 30,
    status: "Rejected",
    createdAt: later,
    updatedAt: later,
    v: 1,
  },
  {
    id: ids.inv4,
    missionId: ids.mission,
    producer: "Human",
    title: "Trade fair list discovery value",
    observationIds: [],
    hypothesisIds: [],
    evidenceIds: [],
    sourceIds: [ids.srcFair],
    reviewIds: [],
    findingIds: [],
    outcome: "Useful for candidates; weak for trust alone.",
    confidence: 55,
    status: "Validated",
    createdAt: later,
    updatedAt: later,
    v: 1,
  },
  {
    id: ids.inv5,
    missionId: ids.mission,
    producer: "Human",
    title: "Blacklist flags on FlashCoat Express",
    observationIds: [],
    hypothesisIds: [],
    evidenceIds: [],
    sourceIds: [ids.srcGbp],
    reviewIds: [],
    findingIds: [],
    outcome: "Staged with kvk_gate fail + blacklist flags — not a mission target.",
    confidence: 15,
    status: "NeedsMoreEvidence",
    createdAt: later,
    updatedAt: later,
    v: 1,
  },
];

const patterns: Pattern[] = [
  {
    id: ids.pattern1,
    category: "Association",
    insight:
      "Local business associations with multi-year history consistently strengthen trust judgement versus commercial directories alone.",
    investigationIds: [ids.inv1, ids.inv2, ids.inv3, ids.inv4, ids.inv5],
    confidence: 80,
    producer: "Human",
    createdAt: later,
    updatedAt: later,
    v: 1,
  },
];

async function seed() {
  // Reset demo mission so re-seed is clean (no duplicate piles)
  await store.deleteMission(ids.mission);

  await store.upsertMission(mission);
  for (const entry of journal) await store.upsert("journal", entry);
  for (const obs of observations) await store.upsert("observations", obs);
  for (const hyp of hypotheses) await store.upsert("hypotheses", hyp);
  for (const src of sources) await store.upsert("sources", src);
  for (const ms of missionSources) await store.upsert("missionSources", ms);
  for (const ev of evidence) await store.upsert("evidence", ev);
  for (const sig of signals) await store.upsert("signals", sig);
  for (const conf of confidenceProposals)
    await store.upsert("confidenceProposals", conf);
  for (const co of companies) await store.upsert("companies", co);
  for (const rev of reviews) await store.upsert("reviews", rev);
  for (const f of findings) await store.upsert("findings", f);
  for (const inv of investigations) await store.upsert("investigations", inv);
  for (const p of patterns) await store.upsert("patterns", p);

  if (process.env.WRITE_FIXTURES === "1" || process.argv.includes("--write-fixtures")) {
    const { mkdir, writeFile } = await import("node:fs/promises");
    const bundle = await store.exportBundle(ids.mission);
    const fixtureDir = path.resolve(
      __dirname,
      "../../../fixtures/demos/haarlem_painters",
    );
    await mkdir(fixtureDir, { recursive: true });
    const out = path.join(fixtureDir, "bundle.json");
    await writeFile(out, `${JSON.stringify(bundle, null, 2)}\n`, "utf8");
    console.log("Wrote committed fixture:", out);
  }

  console.log("DEMO seed complete — every pipeline step has mock data.");
  console.log("Mission:", mission.location, "/", mission.subsector);
  console.log("Mission ID:", ids.mission);
  console.log({
    journal: journal.length,
    observations: observations.length,
    hypotheses: hypotheses.length,
    sources: sources.length,
    missionSources: missionSources.length,
    evidence: evidence.length,
    signals: signals.length,
    confidenceProposals: confidenceProposals.length,
    companies: companies.length,
    reviews: reviews.length,
    findings: findings.length,
    investigations: investigations.length,
    patterns: patterns.length,
  });
  console.log("Writable:", writableRoot);
  console.log("Open http://localhost:5173 → Haarlemmermeer · Painters (DEMO)");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
