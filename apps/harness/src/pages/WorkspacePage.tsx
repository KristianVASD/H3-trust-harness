import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { v4 as uuid } from "uuid";
import {
  SOURCE_CATEGORIES,
  type Company,
  type Hypothesis,
  type HypothesisStatus,
  type JournalEntry,
  type Mission,
  type Observation,
  type Signal,
  type Source,
  type SourceCategory,
  type SourceType,
} from "@h3-trust/schema";
import { api } from "../api";
import { listSignals } from "../api-extra";
import { CompaniesPanel } from "../components/CompaniesPanel";
import { ProducerBadge, StatusChip } from "../components/Badges";

type Tab = "journal" | "observations" | "hypotheses" | "sources" | "companies";

export function WorkspacePage() {
  const { missionId = "" } = useParams();
  const [tab, setTab] = useState<Tab>("journal");
  const [mission, setMission] = useState<Mission | null>(null);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    if (!missionId) return;
    try {
      setError(null);
      const [m, j, o, h, s, c, sig] = await Promise.all([
        api.getMission(missionId),
        api.listJournal(missionId),
        api.listObservations(missionId),
        api.listHypotheses(missionId),
        api.listSources(missionId),
        api.listCompanies(missionId),
        listSignals(missionId),
      ]);
      setMission(m);
      setJournal(j);
      setObservations(o);
      setHypotheses(h);
      setSources(s);
      setCompanies(c);
      setSignals(sig);
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
                "Suitable lists for this region × sector. Weight matters — validate via CARA."}
            </p>

            {tab === "journal" && <JournalList items={journal} />}
            {tab === "observations" && <ObservationList items={observations} />}
            {tab === "hypotheses" && (
              <HypothesisList items={hypotheses} onChanged={reload} />
            )}
            {tab === "sources" && (
              <SourceList items={sources} missionId={missionId} />
            )}
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
                <SourceForm missionId={missionId} onSaved={reload} />
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

function SourceList({
  items,
  missionId,
}: {
  items: Source[];
  missionId: string;
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
          </article>
        );
      })}
    </div>
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
}: {
  missionId: string;
  onSaved: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<SourceType>("registry");
  const [category, setCategory] = useState<SourceCategory>("digital_presence");
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
      url: url || undefined,
      reason: reason || undefined,
      suggestedWeight: Number(weight),
      suggestedConfidence: Number(weight),
      signalIds: [],
      evidenceIds: [],
      status: "draft" as const,
      createdAt: now,
      updatedAt: now,
      v: 1,
    });
    setName("");
    setUrl("");
    setReason("");
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
