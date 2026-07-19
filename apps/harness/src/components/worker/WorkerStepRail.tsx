import { NavLink, useParams } from "react-router-dom";
import { WORKER_STEPS, type WorkerStepId } from "../../lib/worker";

export function WorkerStepRail({
  current,
  trustedCount,
  caraQueue,
  companyCount,
}: {
  current: WorkerStepId;
  trustedCount: number;
  caraQueue: number;
  companyCount: number;
}) {
  const { missionId = "" } = useParams();
  const currentIdx = WORKER_STEPS.findIndex((s) => s.id === current);

  return (
    <nav className="worker-step-rail" aria-label="Data worker steps">
      {WORKER_STEPS.map((step, idx) => {
        const done = idx < currentIdx;
        const active = step.id === current;
        let meta = "";
        if (step.id === "cara" && caraQueue > 0) meta = `${caraQueue} queue`;
        if (step.id === "import") meta = `${trustedCount}/5 lists`;
        if (step.id === "results" && companyCount > 0) meta = `${companyCount}`;

        return (
          <NavLink
            key={step.id}
            to={`/work/${missionId}/${step.id}`}
            className={`worker-step ${active ? "active" : ""} ${done ? "done" : ""}`}
          >
            <span className="worker-step-num">{done ? "✓" : step.short}</span>
            <span className="worker-step-label">{step.label}</span>
            {meta ? <span className="worker-step-meta">{meta}</span> : null}
          </NavLink>
        );
      })}
    </nav>
  );
}
