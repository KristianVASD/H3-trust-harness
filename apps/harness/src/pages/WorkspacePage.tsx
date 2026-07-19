import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import { v4 as uuid } from "uuid";
import {
  DEFAULT_SEARCH_PLAN_VERSION,
  resolveSourceGaps,
  type Hypothesis,
  type HypothesisStatus,
  type JournalEntry,
  type Mission,
  type Observation,
  type SearchPlanEntry,
  type Source,
} from "@h3-trust/schema";
import { api } from "../api";
import type { MissionData } from "../hooks/useMissionData";
import { CompaniesPanel } from "../components/CompaniesPanel";
import { ProducerBadge, StatusChip } from "../components/Badges";

type Tab = "journal" | "observations" | "hypotheses" | "sources" | "companies";

export function WorkspacePage() {
  const { missionId = "" } = useParams();
  const data = useOutletContext<MissionData>();
  const {
    mission,
    journal,
    observations,
    hypotheses,
    sources,
    catalogue,
    companies,
    signals,
    searchPlan,
    reload,
  } = data;

  const [tab, setTab] = useState<Tab>("journal");
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const keptSources = useMemo(
    () => sources.filter((s) => s.status !== "candidate"),
    [sources],
  );

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
      setLocalError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setBusy(false);
    }
  }

  if (!mission) {
    return <p className="muted">Loading workspace…</p>;
  }

  return (
    <div>
      <div className="row" style={{ marginBottom: "1rem" }}>
        <div className="mission-meta">
          <ProducerBadge producer={mission.producer} />
          <StatusChip label={mission.country} />
          <StatusChip label={mission.sector} />
        </div>
        <button
          className="btn secondary small"
          type="button"
          onClick={() => void exportBundle()}
          disabled={busy}
        >
          Export investigation
        </button>
      </div>

      {localError ? <div className="error">{localError}</div> : null}

      <DiscoveryBriefPanel mission={mission} onSaved={reload} />

      <div className="workspace" style={{ marginTop: "1rem" }}>
        <nav className="side-nav panel">
          <p className="hint" style={{ marginBottom: "0.5rem" }}>
            Phase 0: lists first, then companies. Triage is on{" "}
            <Link to={`/missions/${missionId}/triage`}>☰ Triage</Link>.
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
                        ? keptSources.length
                        : companies.length}
              </span>
            </button>
          ))}
        </nav>

        {tab === "companies" ? (
          <div className="panel" style={{ gridColumn: "1 / -1" }}>
            <h2>Companies</h2>
            <p className="hint">
              Rank by weighted list coverage (trusted lists × their weights). Website
              deep-check is later — after the portfolio is solid.
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
                {tab === "journal" &&
                  "Notes and tasks. Producer stamped on every entry."}
                {tab === "observations" && "Facts only — no judgement, no score."}
                {tab === "hypotheses" &&
                  "Ideas under test. Rejected ones stay — that is knowledge."}
                {tab === "sources" &&
                  "Kept sources + evidence. New candidates via ☰ Triage. Weight matters — validate via ◉ CARA (sources)."}
              </p>

              {tab === "journal" && <JournalList items={journal} />}
              {tab === "observations" && <ObservationList items={observations} />}
              {tab === "hypotheses" && (
                <HypothesisList items={hypotheses} onChanged={reload} />
              )}
              {tab === "sources" ? (
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
                    items={keptSources}
                    missionId={missionId}
                    onChanged={reload}
                  />
                </>
              ) : null}
            </section>

            <section className="panel">
              <h2>{tab === "sources" ? "Link existing" : "Add"}</h2>
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
                    New sources only via{" "}
                    <Link to={`/missions/${missionId}/triage`}>☰ Triage</Link>. Here
                    you link existing CARA sources from other missions.
                  </p>
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
        Coverage by category
      </h3>
      <p className="hint" style={{ marginTop: 0 }}>
        Check known sources — search plan{" "}
        <span className="mono">{planVersion}</span>. Only accepted/adjusted
        count. candidate never counts as covered.
      </p>
      {!planEntries.length ? (
        <div className="empty">No search plan loaded.</div>
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
                <StatusChip label="reused" tone="active" />
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
  const [threshold, setThreshold] = useState(ev?.membership_threshold ?? "unknown");
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
            | "low"
            | "medium"
            | "high"
            | "unknown",
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
        Fill evidence → ready for CARA (sources)
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
          <option value="low">low</option>
          <option value="medium">medium</option>
          <option value="high">high</option>
          <option value="unknown">unknown</option>
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
        Summary reasons (one per line)
        <textarea
          value={reasons}
          onChange={(e) => setReasons(e.target.value)}
          placeholder={"✓ KvK 14 years\n⚠ website only 6 months old"}
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
