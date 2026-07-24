import { useState } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import type { MissionData } from "../../hooks/useMissionData";
import { GapFillBoard } from "../../components/worker/GapFillBoard";
import { api } from "../../api";

export function WorkerSourcesPage() {
  const { missionId = "" } = useParams();
  const data = useOutletContext<MissionData>();
  const { mission, sources, catalogue, searchPlan, reload } = data;
  const [warmBusy, setWarmBusy] = useState(false);
  const [warmMsg, setWarmMsg] = useState<string | null>(null);

  if (!mission) {
    return <p className="muted">Loading…</p>;
  }

  const caraQueue = sources.filter(
    (s) => s.status === "draft" || s.status === "pending_review",
  ).length;
  const candidates = sources.filter((s) => s.status === "candidate").length;

  async function warmStart() {
    setWarmBusy(true);
    setWarmMsg(null);
    try {
      const res = await api.warmStartSources(missionId);
      setWarmMsg(
        res.linked
          ? `Linked ${res.linked} reusable list(s) from the catalogue (KvK, local associations, …).`
          : "No reusable CARA-confirmed lists found to link yet.",
      );
      await reload();
    } catch (err) {
      setWarmMsg(err instanceof Error ? err.message : "Warm-start failed");
    } finally {
      setWarmBusy(false);
    }
  }

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
        {sources.length === 0 ? (
          <div className="worker-warm-start">
            <p className="muted" style={{ marginBottom: "0.5rem" }}>
              No sources linked yet. Pull reusable seed lists (national registry
              + confirmed lists for this location) so the board is not empty.
            </p>
            <button
              type="button"
              className="btn"
              disabled={warmBusy}
              onClick={() => void warmStart()}
            >
              {warmBusy ? "Linking…" : "Warm-start from catalogue"}
            </button>
            {warmMsg ? (
              <p className="muted" style={{ marginTop: "0.5rem" }}>
                {warmMsg}
              </p>
            ) : null}
          </div>
        ) : null}
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
