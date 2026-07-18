import { z } from "zod";

/** Who performed this step — golden rule on every writable object. */
export const ProducerSchema = z.enum([
  "Human",
  "OmegaClaw",
  "ExternalAI",
  "ImportedDataset",
]);
export type Producer = z.infer<typeof ProducerSchema>;

export const IsoDateSchema = z.string().datetime({ offset: true }).or(z.string().min(1));

const baseMeta = {
  id: z.string().uuid(),
  missionId: z.string().uuid(),
  producer: ProducerSchema,
  createdAt: IsoDateSchema,
  updatedAt: IsoDateSchema,
  v: z.number().int().positive().default(1),
};

export const MissionPhaseSchema = z.enum([
  "observation",
  "hypothesis",
  "evidence",
  "cara",
  "patterns",
  "companies",
  "deep_check",
]);
export type MissionPhase = z.infer<typeof MissionPhaseSchema>;

export const MissionSchema = z.object({
  id: z.string().uuid(),
  location: z.string().min(1),
  country: z.string().min(1),
  sector: z.string().min(1),
  subsector: z.string().min(1),
  goal: z.string().min(1),
  notes: z.string().optional(),
  phases: z.array(
    z.object({
      key: MissionPhaseSchema,
      status: z.enum(["waiting", "active", "done"]),
    }),
  ),
  producer: ProducerSchema,
  createdAt: IsoDateSchema,
  updatedAt: IsoDateSchema,
  v: z.number().int().positive().default(1),
});
export type Mission = z.infer<typeof MissionSchema>;

export const JournalEntrySchema = z.object({
  ...baseMeta,
  kind: z.enum(["note", "task", "journal"]),
  title: z.string().min(1),
  body: z.string(),
  done: z.boolean().optional(),
});
export type JournalEntry = z.infer<typeof JournalEntrySchema>;

export const ObservationSchema = z.object({
  ...baseMeta,
  statement: z.string().min(1),
  evidenceUrls: z.array(z.string()).default([]),
  evidenceIds: z.array(z.string().uuid()).default([]),
  tags: z.array(z.string()).default([]),
  /** Facts only — no score, no verdict. */
});
export type Observation = z.infer<typeof ObservationSchema>;

export const HypothesisStatusSchema = z.enum([
  "Draft",
  "Testing",
  "Validated",
  "Rejected",
  "Archived",
]);
export type HypothesisStatus = z.infer<typeof HypothesisStatusSchema>;

export const HypothesisSchema = z.object({
  ...baseMeta,
  statement: z.string().min(1),
  status: HypothesisStatusSchema,
  observationIds: z.array(z.string().uuid()).default([]),
  rationale: z.string().optional(),
});
export type Hypothesis = z.infer<typeof HypothesisSchema>;

export const SourceTypeSchema = z.enum([
  "registry",
  "association",
  "directory",
  "website",
  "municipality",
  "news",
  "other",
]);
export type SourceType = z.infer<typeof SourceTypeSchema>;

export const SourceStatusSchema = z.enum([
  "draft",
  "pending_review",
  "accepted",
  "adjusted",
  "rejected",
]);
export type SourceStatus = z.infer<typeof SourceStatusSchema>;

/** Trust-source taxonomy for discovery lists (separate from legacy Source.type). */
export const SourceCategorySchema = z.enum([
  "registry",
  "branch_association",
  "quality_mark",
  "local_business_association",
  "internship_market",
  "trade_fair",
  "sponsorship",
  "local_media",
  "peer_referral",
  "digital_presence",
]);
export type SourceCategory = z.infer<typeof SourceCategorySchema>;

export const SOURCE_CATEGORIES = SourceCategorySchema.options;

export const SourceSchema = z.object({
  ...baseMeta,
  name: z.string().min(1),
  type: SourceTypeSchema,
  /** Migrates missing values to digital_presence on parse. */
  category: SourceCategorySchema.default("digital_presence"),
  url: z.string().optional(),
  reason: z.string().optional(),
  suggestedWeight: z.number().min(0).max(100).optional(),
  suggestedConfidence: z.number().min(0).max(100).optional(),
  signalIds: z.array(z.string().uuid()).default([]),
  evidenceIds: z.array(z.string().uuid()).default([]),
  status: SourceStatusSchema.default("draft"),
  notes: z.string().optional(),
});
export type Source = z.infer<typeof SourceSchema>;

export const KvkGateSchema = z.enum(["pass", "fail", "unchecked"]);
export type KvkGate = z.infer<typeof KvkGateSchema>;

export const CompanyStatusSchema = z.enum(["candidate", "target", "staged"]);
export type CompanyStatus = z.infer<typeof CompanyStatusSchema>;

export const CompanySchema = z.object({
  ...baseMeta,
  name: z.string().min(1),
  address: z.string().default(""),
  region: z.string().default(""),
  sector: z.string().default(""),
  kvk_number: z.string().optional(),
  /** Hard gate — not a weighted score. */
  kvk_gate: KvkGateSchema.default("unchecked"),
  source_ids: z.array(z.string().uuid()).default([]),
  list_membership: z.array(z.string()).default([]),
  /** Empty = no hard exclusion. */
  blacklist_flags: z.array(z.string()).default([]),
  status: CompanyStatusSchema.default("candidate"),
});
export type Company = z.infer<typeof CompanySchema>;

export const EvidenceSchema = z.object({
  ...baseMeta,
  title: z.string().min(1),
  url: z.string().optional(),
  snippet: z.string().optional(),
  observationIds: z.array(z.string().uuid()).default([]),
  sourceIds: z.array(z.string().uuid()).default([]),
  capturedAt: IsoDateSchema.optional(),
});
export type Evidence = z.infer<typeof EvidenceSchema>;

