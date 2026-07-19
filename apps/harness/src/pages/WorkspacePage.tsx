import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { v4 as uuid } from "uuid";
import {
  DEFAULT_SEARCH_PLAN_VERSION,
  resolveSourceGaps,
  SOURCE_CATEGORIES,
  type Company,
  type Hypothesis,
  type HypothesisStatus,
  type JournalEntry,
  type Mission,
  type Observation,
  type SearchPlan,
  type SearchPlanEntry,
  type Signal,
  type Source,
  type SourceCategory,
  type SourceScope,
  type SourceType,
} from "@h3-trust/schema";
import { api } from "../api";
import { listSignals } from "../api-extra";
import { CompaniesPanel } from "../components/CompaniesPanel";
import { ProducerBadge, StatusChip } from "../components/Badges";

type Tab =
  | "journal"
  | "observations"
  | "hypotheses"
  | "candidates"
  | "sources"
  | "companies";

export function WorkspacePage() {
  const { missionId = "" } = useParams();
  const [tab, setTab] = useState<Tab>("journal");
  const [mission, setMission] = useState<Mission | null>(null);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [catalogue, setCatalogue] = useState<Source[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [searchPlan, setSearchPlan] = useState<SearchPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const candidates = useMemo(
    () => sources.filter((s) => s.status === "candidate"),
    [sources],
  );

  const reload = useCallback(async () => {
    if (!missionId) return;
    try {
      setError(null);
      const [m, j, o, h, s, c, sig, allSrc] = await Promise.all([
        api.getMission(missionId),
        api.listJournal(missionId),
        api.listObservations(missionId),
        api.listHypotheses(missionId),
        api.listSources(missionId),
        api.listCompanies(missionId),
        listSignals(missionId),
        api.listAllSources(),
      ]);
      setMission(m);
      setCatalogue(allSrc);
      setJournal(j);
      setObservations(o);
      setHypotheses(h);
      setSources(s);
      setCompanies(c);
      setSignals(sig);

      const planVersion = m.search_plan_version || DEFAULT_SEARCH_PLAN_VERSION;
      try {
        setSearchPlan(await api.getSearchPlan(planVersion));
      } catch {
        setSearchPlan(await api.getSearchPlan(DEFAULT_SEARCH_PLAN_VERSION));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workspace");
    }
  }, [missionId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function exportBundle() {
    if (!missionId) return;
    setBusy(true);
    try {
      const bundle = await api.exportMission(missionId);
      const blob = new Blob([JSON.stringify(bundle, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `h3-trust-${missionId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setBusy(false);
    }
  }

  if (!mission && !error) {
    return <p className="muted">Loading workspace…</p>;
  }

  return (
    <div>
      <div className="row" style={{ marginBottom: "1rem" }}>
        <Link className="btn secondary small" to="/">
          ← Mission Control
        </Link>
        <Link className="btn secondary small" to={`/missions/${missionId}/cara`}>
          CARA Review
        </Link>
        <Link className="btn secondary small" to={`/missions/${missionId}/signals`}>
          Signals
        </Link>
        <Link className="btn secondary small" to={`/missions/${missionId}/situation`}>
          Situation Room
        </Link>
        <Link className="btn secondary small" to={`/missions/${missionId}/graph`}>
          Knowledge Graph
        </Link>
        <button className="btn secondary small" type="button" onClick={() => void exportBundle()} disabled={busy}>
          Export investigation
        </button>
      </div>

      {error ? <div className="error">{error}</div> : null}

      {mission ? (
        <>
          <header style={{ marginBottom: "1rem" }}>
            <h1
              style={{
                margin: "0 0 0.35rem",
                fontFamily: "var(--font-display)",
                fontSize: "1.8rem",
              }}
            >
              {mission.location} · {mission.subsector}
            </h1>
            <p className="muted" style={{ margin: 0 }}>
              {mission.goal}
            </p>
            <div className="mission-meta" style={{ marginTop: "0.75rem" }}>
              <ProducerBadge producer={mission.producer} />
              <StatusChip label={mission.country} />
              <StatusChip label={mission.sector} />
            </div>
          </header>

          <div className="phase-strip">
            {mission.phases.map((p) => (
              <StatusChip
                key={p.key}
                label={`${p.key} · ${p.status}`}
                tone={p.status === "active" ? "active" : "waiting"}
              />
            ))}
          </div>

          <DiscoveryBriefPanel mission={mission} onSaved={reload} />
        </>
      ) : null}

      <div className="workspace">
        <nav className="side-nav panel">
          <p className="hint" style={{ marginBottom: "0.5rem" }}>
            Fase 0: lists first, then companies
          </p>
          {(
            [
              ["journal", "Journal & tasks"],
              ["observations", "Observations"],
              ["hypotheses", "Hypotheses"],
              ["candidates", "Kandidatenlijst"],
              ["sources", "Sources"],
              ["companies", "Companies"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`nav-link${tab === key ? " active" : ""}`}
              onClick={() => setTab(key)}
            >
              {label}
              <span className="mono" style={{ float: "right", opacity: 0.6 }}>
                {key === "journal"
                  ? journal.length
                  : key === "observations"
                    ? observations.length
                    : key === "hypotheses"
                      ? hypotheses.length
                      : key === "candidates"
                        ? candidates.length
                        : key === "sources"
                          ? sources.length
                          : companies.length}
              </span>
            </button>
          ))}
        </nav>

        {tab === "companies" ? (
          <div className="panel" style={{ gridColumn: "1 / -1" }}>
            <h2>Companies</h2>
            <p className="hint">
              Rank by weighted list coverage (trusted lists × their weights). Website deep-check
              is later — after the portfolio is solid.
            </p>
            <CompaniesPanel
              missionId={missionId}
              companies={companies}
              sources={sources}
              signals={signals}
              onChanged={reload}
            />
          </div>
        ) : tab === "candidates" && mission ? (
          <div className="panel" style={{ gridColumn: "1 / -1" }}>
            <h2>Kandidatenlijst</h2>
            <p className="hint">
              Triage vóór bewijs — voeg toe of verwijder per gat-categorie. Geen score hier.
              Alleen gehouden kandidaten gaan door naar bewijsverzameling en{" "}
              <span style={{ color: "var(--cara)" }}>CARA (bronnen)</span>.
            </p>
            <CandidatesPanel
              mission={mission}
              missionId={missionId}
              sources={sources}
              catalogue={catalogue}
              planEntries={searchPlan?.entries ?? []}
              onChanged={reload}
            />
          </div>
        ) : (
        <div className="workspace-layout">
          <section className="panel">
            <h2>
              {tab === "journal" && "Journal"}
              {tab === "observations" && "Observations"}
              {tab === "hypotheses" && "Hypotheses"}
              {tab === "sources" && "Sources"}
            </h2>
            <p className="hint">
              {tab === "journal" && "Notes and tasks. Producer stamped on every entry."}
              {tab === "observations" && "Facts only — no judgement, no score."}
              {tab === "hypotheses" && "Ideas under test. Rejected ones stay — that is knowledge."}
              {tab === "sources" &&
                "Gehouden bronnen + bewijs. Weight matters — validate via CARA (bronnen)."}
            </p>

            {tab === "journal" && <JournalList items={journal} />}
            {tab === "observations" && <ObservationList items={observations} />}
            {tab === "hypotheses" && (
              <HypothesisList items={hypotheses} onChanged={reload} />
            )}
            {tab === "sources" && mission ? (
              <>
                <CategoryCoveragePanel
                  mission={mission}
                  catalogue={catalogue}
                  planEntries={searchPlan?.entries ?? []}
                  planVersion={
                    mission.search_plan_version || DEFAULT_SEARCH_PLAN_VERSION
                  }
                />
                <SourceList
                  items={sources.filter((s) => s.status !== "candidate")}
                  missionId={missionId}
                  onChanged={reload}
                />
              </>
            ) : null}
          </section>

          <section className="panel">
            <h2>{tab === "sources" ? "Add or link" : "Add"}</h2>
            <p className="hint">Writes as Producer · Human (OmegaClaw later).</p>
            {tab === "journal" && (
              <JournalForm missionId={missionId} onSaved={reload} />
            )}
            {tab === "observations" && (
              <ObservationForm missionId={missionId} onSaved={reload} />
            )}
            {tab === "hypotheses" && (
              <HypothesisForm missionId={missionId} onSaved={reload} />
            )}
            {tab === "sources" && (
              <>
                <p className="hint">
                  Nieuwe voorstellen horen in Kandidatenlijst. Hier link je bestaande
                  CARA-bronnen of voeg je een bron toe die al voorbij triage is.
                </p>
                <SourceForm
                  missionId={missionId}
                  onSaved={reload}
                  defaultStatus="draft"
                />
                <hr style={{ margin: "1.25rem 0", borderColor: "var(--line)" }} />
                <LinkSourceForm missionId={missionId} onSaved={reload} />
              </>
            )}
          </section>
        </div>
        )}
      </div>
    </div>
  );
}

function JournalList({ items }: { items: JournalEntry[] }) {
  if (!items.length) return <div className="empty">No journal entries yet.</div>;
  return (
    <div className="list">
      {items.map((item) => (
        <article key={item.id} className="item">
          <header>
            <h4>
              [{item.kind}] {item.title}
            </h4>
            <ProducerBadge producer={item.producer} />
          </header>
          <p>{item.body}</p>
          {item.kind === "task" ? (
            <p className="muted">{item.done ? "Done" : "Open"}</p>
          ) : null}
        </article>
      ))}
    </div>
  );
}

function ObservationList({ items }: { items: Observation[] }) {
  if (!items.length) return <div className="empty">No observations yet.</div>;
  return (
    <div className="list">
      {items.map((item) => (
        <article key={item.id} className="item">
          <header>
            <h4>{item.statement}</h4>
            <ProducerBadge producer={item.producer} />
          </header>
          {item.evidenceUrls.length ? (
            <p className="mono">{item.evidenceUrls.join(" · ")}</p>
          ) : null}
          {item.tags.length ? (
            <div className="mission-meta">
              {item.tags.map((t) => (
                <StatusChip key={t} label={t} />
              ))}
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}

function HypothesisList({
  items,
  onChanged,
}: {
  items: Hypothesis[];
  onChanged: () => Promise<void>;
}) {
  if (!items.length) return <div className="empty">No hypotheses yet.</div>;

  async function setStatus(item: Hypothesis, status: HypothesisStatus) {
    await api.updateEntity("hypotheses", {
      ...item,
      status,
      updatedAt: new Date().toISOString(),
    });
    await onChanged();
  }

  return (
    <div className="list">
      {items.map((item) => (
        <article key={item.id} className="item">
          <header>
            <h4>{item.statement}</h4>
            <ProducerBadge producer={item.producer} />
          </header>
          {item.rationale ? <p>{item.rationale}</p> : null}
          <div className="mission-meta">
            <StatusChip
              label={item.status}
              tone={item.status === "Validated" ? "active" : "waiting"}
            />
          </div>
          <div className="item-actions">
            {(["Draft", "Testing", "Validated", "Rejected", "Archived"] as const).map(
              (status) => (
                <button
                  key={status}
                  type="button"
                  className="btn secondary small"
                  onClick={() => void setStatus(item, status)}
                  disabled={item.status === status}
                >
                  {status}
                </button>
              ),
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

function DiscoveryBriefPanel({
  mission,
  onSaved,
}: {
  mission: Mission;
  onSaved: () => Promise<void>;
}) {
  const brief = mission.discoveryBrief ?? {
    approach: "",
    candidateListTypes: [] as string[],
    successCriteria: "",
  };
  const [approach, setApproach] = useState(brief.approach);
  const [listTypes, setListTypes] = useState(
    brief.candidateListTypes.join(", "),
  );
  const [successCriteria, setSuccessCriteria] = useState(
    brief.successCriteria,
  );
  const [notes, setNotes] = useState(brief.notes ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const b = mission.discoveryBrief;
    setApproach(b?.approach ?? "");
    setListTypes((b?.candidateListTypes ?? []).join(", "));
    setSuccessCriteria(b?.successCriteria ?? "");
    setNotes(b?.notes ?? "");
  }, [mission]);

  async function save(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const now = new Date().toISOString();
      await api.updateMission({
        ...mission,
        discoveryBrief: {
          approach,
          candidateListTypes: listTypes
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          successCriteria,
          notes: notes || undefined,
          producer: "Human",
          updatedAt: now,
        },
        updatedAt: now,
      });
      await onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="panel" style={{ marginTop: "1rem" }}>
      <h2 style={{ marginTop: 0 }}>Discovery Brief</h2>
      <p className="hint">
        How we attack this region × sector — suitable list types before company deep-check.
      </p>
      <form className="form-stack" onSubmit={(e) => void save(e)}>
        <label>
          Approach
          <textarea
            value={approach}
            onChange={(e) => setApproach(e.target.value)}
            placeholder="e.g. Start with KvK + local association; then sector quality marks…"
            style={{ minHeight: "4rem" }}
          />
        </label>
        <label>
          Candidate list types (comma-separated)
          <input
            value={listTypes}
            onChange={(e) => setListTypes(e.target.value)}
            placeholder="registry, local_business_association, quality_mark"
          />
        </label>
        <label>
          Success criteria
          <input
            value={successCriteria}
            onChange={(e) => setSuccessCriteria(e.target.value)}
            placeholder="≥5 CARA-accepted lists before company deep-check"
          />
        </label>
        <label>
          Notes
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ minHeight: "3rem" }}
          />
        </label>
        <button className="btn secondary small" type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save discovery brief"}
        </button>
      </form>
    </section>
  );
}

function CategoryCoveragePanel({
  mission,
  catalogue,
  planEntries,
  planVersion,
}: {
  mission: Mission;
  catalogue: Source[];
  planEntries: SearchPlanEntry[];
  planVersion: string;
}) {
  const rows = useMemo(
    () =>
      resolveSourceGaps(
        catalogue,
        mission.location,
        mission.sector,
        planEntries,
      ),
    [catalogue, mission.location, mission.sector, planEntries],
  );

  return (
    <div
      style={{
        marginBottom: "1.25rem",
        padding: "0.85rem 1rem",
        borderRadius: 8,
        border: "1px solid var(--coverage-check)",
        background: "var(--coverage-check-soft)",
      }}
    >
      <h3 style={{ margin: "0 0 0.35rem", fontSize: "1rem" }}>
        Dekking per categorie
      </h3>
      <p className="hint" style={{ marginTop: 0 }}>
        Check bekende bronnen — zoekplan{" "}
        <span className="mono">{planVersion}</span>. Alleen accepted/adjusted
        tellen. candidate telt nooit als covered.
      </p>
      {!planEntries.length ? (
        <div className="empty">Geen zoekplan geladen.</div>
      ) : (
        <div className="list" style={{ gap: "0.35rem" }}>
          {rows.map((row) => (
            <div
              key={`${row.layer}:${row.category}`}
              style={{ fontSize: "0.92rem" }}
            >
              <div
                className="row"
                style={{
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  gap: "0.75rem",
                }}
              >
                <span className="mono">
                  {row.layer} · {row.category}
                </span>
                {row.status === "covered" ? (
                  <span>
                    covered · {row.sourceName}{" "}
                    <span className="muted">({row.matchType}-match)</span>
                  </span>
                ) : (
                  <span style={{ color: "var(--coral)" }}>gap</span>
                )}
              </div>
              {row.nuance_rule ? (
                <p className="muted" style={{ margin: "0.15rem 0 0.35rem", fontSize: "0.85rem" }}>
                  {row.nuance_rule}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CandidatesPanel({
  mission,
  missionId,
  sources,
  catalogue,
  planEntries,
  onChanged,
}: {
  mission: Mission;
  missionId: string;
  sources: Source[];
  catalogue: Source[];
  planEntries: SearchPlanEntry[];
  onChanged: () => Promise<void>;
}) {
  const gaps = useMemo(
    () =>
      resolveSourceGaps(
        catalogue,
        mission.location,
        mission.sector,
        planEntries,
      ).filter((r) => r.status === "gap"),
    [catalogue, mission.location, mission.sector, planEntries],
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
    for (const cat of gapCategories) {
      map.set(
        cat,
        sources.filter((s) => s.status === "candidate" && s.category === cat),
      );
    }
    // Candidates whose category is already covered still show under their category
    const orphanCats = new Set(
      sources
        .filter((s) => s.status === "candidate" && !gapCategories.includes(s.category))
        .map((s) => s.category),
    );
    for (const cat of orphanCats) {
      map.set(
        cat,
        sources.filter((s) => s.status === "candidate" && s.category === cat),
      );
    }
    return map;
  }, [sources, gapCategories]);

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState<SourceCategory>("registry");
  const [scope, setScope] = useState<SourceScope>("regional");
  const [region, setRegion] = useState(mission.location);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (gapCategories.length && !gapCategories.includes(category)) {
      setCategory(gapCategories[0] as SourceCategory);
    }
  }, [gapCategories, category]);

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
        notes: [source.notes, "Verwijderd bij kandidatentriage."]
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

  async function addManual(e: FormEvent) {
    e.preventDefault();
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
        reason: "Handmatig toegevoegd op kandidatenlijst.",
        signalIds: [],
        evidenceIds: [],
        status: "candidate" as const,
        createdAt: now,
        updatedAt: now,
        v: 1,
      });
      setName("");
      setUrl("");
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Add failed");
    } finally {
      setBusy(false);
    }
  }

  const categoriesToShow = [...byCategory.keys()];

  return (
    <div>
      {error ? <div className="error">{error}</div> : null}

      {!categoriesToShow.length && !gapCategories.length ? (
        <div className="empty">
          Geen gaten en geen kandidaten — zoekplan is gedekt of leeg.
        </div>
      ) : null}

      <div className="list" style={{ marginBottom: "1.5rem" }}>
        {(categoriesToShow.length ? categoriesToShow : gapCategories).map(
          (cat) => {
            const nuance = planEntries.find((p) => p.category === cat)?.nuance_rule;
            const items = byCategory.get(cat) ?? [];
            const gapLayers = gaps
              .filter((g) => g.category === cat)
              .map((g) => g.layer);
            return (
              <article key={cat} className="item">
                <header>
                  <h4 className="mono">{cat}</h4>
                  <StatusChip
                    label={
                      gapLayers.length
                        ? `gap · ${gapLayers.join(", ")}`
                        : "kandidaten"
                    }
                    tone={gapLayers.length ? "waiting" : "active"}
                  />
                </header>
                {nuance ? <p className="muted">{nuance}</p> : null}
                {!items.length ? (
                  <p className="hint" style={{ marginBottom: 0 }}>
                    Nog geen kandidaten in deze categorie.
                  </p>
                ) : (
                  <div className="list" style={{ marginTop: "0.5rem" }}>
                    {items.map((s) => (
                      <div
                        key={s.id}
                        className="row"
                        style={{
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "0.75rem",
                          flexWrap: "wrap",
                        }}
                      >
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
                          </div>
                        </div>
                        <div className="row" style={{ gap: "0.35rem" }}>
                          <button
                            type="button"
                            className="btn small"
                            disabled={busy}
                            onClick={() => void keep(s)}
                          >
                            Houden
                          </button>
                          <button
                            type="button"
                            className="btn danger small"
                            disabled={busy}
                            onClick={() => void remove(s)}
                          >
                            Verwijderen
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            );
          },
        )}
      </div>

      <section
        style={{
          padding: "0.85rem 1rem",
          borderRadius: 8,
          border: "1px solid var(--line)",
        }}
      >
        <h3 style={{ margin: "0 0 0.35rem", fontSize: "1rem" }}>
          Handmatig toevoegen
        </h3>
        <p className="hint" style={{ marginTop: 0 }}>
          Alleen url + categorie — geen score. Producer · Human.
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
            Naam (optioneel)
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Wordt uit URL afgeleid als leeg"
            />
          </label>
          <label>
            Categorie
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as SourceCategory)}
            >
              {(gapCategories.length
                ? gapCategories
                : SOURCE_CATEGORIES
              ).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
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
          <button className="btn" type="submit" disabled={busy}>
            {busy ? "Bezig…" : "Toevoegen als kandidaat"}
          </button>
        </form>
      </section>
    </div>
  );
}

function SourceList({
  items,
  missionId,
  onChanged,
}: {
  items: Source[];
  missionId: string;
  onChanged: () => Promise<void>;
}) {
  if (!items.length) return <div className="empty">No sources yet.</div>;
  return (
    <div className="list">
      {items.map((item) => {
        const reused = item.first_seen_mission !== missionId;
        return (
          <article key={item.id} className="item">
            <header>
              <h4>
                {item.name}{" "}
                <span className="muted">({item.type})</span>
              </h4>
              <ProducerBadge producer={item.producer} />
            </header>
            {item.reason ? <p>{item.reason}</p> : null}
            <div className="mission-meta">
              <StatusChip label={item.category} tone="active" />
              <StatusChip label={`scope ${item.scope}`} />
              {item.scope !== "national" && item.region ? (
                <StatusChip label={item.region} />
              ) : null}
              <StatusChip label={item.status} tone="waiting" />
              {reused ? (
                <StatusChip label="hergebruikt" tone="active" />
              ) : (
                <StatusChip label="first seen here" />
              )}
              {item.suggestedConfidence != null ? (
                <StatusChip label={`suggested ${item.suggestedConfidence}`} />
              ) : null}
              {item.suggestedWeight != null ? (
                <StatusChip label={`weight ${item.suggestedWeight}`} />
              ) : null}
            </div>
            {item.url ? <p className="mono">{item.url}</p> : null}
            {item.evidence?.summary_reasons?.length ? (
              <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.1rem" }}>
                {item.evidence.summary_reasons.map((r) => (
                  <li key={r} className="muted" style={{ fontSize: "0.9rem" }}>
                    {r}
                  </li>
                ))}
              </ul>
            ) : null}
            {(item.status === "draft" || item.status === "pending_review") && (
              <SourceEvidenceForm source={item} onSaved={onChanged} />
            )}
          </article>
        );
      })}
    </div>
  );
}

function SourceEvidenceForm({
  source,
  onSaved,
}: {
  source: Source;
  onSaved: () => Promise<void>;
}) {
  const ev = source.evidence;
  const [domainAge, setDomainAge] = useState(ev?.domain_age ?? "");
  const [orgAge, setOrgAge] = useState(ev?.org_age ?? "");
  const [hostInfo, setHostInfo] = useState(ev?.host_info ?? "");
  const [threshold, setThreshold] = useState(ev?.membership_threshold ?? "onbekend");
  const [consistent, setConsistent] = useState(ev?.content_consistency?.ok ?? true);
  const [consistentNote, setConsistentNote] = useState(
    ev?.content_consistency?.note ?? "",
  );
  const [reasons, setReasons] = useState(
    (ev?.summary_reasons ?? []).join("\n"),
  );
  const [saving, setSaving] = useState(false);

  async function save(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const now = new Date().toISOString();
      await api.updateEntity("sources", {
        ...source,
        evidence: {
          checked_at: now,
          url: source.url,
          domain_age: domainAge || undefined,
          org_age: orgAge || undefined,
          host_info: hostInfo || undefined,
          membership_threshold: threshold as
            | "laag"
            | "midden"
            | "hoog"
            | "onbekend",
          content_consistency: {
            ok: consistent,
            note: consistentNote || undefined,
          },
          real_world_presence: ev?.real_world_presence,
          summary_reasons: reasons
            .split("\n")
            .map((r) => r.trim())
            .filter(Boolean),
        },
        status:
          source.status === "draft" ? "pending_review" : source.status,
        updatedAt: now,
      });
      await onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      className="form-stack"
      onSubmit={(e) => void save(e)}
      style={{
        marginTop: "0.75rem",
        padding: "0.65rem 0.75rem",
        borderRadius: 6,
        border: "1px dashed var(--line)",
      }}
    >
      <p className="hint" style={{ margin: 0 }}>
        Bewijs invullen → klaar voor CARA (bronnen)
      </p>
      <div className="row" style={{ gap: "0.75rem", flexWrap: "wrap" }}>
        <label style={{ flex: 1, minWidth: "8rem" }}>
          Domain age
          <input value={domainAge} onChange={(e) => setDomainAge(e.target.value)} />
        </label>
        <label style={{ flex: 1, minWidth: "8rem" }}>
          Org age
          <input value={orgAge} onChange={(e) => setOrgAge(e.target.value)} />
        </label>
      </div>
      <label>
        Host info
        <input value={hostInfo} onChange={(e) => setHostInfo(e.target.value)} />
      </label>
      <label>
        Membership threshold
        <select
          value={threshold}
          onChange={(e) => setThreshold(e.target.value as typeof threshold)}
        >
          <option value="laag">laag</option>
          <option value="midden">midden</option>
          <option value="hoog">hoog</option>
          <option value="onbekend">onbekend</option>
        </select>
      </label>
      <label className="row" style={{ gap: "0.5rem", alignItems: "center" }}>
        <input
          type="checkbox"
          checked={consistent}
          onChange={(e) => setConsistent(e.target.checked)}
        />
        Content consistency OK
      </label>
      <label>
        Consistency note
        <input
          value={consistentNote}
          onChange={(e) => setConsistentNote(e.target.value)}
        />
      </label>
      <label>
        Summary reasons (één per regel)
        <textarea
          value={reasons}
          onChange={(e) => setReasons(e.target.value)}
          placeholder={"✓ KVK 14 jaar\n⚠ website pas 6 maanden oud"}
          style={{ minHeight: "3.5rem" }}
        />
      </label>
      <button className="btn secondary small" type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save evidence → pending_review"}
      </button>
    </form>
  );
}

function JournalForm({
  missionId,
  onSaved,
}: {
  missionId: string;
  onSaved: () => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [kind, setKind] = useState<"journal" | "note" | "task">("journal");

  async function submit(e: FormEvent) {
    e.preventDefault();
    const now = new Date().toISOString();
    await api.createInMission(missionId, "journal", {
      id: uuid(),
      missionId,
      producer: "Human" as const,
      kind,
      title,
      body,
      done: kind === "task" ? false : undefined,
      createdAt: now,
      updatedAt: now,
      v: 1,
    });
    setTitle("");
    setBody("");
    await onSaved();
  }

  return (
    <form className="form-stack" onSubmit={submit}>
      <label>
        Kind
        <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
          <option value="journal">Journal</option>
          <option value="note">Note</option>
          <option value="task">Task</option>
        </select>
      </label>
      <label>
        Title
        <input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>
      <label>
        Body
        <textarea value={body} onChange={(e) => setBody(e.target.value)} required />
      </label>
      <button className="btn" type="submit">
        Save entry
      </button>
    </form>
  );
}

function ObservationForm({
  missionId,
  onSaved,
}: {
  missionId: string;
  onSaved: () => Promise<void>;
}) {
  const [statement, setStatement] = useState("");
  const [url, setUrl] = useState("");
  const [tags, setTags] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    const now = new Date().toISOString();
    await api.createInMission(missionId, "observations", {
      id: uuid(),
      missionId,
      producer: "Human" as const,
      statement,
      evidenceUrls: url ? [url] : [],
      evidenceIds: [],
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      createdAt: now,
      updatedAt: now,
      v: 1,
    });
    setStatement("");
    setUrl("");
    setTags("");
    await onSaved();
  }

  return (
    <form className="form-stack" onSubmit={submit}>
      <label>
        Fact (no judgement)
        <textarea
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
          required
        />
      </label>
      <label>
        Evidence URL
        <input value={url} onChange={(e) => setUrl(e.target.value)} />
      </label>
      <label>
        Tags (comma-separated)
        <input value={tags} onChange={(e) => setTags(e.target.value)} />
      </label>
      <button className="btn" type="submit">
        Record observation
      </button>
    </form>
  );
}

function HypothesisForm({
  missionId,
  onSaved,
}: {
  missionId: string;
  onSaved: () => Promise<void>;
}) {
  const [statement, setStatement] = useState("");
  const [rationale, setRationale] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    const now = new Date().toISOString();
    await api.createInMission(missionId, "hypotheses", {
      id: uuid(),
      missionId,
      producer: "Human" as const,
      statement,
      status: "Draft" as const,
      observationIds: [],
      rationale: rationale || undefined,
      createdAt: now,
      updatedAt: now,
      v: 1,
    });
    setStatement("");
    setRationale("");
    await onSaved();
  }

  return (
    <form className="form-stack" onSubmit={submit}>
      <label>
        Hypothesis
        <textarea
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
          required
        />
      </label>
      <label>
        Rationale
        <textarea value={rationale} onChange={(e) => setRationale(e.target.value)} />
      </label>
      <button className="btn" type="submit">
        Add hypothesis
      </button>
    </form>
  );
}

function SourceForm({
  missionId,
  onSaved,
  defaultStatus = "candidate",
}: {
  missionId: string;
  onSaved: () => Promise<void>;
  defaultStatus?: "candidate" | "draft";
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<SourceType>("registry");
  const [category, setCategory] = useState<SourceCategory>("digital_presence");
  const [scope, setScope] = useState<SourceScope>("regional");
  const [region, setRegion] = useState("");
  const [url, setUrl] = useState("");
  const [reason, setReason] = useState("");
  const [weight, setWeight] = useState("70");

  async function submit(e: FormEvent) {
    e.preventDefault();
    const now = new Date().toISOString();
    await api.createInMission(missionId, "sources", {
      id: uuid(),
      producer: "Human" as const,
      first_seen_mission: missionId,
      reused_in_missions: [],
      name,
      type,
      category,
      scope,
      region: scope === "national" ? "" : region.trim(),
      url: url || undefined,
      reason: reason || undefined,
      suggestedWeight: Number(weight),
      suggestedConfidence: Number(weight),
      signalIds: [],
      evidenceIds: [],
      status: defaultStatus,
      createdAt: now,
      updatedAt: now,
      v: 1,
    });
    setName("");
    setUrl("");
    setReason("");
    setRegion("");
    await onSaved();
  }

  return (
    <form className="form-stack" onSubmit={submit}>
      <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem" }}>New source</h3>
      <label>
        Source name
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <label>
        Type
        <select value={type} onChange={(e) => setType(e.target.value as SourceType)}>
          {(
            [
              "registry",
              "association",
              "directory",
              "website",
              "municipality",
              "news",
              "other",
            ] as const
          ).map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      <label>
        Category
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as SourceCategory)}
        >
          {SOURCE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
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
            placeholder="e.g. Haarlemmermeer"
            required
          />
        </label>
      ) : null}
      <label>
        URL
        <input value={url} onChange={(e) => setUrl(e.target.value)} />
      </label>
      <label>
        Why this source
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} />
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
      <p className="hint">
        Status <span className="mono">{defaultStatus}</span>
        {defaultStatus === "draft"
          ? " — bewijs invullen, daarna "
          : " — triage eerst via Kandidatenlijst, daarna "}
        <span style={{ color: "var(--cara)" }}>CARA (bronnen)</span>.
      </p>
      <button className="btn" type="submit">
        Add source
      </button>
    </form>
  );
}

function LinkSourceForm({
  missionId,
  onSaved,
}: {
  missionId: string;
  onSaved: () => Promise<void>;
}) {
  const [q, setQ] = useState("");
  const [candidates, setCandidates] = useState<Source[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const search = useCallback(async () => {
    try {
      setError(null);
      const items = await api.listLinkableSources(missionId, q);
      setCandidates(items);
      if (items.length && !items.some((s) => s.id === selectedId)) {
        setSelectedId(items[0]!.id);
      }
      if (!items.length) setSelectedId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    }
  }, [missionId, q, selectedId]);

  useEffect(() => {
    void search();
  }, [missionId]); // initial load only

  async function link(e: FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    setBusy(true);
    try {
      await api.linkSource(missionId, selectedId);
      setQ("");
      await onSaved();
      await search();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Link failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form-stack" onSubmit={(e) => void link(e)}>
      <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem" }}>
        Link existing source
      </h3>
      <p className="hint">
        Reuse a list from another mission (e.g. KvK, regional association).
      </p>
      <label>
        Search name / category
        <div className="row" style={{ gap: "0.5rem" }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="KvK, association…"
            style={{ flex: 1 }}
          />
          <button
            className="btn secondary small"
            type="button"
            onClick={() => void search()}
          >
            Search
          </button>
        </div>
      </label>
      <label>
        Source from other missions
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          disabled={!candidates.length}
        >
          {!candidates.length ? (
            <option value="">No linkable sources</option>
          ) : (
            candidates.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {s.category} · w{s.suggestedWeight ?? "—"}
              </option>
            ))
          )}
        </select>
      </label>
      {error ? <div className="error">{error}</div> : null}
      <button
        className="btn secondary"
        type="submit"
        disabled={busy || !selectedId}
      >
        {busy ? "Linking…" : "Link to this mission"}
      </button>
    </form>
  );
}
