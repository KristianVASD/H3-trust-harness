import type { Source } from "@h3-trust/schema";

/** Matches Discovery Brief success criteria — Import unlocks at this count. */
export const TRUSTED_LIST_UNLOCK = 5;

export function countTrustedLists(sources: Source[]): number {
  return sources.filter(
    (s) => s.status === "accepted" || s.status === "adjusted",
  ).length;
}

export function isTrustedSource(source: Source): boolean {
  return source.status === "accepted" || source.status === "adjusted";
}

export type WorkerStepId = "sources" | "cara" | "import" | "results";

export const WORKER_STEPS: {
  id: WorkerStepId;
  label: string;
  short: string;
}[] = [
  { id: "sources", label: "Sources", short: "1" },
  { id: "cara", label: "CARA", short: "2" },
  { id: "import", label: "Import", short: "3" },
  { id: "results", label: "Results", short: "4" },
];
