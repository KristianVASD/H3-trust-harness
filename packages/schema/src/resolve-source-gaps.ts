import type { SearchPlanEntry } from "./search-plan.js";

/** Geographic reuse scope on a catalogue Source. */
export type GapSourceScope = "national" | "regional" | "local";

export type GapInputSource = {
  id: string;
  name: string;
  category: string;
  scope: GapSourceScope | string;
  /** Region label; required for regional/local match, ignored for national. */
  region?: string;
  status: string;
};

export type MatchType = "national" | "region";

export type CategoryCoverage =
  | {
      layer: GapSourceScope;
      category: string;
      nuance_rule?: string;
      status: "covered";
      sourceId: string;
      sourceName: string;
      matchType: MatchType;
    }
  | {
      layer: GapSourceScope;
      category: string;
      nuance_rule?: string;
      status: "gap";
    };

/**
 * Human-confirmed via CARA (bronnen). Only these statuses count as coverage.
 * candidate / draft / pending_review / rejected (and any other) are gaps —
 * even if the source already exists and was harvested before.
 */
export function isCaraConfirmedSource(status: string): boolean {
  return status === "accepted" || status === "adjusted";
}

function regionMatches(sourceRegion: string | undefined, missionRegion: string): boolean {
  const a = (sourceRegion ?? "").trim().toLowerCase();
  const b = missionRegion.trim().toLowerCase();
  if (!a || !b) return false;
  return a === b;
}

function scopeMatchesLayer(
  sourceScope: string,
  layer: GapSourceScope,
): boolean {
  return sourceScope === layer;
}

/**
 * Mechanical coverage query for "Check bekende bronnen".
 * Categories come from the active search plan (not a hardcoded list).
 * Per plan entry: covered only when a CARA-confirmed Source matches
 * category + layer (national → category only; regional|local → + region).
 *
 * missionSector is part of the mission identity signature; category matching
 * does not filter on sector today (lists are reused across sectors when scope allows).
 */
export function resolveSourceGaps(
  catalogue: GapInputSource[],
  missionRegion: string,
  _missionSector: string,
  planEntries: SearchPlanEntry[],
): CategoryCoverage[] {
  return planEntries.map((entry) => {
    const layer = entry.layer as GapSourceScope;
    const nuance_rule = entry.nuance_rule;

    const candidates = catalogue.filter(
      (s) =>
        s.category === entry.category &&
        isCaraConfirmedSource(s.status) &&
        scopeMatchesLayer(s.scope, layer),
    );

    if (layer === "national") {
      const national = candidates[0];
      if (national) {
        return {
          layer,
          category: entry.category,
          nuance_rule,
          status: "covered" as const,
          sourceId: national.id,
          sourceName: national.name,
          matchType: "national" as const,
        };
      }
      return {
        layer,
        category: entry.category,
        nuance_rule,
        status: "gap" as const,
      };
    }

    const regional = candidates.find((s) =>
      regionMatches(s.region, missionRegion),
    );
    if (regional) {
      return {
        layer,
        category: entry.category,
        nuance_rule,
        status: "covered" as const,
        sourceId: regional.id,
        sourceName: regional.name,
        matchType: "region" as const,
      };
    }

    return {
      layer,
      category: entry.category,
      nuance_rule,
      status: "gap" as const,
    };
  });
}
