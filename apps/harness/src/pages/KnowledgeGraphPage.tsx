import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type {
  Company,
  Hypothesis,
  Observation,
  Review,
  Source,
} from "@h3-trust/schema";
import { api } from "../api";
import { listReviews } from "../api-extra";
import { ProducerBadge } from "../components/Badges";

type NodeKind =
  | "mission"
  | "hypothesis"
  | "observation"
  | "source"
  | "company"
  | "review";

interface GraphNode {
  id: string;
  kind: NodeKind;
  label: string;
  detail?: string;
  producer?: string;
}

export function KnowledgeGraphPage() {
  const { missionId = "" } = useParams();
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([
      api.getMission(missionId),
      api.listHypotheses(missionId),
      api.listObservations(missionId),
      api.listSources(missionId),
      api.listCompanies(missionId),
      listReviews(missionId),
    ])
      .then(([mission, hypotheses, observations, sources, companies, reviews]) => {
        const next: GraphNode[] = [
          {
            id: mission.id,
            kind: "mission",
            label: `${mission.location} · ${mission.subsector}`,
            detail: mission.goal,
            producer: mission.producer,
          },
          ...hypotheses.map((h: Hypothesis) => ({
            id: h.id,
            kind: "hypothesis" as const,
            label: h.statement,
            detail: h.status,
            producer: h.producer,
          })),
          ...observations.map((o: Observation) => ({
            id: o.id,
            kind: "observation" as const,
            label: o.statement,
            producer: o.producer,
          })),
          ...sources.map((s: Source) => ({
            id: s.id,
            kind: "source" as const,
            label: s.name,
            detail: `${s.category} · status ${s.status} · suggested ${s.suggestedConfidence ?? "—"}`,
            producer: s.producer,
          })),
          ...companies.map((c: Company) => ({
            id: c.id,
            kind: "company" as const,
            label: c.name,
            detail: `${c.status} · kvk_gate ${c.kvk_gate}`,
            producer: c.producer,
          })),
          ...reviews.map((r: Review) => ({
            id: r.id,
            kind: "review" as const,
            label: `CARA ${r.action} (${r.targetType})`,
            detail: r.reason,
            producer: r.producer,
          })),
        ];
        setNodes(next);
        setSelected(next[0] ?? null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Load failed"));
  }, [missionId]);

  const order: NodeKind[] = [
    "mission",
    "hypothesis",
    "observation",
    "source",
    "company",
    "review",
  ];

  return (
    <div>
      <div className="row" style={{ marginBottom: "1rem" }}>
        <Link className="btn secondary small" to={`/missions/${missionId}`}>
          ← Workspace
        </Link>
      </div>

      <p className="thesis">
        <strong>Knowledge Graph.</strong> Human-readable chain — click any node.
        Not Neo4j. Mission → Hypothesis → Observation → Source → Company → Review.
      </p>

      {error ? <div className="error">{error}</div> : null}

      <div className="workspace-layout">
        <section className="panel">
          {order.map((kind) => {
            const group = nodes.filter((n) => n.kind === kind);
            if (!group.length) return null;
            return (
              <div key={kind} style={{ marginBottom: "1rem" }}>
                <h3 style={{ textTransform: "capitalize", marginBottom: "0.5rem" }}>
                  {kind}
                </h3>
                <div className="list">
                  {group.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      className="item"
                      style={{
                        width: "100%",
                        textAlign: "left",
                        cursor: "pointer",
                        borderColor:
                          selected?.id === n.id ? "var(--teal)" : undefined,
                      }}
                      onClick={() => setSelected(n)}
                    >
                      <h4 style={{ margin: 0 }}>{n.label}</h4>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        <section className="panel">
          <h2>Record</h2>
          {!selected ? (
            <div className="empty">Select a node.</div>
          ) : (
            <>
              <div className="mission-meta" style={{ marginBottom: "0.75rem" }}>
                {selected.producer ? (
                  <ProducerBadge
                    producer={
                      selected.producer as
                        | "Human"
                        | "OmegaClaw"
                        | "ExternalAI"
                        | "ImportedDataset"
                    }
                  />
                ) : null}
              </div>
              <h3 style={{ marginTop: 0 }}>{selected.label}</h3>
              <p className="muted" style={{ textTransform: "capitalize" }}>
                {selected.kind}
              </p>
              {selected.detail ? <p>{selected.detail}</p> : null}
              <p className="mono">{selected.id}</p>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
