import { Link, useOutletContext, useParams } from "react-router-dom";
import type { MissionData } from "../../hooks/useMissionData";
import { GapFillBoard } from "../../components/worker/GapFillBoard";

export function WorkerSourcesPage() {
  const { missionId = "" } = useParams();
  const data = useOutletContext<MissionData>();
  const { mission, sources, catalogue, searchPlan, reload } = data;

  if (!mission) {
    return <p className="muted">Loading…</p>;
  }

  const caraQueue = sources.filter(
    (s) => s.status === "draft" || s.status === "pending_review",
  ).length;
  const candidates = sources.filter((s) => s.status === "candidate").length;

  return (
    <div className="worker-step-page">
      <div className="worker-step-intro">
        <h2>Fill source gaps</h2>
        <p className="hint">
          Add found lists under each category — multiple per category is fine.
          Keep what is worth rating, then send drafts to CARA. No final decision
          here; only selection.
        </p>
        <p className="muted">
          {candidates} candidates · {caraQueue} ready for CARA
        </p>
      </div>

      <GapFillBoard
        missionId={missionId}
        mission={mission}
        sources={sources}
        catalogue={catalogue}
        planEntries={searchPlan?.entries ?? []}
        onChanged={reload}
      />

      <footer className="worker-step-footer">
        <Link
          className={`btn ${caraQueue > 0 ? "" : "secondary"}`}
          to={`/work/${missionId}/cara`}
        >
          {caraQueue > 0
            ? `Continue to CARA (${caraQueue}) →`
            : "Continue to CARA →"}
        </Link>
      </footer>
    </div>
  );
}
