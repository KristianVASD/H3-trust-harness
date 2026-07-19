import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import { v4 as uuid } from "uuid";
import type { Review, Source } from "@h3-trust/schema";
import { createEntity, updateEntity } from "../../api-extra";
import type { MissionData } from "../../hooks/useMissionData";
import { ProducerBadge, StatusChip } from "../../components/Badges";
import { TRUSTED_LIST_UNLOCK, countTrustedLists } from "../../lib/worker";

/**
 * Source-only CARA for Data Worker — one focus card, queue count, portfolio bar updates via layout.
 */
export function WorkerCaraPage() {
  const { missionId = "" } = useParams();
  const { sources, reload } = useOutletContext<MissionData>();

  const sourceQueue = useMemo(
    () =>
      sources.filter((s) => s.status === "draft" || s.status === "pending_review"),
    [sources],
  );

  const trustedCount = countTrustedLists(sources);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [humanScore, setHumanScore] = useState("70");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setSelectedId((prev) => {
      if (prev && sourceQueue.some((s) => s.id === prev)) return prev;
      return sourceQueue[0]?.id ?? null;
    });
  }, [sourceQueue]);

  const selected: Source | null =
    sources.find((s) => s.id === selectedId) ?? null;

  useEffect(() => {
    if (selected) {
      setHumanScore(
        String(selected.suggestedConfidence ?? selected.suggestedWeight ?? 70),
      );
    }
  }, [selected]);

  async function submit(action: "agree" | "disagree" | "adjust") {
    if (!selected) return;
    if ((action === "adjust" || action === "disagree") && reason.trim().length < 8) {
      setError("Adjust / Disagree needs a reason (min 8 characters).");
      return;
    }

    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const now = new Date().toISOString();
      const original =
        selected.suggestedConfidence ?? selected.suggestedWeight ?? undefined;
      const score =
        action === "agree"
          ? original
          : action === "disagree"
            ? 0
            : Number(humanScore);

      const review: Review = {
        id: uuid(),
        missionId,
        producer: "Human",
        targetType: "source",
        targetId: selected.id,
        action,
        originalScore: original,
        humanScore: score,
        reason: reason.trim() || undefined,
        valueTags: [],
        observationIds: [],
        hypothesisIds: [],
        evidenceIds: selected.evidenceIds,
        version: 1,
        createdAt: now,
        updatedAt: now,
        v: 1,
      };

      await createEntity(missionId, "reviews", review);

      const status =
        action === "agree"
          ? "accepted"
          : action === "adjust"
            ? "adjusted"
            : "rejected";

      await updateEntity("sources", {
        ...selected,
        status,
        suggestedConfidence: score,
        suggestedWeight: score,
        updatedAt: now,
      });

      if (action !== "agree") {
        await createEntity(missionId, "findings", {
          id: uuid(),
          missionId,
          producer: "Human" as const,
          summary:
            action === "adjust"
              ? `Adjusted source "${selected.name}" from ${original ?? "?"} to ${score}: ${reason}`
              : `Rejected source "${selected.name}": ${reason}`,
          status: action === "adjust" ? "Validated" : "Rejected",
          confidence: score,
          reviewIds: [review.id],
          observationIds: [],
          hypothesisIds: [],
          evidenceIds: selected.evidenceIds,
          sourceIds: [selected.id],
          companyIds: [],
          createdAt: now,
          updatedAt: now,
          v: 1,
        });
      }

      setReason("");
      setMessage(`${action} recorded for ${selected.name}.`);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "CARA failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="worker-step-page">
      <div className="worker-step-intro">
        <h2>◉ Approve source ratings</h2>
        <p className="hint">
          Human judgement only. Agree keeps the suggested score; Adjust sets a new
          weight; Disagree rejects the list. Import unlocks at{" "}
          {TRUSTED_LIST_UNLOCK} trusted lists ({trustedCount} so far).
        </p>
      </div>

      {error ? <div className="error">{error}</div> : null}
      {message ? (
        <div className="thesis" style={{ borderColor: "var(--teal)" }}>
          {message}
        </div>
      ) : null}

      {!sourceQueue.length ? (
        <div className="empty worker-empty-hero">
          <p>No sources waiting for CARA.</p>
          <p className="muted">
            Keep candidates on the Sources step, or continue if you already have
            enough trusted lists.
          </p>
          <div className="row" style={{ justifyContent: "center", marginTop: "1rem" }}>
            <Link className="btn secondary" to={`/work/${missionId}/sources`}>
              ← Sources
            </Link>
            <Link
              className="btn"
              to={
                trustedCount >= TRUSTED_LIST_UNLOCK
                  ? `/work/${missionId}/import`
                  : `/work/${missionId}/sources`
              }
            >
              {trustedCount >= TRUSTED_LIST_UNLOCK
                ? "Continue to Import →"
                : "Add more sources →"}
            </Link>
          </div>
        </div>
      ) : (
        <div className="worker-cara-layout">
          <aside className="worker-cara-queue panel cara-source-panel">
            <h3 style={{ marginTop: 0 }}>
              Queue ({sourceQueue.length})
            </h3>
            <div className="list">
              {sourceQueue.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`item worker-queue-item ${selectedId === s.id ? "selected" : ""}`}
                  onClick={() => setSelectedId(s.id)}
                >
                  <strong>{s.name}</strong>
                  <span className="muted">
                    {s.category} · {s.suggestedConfidence ?? s.suggestedWeight ?? "—"}
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <section className="panel cara-source-panel worker-cara-focus">
            {!selected ? (
              <div className="empty">Select a source.</div>
            ) : (
              <>
                <div className="mission-meta" style={{ marginBottom: "0.75rem" }}>
                  <ProducerBadge producer={selected.producer} />
                  <StatusChip label={selected.status} />
                  <StatusChip label={selected.category} />
                </div>
                <h3 style={{ marginTop: 0 }}>{selected.name}</h3>
                {selected.url ? <p className="mono">{selected.url}</p> : null}
                <p>{selected.reason || "No reason recorded yet."}</p>
                <p className="muted">
                  Suggested confidence:{" "}
                  {selected.suggestedConfidence ?? selected.suggestedWeight ?? "—"}
                </p>

                {selected.evidence ? (
                  <div className="worker-cara-evidence">
                    <h4 style={{ margin: "0 0 0.35rem" }}>Evidence</h4>
                    <ul className="worker-mention-list">
                      {selected.evidence.domain_age ? (
                        <li>Domain age: {selected.evidence.domain_age}</li>
                      ) : null}
                      {selected.evidence.org_age ? (
                        <li>Org age: {selected.evidence.org_age}</li>
                      ) : null}
                      {selected.evidence.membership_threshold ? (
                        <li>
                          Membership: {selected.evidence.membership_threshold}
                        </li>
                      ) : null}
                      {selected.evidence.real_world_presence ? (
                        <li>
                          Real-world:{" "}
                          {[
                            selected.evidence.real_world_presence.events
                              ? "events"
                              : null,
                            selected.evidence.real_world_presence.news
                              ? "news"
                              : null,
                            selected.evidence.real_world_presence.linkedin
                              ? "linkedin"
                              : null,
                          ]
                            .filter(Boolean)
                            .join(", ") || "none marked"}
                        </li>
                      ) : null}
                      {(selected.evidence.summary_reasons ?? []).map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="hint worker-thin-warning">
                    No structured evidence yet — rate carefully, or add evidence
                    on Sources first.
                  </p>
                )}

                <form
                  className="form-stack"
                  onSubmit={(e: FormEvent) => e.preventDefault()}
                  style={{ marginTop: "1rem" }}
                >
                  <label>
                    Adjusted score
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={humanScore}
                      onChange={(e) => setHumanScore(e.target.value)}
                    />
                  </label>
                  <label>
                    Reason (required for Adjust / Disagree)
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Why does this change trust in the list?"
                    />
                  </label>
                  <div className="row">
                    <button
                      className="btn"
                      type="button"
                      disabled={busy}
                      onClick={() => void submit("agree")}
                    >
                      Agree
                    </button>
                    <button
                      className="btn secondary"
                      type="button"
                      disabled={busy}
                      onClick={() => void submit("adjust")}
                    >
                      Adjust
                    </button>
                    <button
                      className="btn danger"
                      type="button"
                      disabled={busy}
                      onClick={() => void submit("disagree")}
                    >
                      Disagree
                    </button>
                  </div>
                </form>
              </>
            )}
          </section>
        </div>
      )}

      <footer className="worker-step-footer">
        <Link className="btn secondary" to={`/work/${missionId}/sources`}>
          ← Sources
        </Link>
        <Link
          className={`btn ${trustedCount >= TRUSTED_LIST_UNLOCK ? "" : "secondary"}`}
          to={`/work/${missionId}/import`}
        >
          {trustedCount >= TRUSTED_LIST_UNLOCK
            ? "Continue to Import →"
            : `Import (${trustedCount}/${TRUSTED_LIST_UNLOCK}) →`}
        </Link>
      </footer>
    </div>
  );
}
