import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { v4 as uuid } from "uuid";
import {
  resolveSourceGaps,
  SOURCE_CATEGORIES,
  type SearchPlanEntry,
  type Source,
  type SourceCategory,
  type SourceScope,
} from "@h3-trust/schema";
import { api } from "../api";
import type { MissionData } from "../hooks/useMissionData";
import { ProducerBadge, StatusChip } from "../components/Badges";

/**
 * Candidate-list triage — checkpoint ①.
 * Keep → draft, or remove → rejected. No score, no evidence, no CARA here.
 */
export function CandidateTriagePage() {
  const { missionId = "" } = useParams();
  const data = useOutletContext<MissionData>();
  const { mission, sources, catalogue, searchPlan, reload } = data;

  const planEntries: SearchPlanEntry[] = searchPlan?.entries ?? [];
  const planVersion = searchPlan?.version ?? "—";

  const gaps = useMemo(
    () =>
      resolveSourceGaps(
        catalogue,
        mission?.location ?? "",
        mission?.sector ?? "",
        planEntries,
      ).filter((r) => r.status === "gap"),
    [catalogue, mission, planEntries],
  );

  const gapCategories = useMemo(() => {
    const seen = new Set<string>();
    const cats: string[] = [];
    for (const g of gaps) {
      if (!seen.has(g.category)) {
        seen.add(g.category);
        cats.push(g.category);
      }
    }
    return cats;
  }, [gaps]);

  const byCategory = useMemo(() => {
    const map = new Map<string, Source[]>();
    const allCats = new Set([
      ...gapCategories,
      ...sources.filter((s) => s.status === "candidate").map((s) => s.category),
    ]);
    for (const cat of allCats) {
      map.set(
        cat,
        sources.filter((s) => s.status === "candidate" && s.category === cat),
      );
    }
    return map;
  }, [sources, gapCategories]);

  const coverage = useMemo(
    () =>
      resolveSourceGaps(
        catalogue,
        mission?.location ?? "",
        mission?.sector ?? "",
        planEntries,
      ),
    [catalogue, mission, planEntries],
  );

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState<SourceCategory>(
    (gapCategories[0] as SourceCategory) ?? "registry",
  );
  const [scope, setScope] = useState<SourceScope>("regional");
  const [region, setRegion] = useState(mission?.location ?? "");

  useEffect(() => {
    if (gapCategories.length && !gapCategories.includes(category)) {
      setCategory(gapCategories[0] as SourceCategory);
    }
  }, [gapCategories, category]);

  useEffect(() => {
    if (mission?.location) setRegion(mission.location);
  }, [mission?.location]);

  async function keep(source: Source) {
    setBusy(true);
    setError(null);
    try {
      await api.updateEntity("sources", {
        ...source,
        status: "draft",
        updatedAt: new Date().toISOString(),
      });
      await reload();
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
        notes: [source.notes, "Removed during candidate triage."]
          .filter(Boolean)
          .join(" "),
        updatedAt: new Date().toISOString(),
      });
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Remove failed");
    } finally {
      setBusy(false);
    }
  }

  async function addManual(e: FormEvent) {
    e.preventDefault();
    if (!missionId) return;
    setBusy(true);
    setError(null);
    try {
      const now = new Date().toISOString();
      const entry = planEntries.find((p) => p.category === category);
      await api.createInMission(missionId, "sources", {
        id: uuid(),
        producer: "Human" as const,
        first_seen_mission: missionId,
        reused_in_missions: [],
        name: name.trim() || url.trim() || category,
        type: "other" as const,
        category,
        scope: entry?.layer ?? scope,
        region: (entry?.layer ?? scope) === "national" ? "" : region.trim(),
        url: url.trim() || undefined,
        reason: "Added manually on the candidate list.",
        signalIds: [],
        evidenceIds: [],
        status: "candidate" as const,
        createdAt: now,
        updatedAt: now,
        v: 1,
      });
      setName("");
      setUrl("");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Add failed");
    } finally {
      setBusy(false);
    }
  }

  const categoriesToShow = [...byCategory.keys()];
  const totalCandidates = sources.filter((s) => s.status === "candidate").length;

  return (
    <div className="triage-page">
      <div className="triage-header">
        <h2>
          <span className="triage-icon">☰</span> Candidate list triage
        </h2>
        <p className="hint">
          Checkpoint ① — triage before evidence. Keep or remove per category.{" "}
          <strong>No score here.</strong> Only kept candidates (→ draft) move on to
          evidence collection and CARA (sources).
        </p>
        <p className="hint">
          Search plan <span className="mono">{planVersion}</span> ·{" "}
          {gaps.length} of {coverage.length} categories still lack a CARA source ·{" "}
          {totalCandidates} candidates waiting
        </p>
      </div>

      {error ? <div className="error">{error}</div> : null}

      <details className="triage-coverage" open={gaps.length > 0}>
        <summary>
          Coverage by category ({gaps.length} gaps / {coverage.length} total)
        </summary>
        <div className="list" style={{ gap: "0.25rem", marginTop: "0.5rem" }}>
          {coverage.map((row) => (
            <div
              key={`${row.layer}:${row.category}`}
              className="row"
              style={{ justifyContent: "space-between", fontSize: "0.9rem" }}
            >
              <span className="mono">
                {row.layer} · {row.category}
              </span>
              {row.status === "covered" ? (
                <span style={{ color: "var(--teal)" }}>
                  ✓ {row.sourceName} ({row.matchType})
                </span>
              ) : (
                <span style={{ color: "var(--triage)" }}>gap — candidate needed</span>
              )}
            </div>
          ))}
        </div>
      </details>

      {!categoriesToShow.length ? (
        <div className="empty">
          No candidates. Add manually, or link a source from another mission via
          Workspace → Sources.
        </div>
      ) : (
        <div className="list triage-categories">
          {categoriesToShow.map((cat) => {
            const items = byCategory.get(cat) ?? [];
            const nuance = planEntries.find((p) => p.category === cat)?.nuance_rule;
            const isGap = gapCategories.includes(cat);

            return (
              <article
                key={cat}
                className={`item triage-category ${isGap ? "is-gap" : ""}`}
              >
                <header>
                  <h4 className="mono">{cat}</h4>
                  <StatusChip
                    label={isGap ? "gap — source needed" : `${items.length} candidates`}
                    tone={isGap ? "waiting" : "active"}
                  />
                </header>
                {nuance ? <p className="muted">{nuance}</p> : null}

                {!items.length ? (
                  <p className="hint" style={{ marginBottom: 0 }}>
                    No candidates in this category yet.
                  </p>
                ) : (
                  <div className="list" style={{ marginTop: "0.5rem" }}>
                    {items.map((s) => (
                      <div key={s.id} className="row triage-item">
                        <div>
                          <strong>{s.name}</strong>
                          {s.url ? (
                            <p className="mono muted" style={{ margin: "0.15rem 0 0" }}>
                              {s.url}
                            </p>
                          ) : null}
                          <div className="mission-meta" style={{ marginTop: "0.25rem" }}>
                            <ProducerBadge producer={s.producer} />
                            <StatusChip label={s.scope} />
                            {s.region ? <StatusChip label={s.region} /> : null}
                          </div>
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
                )}
              </article>
            );
          })}
        </div>
      )}

      <section className="panel triage-add">
        <h3 style={{ margin: "0 0 0.35rem", fontSize: "1rem" }}>
          Add candidate manually
        </h3>
        <p className="hint" style={{ marginTop: 0 }}>
          URL + category only — no score, no evidence. Producer · Human. Status
          becomes <span className="mono">candidate</span> (triage next).
        </p>
        <form className="form-stack" onSubmit={(e) => void addManual(e)}>
          <label>
            URL
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              required
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
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as SourceCategory)}
            >
              {(gapCategories.length ? gapCategories : SOURCE_CATEGORIES).map(
                (c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ),
              )}
            </select>
          </label>
          <label>
            Scope
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as SourceScope)}
            >
              <option value="national">national</option>
              <option value="regional">regional</option>
              <option value="local">local</option>
            </select>
          </label>
          {scope !== "national" ? (
            <label>
              Region
              <input
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                required
              />
            </label>
          ) : null}
          <button className="btn triage-keep" type="submit" disabled={busy}>
            {busy ? "Working…" : "Add as candidate"}
          </button>
        </form>
      </section>
    </div>
  );
}
