import { Link } from "react-router-dom";
import { TRUSTED_LIST_UNLOCK } from "../../lib/worker";

export function TrustedPortfolioBar({
  missionId,
  trustedCount,
  gapCount,
  totalCategories,
  caraQueue,
}: {
  missionId: string;
  trustedCount: number;
  gapCount: number;
  totalCategories: number;
  caraQueue: number;
}) {
  const pct = Math.min(
    100,
    Math.round((trustedCount / TRUSTED_LIST_UNLOCK) * 100),
  );
  const unlocked = trustedCount >= TRUSTED_LIST_UNLOCK;

  return (
    <div className="trusted-portfolio-bar">
      <div className="trusted-portfolio-top">
        <div>
          <strong>
            {trustedCount}/{TRUSTED_LIST_UNLOCK} trusted lists
          </strong>
          <span className="muted">
            {" "}
            · {gapCount}/{totalCategories} gaps open
            {caraQueue > 0 ? ` · ${caraQueue} awaiting CARA` : ""}
          </span>
        </div>
        {unlocked ? (
          <Link className="btn small" to={`/work/${missionId}/import`}>
            Import unlocked →
          </Link>
        ) : (
          <span className="muted">
            Import unlocks at {TRUSTED_LIST_UNLOCK} CARA-approved lists
          </span>
        )}
      </div>
      <div className="trusted-portfolio-track" aria-hidden>
        <div
          className={`trusted-portfolio-fill ${unlocked ? "unlocked" : ""}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
