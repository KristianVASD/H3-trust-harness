import { useMemo } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import { computeListCoverage } from "@h3-trust/schema";
import type { MissionData } from "../../hooks/useMissionData";
import { StatusChip } from "../../components/Badges";
import { countTrustedLists } from "../../lib/worker";

export function WorkerResultsPage() {
  const { missionId = "" } = useParams();
  const { companies, sources } = useOutletContext<MissionData>();
  const trustedCount = countTrustedLists(sources);

  const ranked = useMemo(() => {
    return [...companies]
      .map((c) => {
        const cov = computeListCoverage(c, sources);
        return { company: c, cov };
      })
      .sort((a, b) => b.cov.score - a.cov.score || a.company.name.localeCompare(b.company.name));
  }, [companies, sources]);

  function downloadCsv() {
    const header = [
      "name",
      "trust_score",
      "lists_on",
      "lists_total",
      "mentions",
      "kvk_gate",
      "kvk_number",
      "region",
      "status",
    ];
    const lines = ranked.map(({ company: c, cov }) => {
      const mentions = cov.lists.map((s) => s.name).join("; ");
      return [
        csvEscape(c.name),
        String(cov.score),
        String(cov.onCount),
        String(cov.totalCount),
        csvEscape(mentions),
        c.kvk_gate,
        c.kvk_number ?? "",
        csvEscape(c.region ?? ""),
        c.status,
      ].join(",");
    });
    const blob = new Blob([[header.join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `h3-trust-results-${missionId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="worker-step-page">
      <div className="worker-step-intro">
        <h2>Trust results</h2>
        <p className="hint">
          Companies ranked by weighted trusted-list coverage. Score = share of
          CARA-approved list weight they appear on. Mentions show which lists
          named them.
        </p>
        <div className="row" style={{ marginTop: "0.5rem" }}>
          <StatusChip
            label={`${ranked.length} companies`}
            tone={ranked.length ? "active" : "waiting"}
          />
          <StatusChip
            label={`${trustedCount} trusted lists`}
            tone={trustedCount ? "done" : "waiting"}
          />
          {ranked.length > 0 ? (
            <button
              type="button"
              className="btn secondary small"
              onClick={downloadCsv}
            >
              Download CSV
            </button>
          ) : null}
        </div>
      </div>

      {!ranked.length ? (
        <div className="empty worker-empty-hero">
          <p>No companies yet.</p>
          <p className="muted">
            Import a CSV against a trusted list to build the trust ranking.
          </p>
          <div className="row" style={{ justifyContent: "center", marginTop: "1rem" }}>
            <Link className="btn" to={`/work/${missionId}/import`}>
              ← Import data
            </Link>
          </div>
        </div>
      ) : (
        <>
          {trustedCount < 2 ? (
            <p className="hint worker-thin-warning">
              Only {trustedCount} trusted list{trustedCount === 1 ? "" : "s"} —
              scores are thin. Approve more lists in CARA for a wider portfolio.
            </p>
          ) : null}

          <div className="worker-results-table-wrap">
            <table className="worker-results-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Company</th>
                  <th>Trust</th>
                  <th>Mentions</th>
                  <th>KvK</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map(({ company: c, cov }, idx) => (
                  <tr key={c.id} className="worker-results-row">
                    <td className="mono muted">{idx + 1}</td>
                    <td>
                      <strong>{c.name}</strong>
                      {c.region ? (
                        <div className="muted" style={{ fontSize: "0.85rem" }}>
                          {c.region}
                        </div>
                      ) : null}
                    </td>
                    <td>
                      <span className="worker-trust-score">{cov.score}</span>
                      <div className="muted" style={{ fontSize: "0.8rem" }}>
                        {cov.onCount}/{cov.totalCount} lists
                      </div>
                    </td>
                    <td>
                      {cov.lists.length ? (
                        <ul className="worker-mention-list">
                          {cov.lists.map((s) => (
                            <li key={s.id}>{s.name}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td>
                      <StatusChip label={c.kvk_gate} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <footer className="worker-step-footer">
        <Link className="btn secondary" to={`/work/${missionId}/import`}>
          ← Import
        </Link>
        <Link className="btn secondary" to={`/work/${missionId}/sources`}>
          Back to Sources
        </Link>
      </footer>
    </div>
  );
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
