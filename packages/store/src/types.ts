import type {
  CollectionName,
  Company,
  ConfidenceProposal,
  Evidence,
  ExportBundle,
  Finding,
  Hypothesis,
  Investigation,
  JournalEntry,
  Mission,
  Observation,
  Pattern,
  Review,
  Signal,
  Source,
} from "@h3-trust/schema";

export type EntityMap = {
  missions: Mission;
  journal: JournalEntry;
  observations: Observation;
  hypotheses: Hypothesis;
  sources: Source;
  companies: Company;
  evidence: Evidence;
  signals: Signal;
  confidenceProposals: ConfidenceProposal;
  reviews: Review;
  findings: Finding;
  investigations: Investigation;
  patterns: Pattern;
};

export interface Store {
  listMissions(): Promise<Mission[]>;
  getMission(id: string): Promise<Mission | null>;
  upsertMission(mission: Mission): Promise<Mission>;

  listByMission<K extends Exclude<CollectionName, "missions" | "patterns">>(
    collection: K,
    missionId: string,
  ): Promise<EntityMap[K][]>;

  get<K extends CollectionName>(
    collection: K,
    id: string,
  ): Promise<EntityMap[K] | null>;

  upsert<K extends CollectionName>(
    collection: K,
    entity: EntityMap[K],
  ): Promise<EntityMap[K]>;

  remove(collection: CollectionName, id: string): Promise<boolean>;

  /** Deletes mission JSON and all mission-scoped records. Patterns linked only to this mission are removed. */
  deleteMission(missionId: string): Promise<boolean>;

  listPatterns(): Promise<Pattern[]>;
  exportBundle(missionId: string): Promise<ExportBundle>;
}
