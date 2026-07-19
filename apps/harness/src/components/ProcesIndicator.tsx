import { useMemo } from "react";
import { NavLink, useParams } from "react-router-dom";
import {
  resolveSourceGaps,
  type Company,
  type Mission,
  type Review,
  type SearchPlan,
  type Source,
} from "@h3-trust/schema";

interface Props {
  mission: Mission;
  sources: Source[];
  catalogue: Source[];
  companies: Company[];
  reviews: Review[];
  searchPlan: SearchPlan | null;
}

/**
 * Persistente procesindicator — zichtbaar op elke Mission-pagina.
 * Leest uitsluitend bestaande velden. Geen nieuwe databronnen.
 */
export function ProcesIndicator({
  mission,
  sources,
  catalogue,
  companies,
  reviews,
  searchPlan,
}: Props) {
  const { missionId = "" } = useParams();

  const stats = useMemo(() => {
    const planEntries = searchPlan?.entries ?? [];
    const coverage = resolveSourceGaps(
      catalogue,
      mission.location,
      mission.sector,
      planEntries,
    );
    const gapCount = coverage.filter((r) => r.status === "gap").length;
    const totalCategories = coverage.length;

    const triageQueue = sources.filter((s) => s.status === "candidate").length;

    const caraSourceQueue = sources.filter(
      (s) => s.status === "draft" || s.status === "pending_review",
    ).length;

    const reviewedCompanyIds = new Set(
      reviews.filter((r) => r.targetType === "company").map((r) => r.targetId),
    );
    const caraCompanyQueue = companies.filter(
      (c) =>
        (c.status === "candidate" || c.status === "target") &&
        !reviewedCompanyIds.has(c.id),
    ).length;

    const activePhase =
      mission.phases.find((p) => p.status === "active")?.key ?? "observation";

    let nextAction = "Geen openstaande acties";
    let nextLink = `/missions/${missionId}`;
    if (triageQueue > 0) {
      nextAction = `Triage ${triageQueue} kandidaat${triageQueue > 1 ? "en" : ""}`;
      nextLink = `/missions/${missionId}/triage`;
    } else if (caraSourceQueue > 0) {
      nextAction = `CARA ${caraSourceQueue} bron${caraSourceQueue > 1 ? "nen" : ""}`;
      nextLink = `/missions/${missionId}/cara?target=source`;
    } else if (caraCompanyQueue > 0) {
      nextAction = `CARA ${caraCompanyQueue} bedrijf${caraCompanyQueue > 1 ? "en" : ""}`;
      nextLink = `/missions/${missionId}/cara?target=company`;
    } else if (gapCount > 0) {
      nextAction = `${gapCount} categorie${gapCount > 1 ? "ën" : ""} nog zonder bron`;
      nextLink = `/missions/${missionId}/triage`;
    }

    return {
      gapCount,
      totalCategories,
      triageQueue,
      caraSourceQueue,
      caraCompanyQueue,
      activePhase,
      nextAction,
      nextLink,
    };
  }, [mission, sources, catalogue, companies, reviews, searchPlan, missionId]);

  const phaseSteps = [
    "observation",
    "hypothesis",
    "evidence",
    "cara",
    "patterns",
    "companies",
    "deep_check",
  ] as const;

  return (
    <div className="proces-indicator">
      <div className="proces-fases">
        {phaseSteps.map((step) => {
          const phase = mission.phases.find((p) => p.key === step);
          const isActive = step === stats.activePhase;
          const isDone = phase?.status === "done";
          return (
            <span
              key={step}
              className={`proces-fase ${isActive ? "active" : ""} ${isDone ? "done" : ""}`}
              title={`${step}: ${phase?.status ?? "waiting"}`}
            >
              {isDone ? "✓" : isActive ? "▸" : "·"} {step}
            </span>
          );
        })}
      </div>

      <div className="proces-tellers">
        <NavLink
          to={`/missions/${missionId}/triage`}
          className="teller teller-triage"
          title="Kandidatenlijst-triage"
        >
          ☰ {stats.triageQueue} triage
        </NavLink>

        <NavLink
          to={`/missions/${missionId}/cara?target=source`}
          className="teller teller-cara-source"
          title="CARA bronnen"
        >
          ◉ {stats.caraSourceQueue} bronnen
        </NavLink>

        <NavLink
          to={`/missions/${missionId}/cara?target=company`}
          className="teller teller-cara-company"
          title="CARA bedrijven"
        >
          ◆ {stats.caraCompanyQueue} bedrijven
        </NavLink>

        <span className="teller teller-gaps" title="Open categorieën zonder CARA-bron">
          {stats.gapCount}/{stats.totalCategories} gaps
        </span>
      </div>

      <div className="proces-next">
        <NavLink to={stats.nextLink} className="next-action">
          → {stats.nextAction}
        </NavLink>
      </div>
    </div>
  );
}
