import { mkdir, readFile, readdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  CollectionNameSchema,
  CompanySchema,
  ConfidenceProposalSchema,
  EvidenceSchema,
  ExportBundleSchema,
  FindingSchema,
  HypothesisSchema,
  InvestigationSchema,
  JournalEntrySchema,
  MissionSchema,
  ObservationSchema,
  PatternSchema,
  ReviewSchema,
  SignalSchema,
  SourceSchema,
  type CollectionName,
  type ExportBundle,
  type Mission,
  type Pattern,
} from "@h3-trust/schema";
import type { EntityMap, Store } from "./types.js";

const schemas = {
  missions: MissionSchema,
  journal: JournalEntrySchema,
  observations: ObservationSchema,
  hypotheses: HypothesisSchema,
  sources: SourceSchema,
  companies: CompanySchema,
  evidence: EvidenceSchema,
  signals: SignalSchema,
  confidenceProposals: ConfidenceProposalSchema,
  reviews: ReviewSchema,
  findings: FindingSchema,
  investigations: InvestigationSchema,
  patterns: PatternSchema,
} as const;

function nowIso(): string {
  return new Date().toISOString();
}

export class FileStore implements Store {
  constructor(private readonly rootDir: string) {}

  private dir(collection: CollectionName): string {
    return path.join(this.rootDir, collection);
  }

  private file(collection: CollectionName, id: string): string {
    return path.join(this.dir(collection), `${id}.json`);
  }

  private async ensureDir(collection: CollectionName): Promise<void> {
    await mkdir(this.dir(collection), { recursive: true });
  }

  private async readAll<K extends CollectionName>(
    collection: K,
  ): Promise<EntityMap[K][]> {
    await this.ensureDir(collection);
    const files = await readdir(this.dir(collection));
    const items: EntityMap[K][] = [];
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      const raw = await readFile(path.join(this.dir(collection), file), "utf8");
      const parsed = schemas[collection].parse(JSON.parse(raw));
      items.push(parsed as EntityMap[K]);
    }
    return items;
  }

  async listMissions(): Promise<Mission[]> {
    const missions = await this.readAll("missions");
    return missions.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async getMission(id: string): Promise<Mission | null> {
    return this.get("missions", id);
  }

  async upsertMission(mission: Mission): Promise<Mission> {
    return this.upsert("missions", mission);
  }

  async listByMission<K extends Exclude<CollectionName, "missions" | "patterns">>(
    collection: K,
    missionId: string,
  ): Promise<EntityMap[K][]> {
    const all = await this.readAll(collection);
    return all
      .filter((item) => "missionId" in item && item.missionId === missionId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async get<K extends CollectionName>(
    collection: K,
    id: string,
  ): Promise<EntityMap[K] | null> {
    CollectionNameSchema.parse(collection);
    try {
      const raw = await readFile(this.file(collection, id), "utf8");
      return schemas[collection].parse(JSON.parse(raw)) as EntityMap[K];
    } catch {
      return null;
    }
  }

  async upsert<K extends CollectionName>(
    collection: K,
    entity: EntityMap[K],
  ): Promise<EntityMap[K]> {
    await this.ensureDir(collection);
    const stamped = {
      ...entity,
      updatedAt: nowIso(),
      v: ("v" in entity ? Number(entity.v) || 1 : 1),
    };
    const parsed = schemas[collection].parse(stamped) as EntityMap[K];
    await writeFile(
      this.file(collection, parsed.id),
      `${JSON.stringify(parsed, null, 2)}\n`,
      "utf8",
    );
    return parsed;
  }

  async remove(collection: CollectionName, id: string): Promise<boolean> {
    try {
      await unlink(this.file(collection, id));
      return true;
    } catch {
      return false;
    }
  }

  async deleteMission(missionId: string): Promise<boolean> {
    const mission = await this.getMission(missionId);
    if (!mission) return false;

    const investigationIds = new Set(
      (await this.listByMission("investigations", missionId)).map((i) => i.id),
    );

    const scoped = CollectionNameSchema.options.filter(
      (name) => name !== "missions" && name !== "patterns",
    ) as Exclude<CollectionName, "missions" | "patterns">[];

    for (const collection of scoped) {
      const items = await this.listByMission(collection, missionId);
      for (const item of items) {
        await this.remove(collection, item.id);
      }
    }

    for (const pattern of await this.listPatterns()) {
      const kept = pattern.investigationIds.filter(
        (id) => !investigationIds.has(id),
      );
      if (kept.length === 0) {
        await this.remove("patterns", pattern.id);
      } else if (kept.length !== pattern.investigationIds.length) {
        await this.upsert("patterns", {
          ...pattern,
          investigationIds: kept,
        });
      }
    }

    try {
      await unlink(path.join(this.rootDir, "export", `${missionId}.json`));
    } catch {
      /* no export file */
    }

    return this.remove("missions", missionId);
  }

  async listPatterns(): Promise<Pattern[]> {
    return this.readAll("patterns");
  }

  async exportBundle(missionId: string): Promise<ExportBundle> {
    const mission = await this.getMission(missionId);
    if (!mission) {
      throw new Error(`Mission not found: ${missionId}`);
    }

    const [
      investigations,
      observations,
      evidence,
      hypotheses,
      sources,
      companies,
      signals,
      confidenceProposals,
      reviews,
      findings,
      journal,
    ] = await Promise.all([
      this.listByMission("investigations", missionId),
      this.listByMission("observations", missionId),
      this.listByMission("evidence", missionId),
      this.listByMission("hypotheses", missionId),
      this.listByMission("sources", missionId),
      this.listByMission("companies", missionId),
      this.listByMission("signals", missionId),
      this.listByMission("confidenceProposals", missionId),
      this.listByMission("reviews", missionId),
      this.listByMission("findings", missionId),
      this.listByMission("journal", missionId),
    ]);

    const investigationIds = new Set(investigations.map((i) => i.id));
    const patterns = (await this.listPatterns()).filter((p) =>
      p.investigationIds.some((id) => investigationIds.has(id)),
    );

    const bundle = {
      exportedAt: nowIso(),
      mission,
      investigations,
      observations,
      evidence,
      hypotheses,
      sources,
      companies,
      signals,
      confidenceProposals,
      reviews,
      findings,
      patterns,
      journal,
    };

    return ExportBundleSchema.parse(bundle);
  }
}

export type { Store, EntityMap } from "./types.js";
