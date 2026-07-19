import { useMemo, useState, type FormEvent } from "react";
import { v4 as uuid } from "uuid";
import {
  resolveSourceGaps,
  type CategoryCoverage,
  type Mission,
  type SearchPlanEntry,
  type Source,
  type SourceCategory,
  type SourceScope,
} from "@h3-trust/schema";
import { api } from "../../api";
import { ProducerBadge, StatusChip } from "../Badges";

export function GapFillBoard({
  missionId,
  mission,
  sources,
  catalogue,
  planEntries,
  onChanged,
}: {
  missionId: string;
  mission: Mission;
  sources: Source[];
  catalogue: Source[];
  planEntries: SearchPlanEntry[];
  onChanged: () => Promise<void>;
}) {
  const coverage = useMemo(
    () =>
      resolveSourceGaps(
        catalogue,
        mission.location,
        mission.sector,
        planEntries,
      ),
    [catalogue, mission.location, mission.sector, planEntries],
  );

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingFor, setAddingFor] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [weight, setWeight] = useState("70");

  const missionSourcesByCat = useMemo(() => {
    const map = new Map<string, Source[]>();
    for (const s of sources) {
      const list = map.get(s.category) ?? [];
      list.push(s);
      map.set(s.category, list);
    }
    return map;
  }, [sources]);

  async function addCandidate(
    e: FormEvent,
    category: SourceCategory,
    layer: SourceScope,
  ) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const now = new Date().toISOString();
      await api.createInMission(missionId, "sources", {
        id: uuid(),
        producer: "Human" as const,
        first_seen_mission: missionId,
        reused_in_missions: [],
        name: name.trim() || url.trim() || category,
        type: "other" as const,
        category,
        scope: layer,
        region: layer === "national" ? "" : mission.location,
        url: url.trim() || undefined,
        reason: "Added via Data Worker gap fill.",
        suggestedWeight: Number(weight) || 70,
        suggestedConfidence: Number(weight) || 70,
        signalIds: [],
        evidenceIds: [],
        status: "candidate" as const,
        createdAt: now,
        updatedAt: now,
        v: 1,
      });
      setUrl("");
      setName("");
      setAddingFor(null);
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Add failed");
    } finally {
      setBusy(false);
    }
  }

  async function keep(source: Source) {
    setBusy(true);
    setError(null);
    try {
      await api.updateEntity("sources", {
        ...source,
        status: "draft",
        updatedAt: new Date().toISOString(),
      });
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Keep failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove(source: Source) {
    setBusy(true);
    setError(null);
    try {
      await api.updateEntity("sources", {
        ...source,
        status: "rejected",
        notes: [source.notes, "Removed in Data Worker."]
          .filter(Boolean)
          .join(" "),
        updatedAt: new Date().toISOString(),
      });
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Remove failed");
    } finally {
      setBusy(false);
    }
  }

  async function markReady(source: Source) {
    setBusy(true);
    setError(null);
    try {
      await api.updateEntity("sources", {
        ...source,
        status: "pending_review",
        updatedAt: new Date().toISOString(),
      });
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  // Group coverage rows by category for multi-layer display
  const byCategory = useMemo(() => {
    const map = new Map<string, CategoryCoverage[]>();
    for (const row of coverage) {
      const list = map.get(row.category) ?? [];
      list.push(row);
      map.set(row.category, list);
    }
    return map;
  }, [coverage]);

  return (
    <div className="gap-fill-board">
      {error ? <div className="error">{error}</div> : null}

      {!coverage.length ? (
        <div className="empty">No search plan loaded for this mission.</div>
      ) : (
        <div className="list worker-gap-list">
          {[...byCategory.entries()].map(([category, rows]) => {
            const catSources = missionSourcesByCat.get(category) ?? [];
            const candidates = catSources.filter((s) => s.status === "candidate");
            const drafts = catSources.filter(
              (s) => s.status === "draft" || s.status === "pending_review",
            );
            const trusted = catSources.filter(
              (s) => s.status === "accepted" || s.status === "adjusted",
            );
            const anyGap = rows.some((r) => r.status === "gap");
            const primaryLayer = (rows.find((r) => r.status === "gap")?.layer ??
              rows[0]?.layer ??
              "regional") as SourceScope;
            const addKey = category;

            return (
              <article
                key={category}
                className={`item worker-gap-card ${anyGap ? "is-gap" : "is-covered"}`}
              >
                <header>
                  <div>
                    <h3 className="mono" style={{ margin: 0 }}>
                      {category}
                    </h3>
                    <p className="muted" style={{ margin: "0.25rem 0 0" }}>
                      {rows
                        .map((r) =>
                          r.status === "covered"
                            ? `${r.layer}: ✓ ${r.sourceName}`
                            : `${r.layer}: gap`,
                        )
                        .join(" · ")}
                    </p>
                  </div>
                  <StatusChip
                    label={anyGap ? "needs source" : "covered"}
                    tone={anyGap ? "waiting" : "done"}
                  />
                </header>

                {rows[0]?.nuance_rule ? (
                  <p className="hint" style={{ marginTop: "0.5rem" }}>
                    {rows[0].nuance_rule}
                  </p>
                ) : null}

                {trusted.length > 0 ? (
                  <div className="worker-source-stack">
                    {trusted.map((s) => (
                      <div key={s.id} className="worker-source-row trusted">
                        <div>
                          <strong>{s.name}</strong>
                          <span className="muted">
                            {" "}
                            · trusted · score{" "}
                            {s.suggestedConfidence ?? s.suggestedWeight ?? "—"}
                          </span>
                        </div>
                        <StatusChip label={s.status} tone="done" />
                      </div>
                    ))}
                  </div>
                ) : null}

                {drafts.length > 0 ? (
                  <div className="worker-source-stack">
                    {drafts.map((s) => (
                      <div key={s.id} className="worker-source-row draft">
                        <div>
                          <strong>{s.name}</strong>
                          {s.url ? (
                            <p className="mono muted" style={{ margin: "0.1rem 0 0" }}>
                              {s.url}
                            </p>
                          ) : null}
                          <div className="mission-meta" style={{ marginTop: "0.25rem" }}>
                            <ProducerBadge producer={s.producer} />
                            <StatusChip label={s.status} />
                          </div>
                        </div>
                        <div className="row" style={{ gap: "0.35rem" }}>
                          {s.status === "draft" ? (
                            <button
                              type="button"
                              className="btn secondary small"
                              disabled={busy}
                              onClick={() => void markReady(s)}
                            >
                              Ready for CARA
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className="btn danger small"
                            disabled={busy}
                            onClick={() => void remove(s)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {candidates.length > 0 ? (
                  <div className="worker-source-stack">
                    {candidates.map((s) => (
                      <div key={s.id} className="worker-source-row candidate">
                        <div>
                          <strong>{s.name}</strong>
                          {s.url ? (
                            <p className="mono muted" style={{ margin: "0.1rem 0 0" }}>
                              {s.url}
                            </p>
                          ) : null}
                        </div>
                        <div className="row" style={{ gap: "0.35rem" }}>
                          <button
                            type="button"
                            className="btn small triage-keep"
                            disabled={busy}
                            onClick={() => void keep(s)}
                          >
                            Keep → draft
                          </button>
                          <button
                            type="button"
                            className="btn danger small"
                            disabled={busy}
                            onClick={() => void remove(s)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {addingFor === addKey ? (
                  <form
                    className="form-stack worker-add-form"
                    onSubmit={(e) =>
                      void addCandidate(e, category as SourceCategory, primaryLayer)
                    }
                  >
                    <label>
                      URL
                      <input
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://…"
                        required
                        autoFocus
                      />
                    </label>
                    <label>
                      Name (optional)
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Derived from URL if empty"
                      />
                    </label>
                    <label>
                      Suggested weight (0–100)
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                      />
                    </label>
                    <div className="row">
                      <button className="btn triage-keep" type="submit" disabled={busy}>
                        {busy ? "Adding…" : "Add candidate"}
                      </button>
                      <button
                        type="button"
                        className="btn secondary"
                        onClick={() => setAddingFor(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    type="button"
                    className="btn secondary small"
                    style={{ marginTop: "0.75rem" }}
                    onClick={() => {
                      setAddingFor(addKey);
                      setUrl("");
                      setName("");
                    }}
                  >
                    + Add source{anyGap ? " for gap" : " (extra)"}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