export const SignalKeySchema = z.enum([
  "registry",
  "longevity",
  "association",
  "infra",
  "locality",
  "certification",
  "other",
]);
export type SignalKey = z.infer<typeof SignalKeySchema>;

export const SignalSchema = z.object({
  ...baseMeta,
  key: SignalKeySchema,
  label: z.string().min(1),
  delta: z.number(),
  note: z.string().optional(),
  evidenceIds: z.array(z.string().uuid()).default([]),
  observationIds: z.array(z.string().uuid()).default([]),
  sourceId: z.string().uuid().optional(),
});
export type Signal = z.infer<typeof SignalSchema>;

export const ConfidenceProposalSchema = z.object({
  ...baseMeta,
  targetType: z.enum(["source", "hypothesis", "investigation"]),
  targetId: z.string().uuid(),
  suggested: z.number().min(0).max(100),
  explanation: z.string().min(1),
  signalIds: z.array(z.string().uuid()).default([]),
});
export type ConfidenceProposal = z.infer<typeof ConfidenceProposalSchema>;

export const ReviewActionSchema = z.enum(["agree", "disagree", "adjust"]);
export type ReviewAction = z.infer<typeof ReviewActionSchema>;

export const ReviewSchema = z.object({
  ...baseMeta,
  producer: z.literal("Human"),
  targetType: z.enum([
    "source",
    "company",
    "hypothesis",
    "confidence",
    "finding",
  ]),
  targetId: z.string().uuid(),
  action: ReviewActionSchema,
  originalScore: z.number().min(0).max(100).optional(),
  humanScore: z.number().min(0).max(100).optional(),
  reason: z.string().optional(),
  valueTags: z.array(z.string()).default([]),
  observationIds: z.array(z.string().uuid()).default([]),
  hypothesisIds: z.array(z.string().uuid()).default([]),
  evidenceIds: z.array(z.string().uuid()).default([]),
  version: z.number().int().positive().default(1),
});
export type Review = z.infer<typeof ReviewSchema>;

export const FindingStatusSchema = z.enum([
  "Validated",
  "Rejected",
  "NeedsMoreEvidence",
]);
export type FindingStatus = z.infer<typeof FindingStatusSchema>;

export const FindingSchema = z.object({
  ...baseMeta,
  producer: z.literal("Human"),
  summary: z.string().min(1),
  status: FindingStatusSchema,
  confidence: z.number().min(0).max(100).optional(),
  reviewIds: z.array(z.string().uuid()).default([]),
  observationIds: z.array(z.string().uuid()).default([]),
  hypothesisIds: z.array(z.string().uuid()).default([]),
  evidenceIds: z.array(z.string().uuid()).default([]),
  sourceIds: z.array(z.string().uuid()).default([]),
  companyIds: z.array(z.string().uuid()).default([]),
});
export type Finding = z.infer<typeof FindingSchema>;

export const InvestigationStatusSchema = z.enum([
  "Validated",
  "Rejected",
  "NeedsMoreEvidence",
  "InProgress",
]);
export type InvestigationStatus = z.infer<typeof InvestigationStatusSchema>;

export const InvestigationSchema = z.object({
  ...baseMeta,
  title: z.string().min(1),
  observationIds: z.array(z.string().uuid()).default([]),
  hypothesisIds: z.array(z.string().uuid()).default([]),
  evidenceIds: z.array(z.string().uuid()).default([]),
  sourceIds: z.array(z.string().uuid()).default([]),
  reviewIds: z.array(z.string().uuid()).default([]),
  findingIds: z.array(z.string().uuid()).default([]),
  outcome: z.string().optional(),
  confidence: z.number().min(0).max(100).optional(),
  status: InvestigationStatusSchema.default("InProgress"),
});
export type Investigation = z.infer<typeof InvestigationSchema>;

export const PatternSchema = z.object({
  id: z.string().uuid(),
  category: z.string().min(1),
  insight: z.string().min(1),
  investigationIds: z.array(z.string().uuid()).min(1),
  confidence: z.number().min(0).max(100).optional(),
  producer: ProducerSchema,
  createdAt: IsoDateSchema,
  updatedAt: IsoDateSchema,
  v: z.number().int().positive().default(1),
});
export type Pattern = z.infer<typeof PatternSchema>;

/** Minimum validated investigations required before promoting a pattern. */
export const PATTERN_MIN_INVESTIGATIONS = 5;

export const ExportBundleSchema = z.object({
  exportedAt: IsoDateSchema,
  mission: MissionSchema,
  investigations: z.array(InvestigationSchema),
  observations: z.array(ObservationSchema),
  evidence: z.array(EvidenceSchema),
  hypotheses: z.array(HypothesisSchema),
  sources: z.array(SourceSchema),
  companies: z.array(CompanySchema),
  signals: z.array(SignalSchema),
  confidenceProposals: z.array(ConfidenceProposalSchema),
  reviews: z.array(ReviewSchema),
  findings: z.array(FindingSchema),
  patterns: z.array(PatternSchema),
  journal: z.array(JournalEntrySchema),
});
export type ExportBundle = z.infer<typeof ExportBundleSchema>;

export const CollectionNameSchema = z.enum([
  "missions",
  "journal",
  "observations",
  "hypotheses",
  "sources",
  "companies",
  "evidence",
  "signals",
  "confidenceProposals",
  "reviews",
  "findings",
  "investigations",
  "patterns",
]);
export type CollectionName = z.infer<typeof CollectionNameSchema>;

export * from "./agent-contracts";