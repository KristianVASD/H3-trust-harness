import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { v4 as uuid } from "uuid";
import type { ConfidenceProposal, Signal, SignalKey, Source } from "@h3-trust/schema";
import { api } from "../api";
import { createEntity, listConfidence, listSignals } from "../api-extra";
import { ProducerBadge, StatusChip } from "../components/Badges";

const SIGNAL_DELTAS: Record<SignalKey, number> = {
  registry: 12,
  longevity: 8,
  association: 10,
  infra: -6,
  locality: 7,
  certification: 9,
  other: 3,
};

export function SignalsPage() {
  const { missionId = "" } = useParams();
  const [sources, setSources] = useState<Source[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [proposals, setProposals] = useState<ConfidenceProposal[]>([]);
  const [sourceId, setSourceId] = useState("");
  const [key, setKey] = useState<SignalKey>("longevity");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const [s, sig, conf] = await Promise.all([
      api.listSources(missionId),
      listSignals(missionId),
      listConfidence(missionId),
    ]);
    setSources(s);
    setSignals(sig);
    setProposals(conf);
    if (!sourceId && s[0]) setSourceId(s[0].id);
  }, [missionId, sourceId]);

  useEffect(() => {
    void reload().catch((err) =>
      setError(err instanceof Error ? err.message : "Load failed"),
    );
  }, [reload]);

  async function addSignal(e: FormEvent) {
    e.preventDefault();
    if (!sourceId) return;
    const now = new Date().toISOString();
    const delta = SIGNAL_DELTAS[key];
    const signal: Signal = {
      id: uuid(),
      missionId,
      producer: "Human",
      key,
      label: `${key} signal`,
      delta,
      note: note || undefined,
      evidenceIds: [],
      observationIds: [],
      sourceId,
      createdAt: now,
      updatedAt: now,
      v: 1,
    };
    await createEntity(missionId, "signals", signal);

    const related = [...signals.filter((s) => s.sourceId === sourceId), signal];
    const base = 50;
    const suggested = Math.max(
      0,
      Math.min(100, base + related.reduce((sum, s) => sum + s.delta, 0)),
    );
    const explanation = [
      `Base 50`,
      ...related.map((s) => `${s.key} ${s.delta >= 0 ? "+" : ""}${s.delta}`),
      `= suggested ${suggested}`,
    ].join(" → ");

    await createEntity(missionId, "confidenceProposals", {
      id: uuid(),
      missionId,
      producer: "Human" as const,
      targetType: "source" as const,
      targetId: sourceId,
      suggested,
      explanation,
      signalIds: related.map((s) => s.id),
      createdAt: now,
      updatedAt: now,
      v: 1,
    });

    const source = sources.find((s) => s.id === sourceId);
    if (source) {
      await api.updateEntity("sources", {
        ...source,
        suggestedConfidence: suggested,
        signalIds: related.map((s) => s.id),
        updatedAt: now,
      });
    }

    setNote("");
    await reload();
  }

  return (
    <div>
      <div className="row" style={{ marginBottom: "1rem" }}>
        <Link className="btn secondary small" to={`/missions/${missionId}`}>
          ← Workspace
        </Link>
      </div>

      <p className="thesis">
        <strong>Signal Engine.</strong> Observation → Evidence → Signal → Suggested
        confidence. Fully explainable. Never a final decision.
      </p>

      {error ? <div className="error">{error}</div> : null}

      <div className="workspace-layout">
        <section className="panel">
          <h2>Add signal</h2>
          <form className="form-stack" onSubmit={addSignal}>
            <label>
              Source
              <select value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
                {sources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Signal key
              <select
                value={key}
                onChange={(e) => setKey(e.target.value as SignalKey)}
              >
                {Object.keys(SIGNAL_DELTAS).map((k) => (
                  <option key={k} value={k}>
                    {k} ({SIGNAL_DELTAS[k as SignalKey] >= 0 ? "+" : ""}
                    {SIGNAL_DELTAS[k as SignalKey]})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Note
              <textarea value={note} onChange={(e) => setNote(e.target.value)} />
            </label>
            <button className="btn" type="submit">
              Record signal + recompute suggestion
            </button>
          </form>
        </section>

        <section className="panel">
          <h2>Explainability</h2>
          <div className="list">
            {proposals.map((p) => (
              <article key={p.id} className="item">
                <header>
                  <h4>Suggested {p.suggested}</h4>
                  <ProducerBadge producer={p.producer} />
                </header>
                <p className="mono">{p.explanation}</p>
              </article>
            ))}
            {!proposals.length ? (
              <div className="empty">No confidence proposals yet.</div>
            ) : null}
          </div>

          <h3>Signals</h3>
          <div className="list">
            {signals.map((s) => (
              <article key={s.id} className="item">
                <header>
                  <h4>
                    {s.key}{" "}
                    <StatusChip
                      label={`${s.delta >= 0 ? "+" : ""}${s.delta}`}
                      tone="active"
                    />
                  </h4>
                  <ProducerBadge producer={s.producer} />
                </header>
                {s.note ? <p>{s.note}</p> : null}
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
