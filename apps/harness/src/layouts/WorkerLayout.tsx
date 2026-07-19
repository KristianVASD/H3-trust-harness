import { useMemo } from "react";
import { NavLink, Outlet, useParams, useLocation } from "react-router-dom";
import { resolveSourceGaps } from "@h3-trust/schema";
import { useMissionData } from "../hooks/useMissionData";
import { WorkerStepRail } from "../components/worker/WorkerStepRail";
import { TrustedPortfolioBar } from "../components/worker/TrustedPortfolioBar";
import {
  countTrustedLists,
  type WorkerStepId,
} from "../lib/worker";

function stepFromPath(pathname: string): WorkerStepId {
  if (pathname.endsWith("/cara")) return "cara";
  if (pathname.endsWith("/import")) return "import";
  if (pathname.endsWith("/results")) return "results";
  return "sources";
}

/**
 * Linear Data Worker shell — Sources → CARA → Import → Results.
 * Investigator UI stays on /missions/:id/*.
 */
export function WorkerLayout() {
  const { missionId = "" } = useParams();
  const location = useLocation();
  const data = useMissionData(missionId);
  const { mission, error, sources, catalogue, companies, searchPlan } = data;

  const current = stepFromPath(location.pathname);

  const stats = useMemo(() => {
    const planEntries = searchPlan?.entries ?? [];
    const coverage = mission
      ? resolveSourceGaps(
          catalogue,
          mission.location,
          mission.sector,
          planEntries,
        )
      : [];
    const gapCount = coverage.filter((r) => r.status === "gap").length;
    const trustedCount = countTrustedLists(sources);
    const caraQueue = sources.filter(
      (s) => s.status === "draft" || s.status === "pending_review",
    ).length;
    return {
      gapCount,
      totalCategories: coverage.length,
      trustedCount,
      caraQueue,
    };
  }, [mission, catalogue, searchPlan, sources]);

  if (!mission && !error) {
    return <p className="muted" style={{ padding: "2rem" }}>Loading job…</p>;
  }

  return (
    <div className="worker-shell">
      <header className="worker-header">
        <div className="worker-header-top">
          <NavLink to="/" className="btn secondary small">
            ← Home
          </NavLink>
          <NavLink
            to={`/missions/${missionId}`}
            className="btn secondary small"
            title="Open full investigator UI"
          >
            ← Investigation
          </NavLink>
        </div>

        <p className="worker-eyebrow">Data Worker</p>
        <h1 className="worker-title">
          {mission ? `${mission.location} · ${mission.subsector}` : "Job"}
        </h1>
        {mission ? <p className="muted worker-goal">{mission.goal}</p> : null}

        <WorkerStepRail
          current={current}
          trustedCount={stats.trustedCount}
          caraQueue={stats.caraQueue}
          companyCount={companies.length}
        />

        {mission ? (
          <TrustedPortfolioBar
            missionId={missionId}
            trustedCount={stats.trustedCount}
            gapCount={stats.gapCount}
            totalCategories={stats.totalCategories}
            caraQueue={stats.caraQueue}
          />
        ) : null}
      </header>

      {error ? <div className="error">{error}</div> : null}

      <main className="worker-content">
        <Outlet context={data} />
      </main>
    </div>
  );
}
