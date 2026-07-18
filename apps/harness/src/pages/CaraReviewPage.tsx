import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { v4 as uuid } from "uuid";
import type { Company, Review, Source } from "@h3-trust/schema";
import { api } from "../api";
import { createEntity, listReviews, updateEntity } from "../api-extra";
import { ProducerBadge, StatusChip } from "../components/Badges";

type CaraTarget = "source" | "company";

function suggestedForCompany(company: Company, sources: Source[]): number {
  const linked = sources.filter((s) => company.source_ids.includes(s.id));
  const scores = linked
    .map((s) => s.suggestedConfidence ?? s.suggestedWeight)
    .filter((n): n is number => typeof n === "number");
  if (!scores.length) return 50;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

/**
 * CARA Review — human alignment only.
 * Agree = one click. Adjust/Disagree require reason.
 * Supports Sources and Companies (operational status unchanged for companies).
 */
export function CaraReviewPage() {
  const { missionId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const initialTarget =
    searchParams.get("target") === "company" ? "company" : "source";
  const initialId = searchParams.get("id");

  const [mode, setMode] = useState<CaraTarget>(initialTarget);
  const [sources, setSources] = useState<Source[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(initialId);
  const [humanScore, setHumanScore] = useState("70");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const [s, c, r] = await Promise.all([
      api.listSources(missionId),
      api.listCompanies(missionId),
      listReviews(missionId),
    ]);
    setSources(s);
    setCompanies(c);
    setReviews(r);
  }, [missionId]);

  useEffect(() => {
    void reload().catch((err) =>
      setError(err instanceof Error ? err.message : "Load failed"),
    );
  }, [reload]);

  useEffect(() => {
    if (mode === "source") {
      setSelectedId((prev) => {
        if (prev && sources.some((s) => s.id === prev)) return prev;
        return sources[0]?.id ?? null;
      });
      return;
    }
    setSelectedId((prev) => {
      const pool = companies.filter(
        (c) => c.status === "candidate" || c.status === "target",
      );
      if (prev && pool.some((c) => c.id === prev)) return prev;
      return pool[0]?.id ?? companies[0]?.id ?? null;
    });
  }, [mode, sources, companies]);

  useEffect(() => {
    if (mode === "source") {
      const src = sources.find((s) => s.id === selectedId);
      if (src) {
        setHumanScore(
          String(src.suggestedConfidence ?? src.suggestedWeight ?? 70),
        );
      }
      return;
    }
    const co = companies.find((c) => c.id === selectedId);
    if (co) setHumanScore(String(suggestedForCompany(co, sources)));
  }, [mode, selectedId, sources, companies]);

  const sourceQueue = useMemo(
    () =>
      sources.filter((s) => s.status === "draft" || s.status === "pending_review"),
    [sources],
  );

  const companyQueue = useMemo(
    () =>
      companies.filter(
        (c) => c.status === "candidate" || c.status === "target",
      ),
    [companies],
  );

  const selectedSource =
    mode === "source" ? sources.find((s) => s.id === selectedId) ?? null : null;
  const selectedCompany =
    mode === "company"
      ? companies.find((c) => c.id === selectedId) ?? null
      : null;

  async function submitSourceReview(action: "agree" | "disagree" | "adjust") {
    if (!selectedSource) return;
    if ((action === "adjust" || action === "disagree") && reason.trim().length < 8) {
      setError("Adjust / Disagree requires a reason (min 8 characters).");
      return;
    }

    setError(null);
    setMessage(null);
    const now = new Date().toISOString();
    const original =
      selectedSource.suggestedConfidence ??
      selectedSource.suggestedWeight ??
      undefined;
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
      targetId: selectedSource.id,
      action,
      originalScore: original,
      humanScore: score,
      reason: reason.trim() || undefined,
      valueTags: [],
      observationIds: [],
      hypothesisIds: [],
      evidenceIds: selectedSource.evidenceIds,
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
      ...selectedSource,
      status,
      suggestedConfidence: score,
      updatedAt: now,
    });

    if (action !== "agree") {
      await createEntity(missionId, "findings", {
        id: uuid(),
        missionId,
        producer: "Human" as const,
        summary:
          action === "adjust"
            ? `Adjusted source "${selectedSource.name}" from ${original ?? "?"} to ${score}: ${reason}`
            : `Rejected source "${selectedSource.name}": ${reason}`,
        status: action === "adjust" ? "Validated" : "Rejected",
        confidence: score,
        reviewIds: [review.id],
        observationIds: [],
        hypothesisIds: [],
        evidenceIds: selectedSource.evidenceIds,
        sourceIds: [selectedSource.id],
        companyIds: [],
        createdAt: now,
        updatedAt: now,
        v: 1,
      });
    }

    setReason("");
    setMessage(`CARA ${action} recorded for source ${selectedSource.name}.`);
    await reload();
  }

  async function submitCompanyReview(action: "agree" | "disagree" | "adjust") {
    if (!selectedCompany) return;
    if ((action === "adjust" || action === "disagree") && reason.trim().length < 8) {
      setError("Adjust / Disagree requires a reason (min 8 characters).");
      return;
    }

    setError(null);
    setMessage(null);
    const now = new Date().toISOString();
    const original = suggestedForCompany(selectedCompany, sources);
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
      targetType: "company",
      targetId: selectedCompany.id,
      action,
      originalScore: original,
      humanScore: score,
      reason: reason.trim() || undefined,
      valueTags: [],
      observationIds: [],
      hypothesisIds: [],
      evidenceIds: [],
      version: 1,
      createdAt: now,
      updatedAt: now,
      v: 1,
    };

    await createEntity(missionId, "reviews", review);

    await createEntity(missionId, "findings", {
      id: uuid(),
      missionId,
      producer: "Human" as const,
      summary:
        action === "agree"
          ? `Agreed company "${selectedCompany.name}" at suggested ${score}`
          : action === "adjust"
            ? `Adjusted company "${selectedCompany.name}" from ${original} to ${score}: ${reason}`
            : `Disagreed company "${selectedCompany.name}": ${reason}`,
      status:
        action === "disagree"
          ? "Rejected"
          : action === "adjust"
            ? "Validated"
            : "Validated",
      confidence: score,
      reviewIds: [review.id],
      observationIds: [],
      hypothesisIds: [],
      evidenceIds: [],
      sourceIds: selectedCompany.source_ids,
      companyIds: [selectedCompany.id],
      createdAt: now,
      updatedAt: now,
      v: 1,
    });

    // Do not change candidate|target|staged or kvk_gate
    setReason("");
    setMessage(
      `CARA ${action} recorded for company ${selectedCompany.name} (status ${selectedCompany.status} unchanged).`,
    );
    await reload();
  }

  const priorReviews = reviews.filter(
    (r) =>
      r.targetId === selectedId &&
      r.targetType === (mode === "source" ? "source" : "company"),
  );

  return (
    <div>
      <div className="row" style={{ marginBottom: "1rem" }}>
        <Link className="btn secondary small" to={`/missions/${missionId}`}>
          ← Workspace
        </Link>
        <Link className="btn secondary small" to={`/missions/${missionId}/situation`}>
          Situation Room
        </Link>
      </div>

      <p className="thesis">
        <strong>CARA Review.</strong> Suggested confidence is not a decision.
        Only a human can agree, adjust, or reject — with versioned reasoning.
        Company reviews do not change kvk_gate or candidate/target/staged.
      </p>

      <div className="row" style={{ marginBottom: "1rem" }}>
        <button
          type="button"
          className="btn secondary small"
          style={
            mode === "source"
              ? { borderColor: "var(--teal)", fontWeight: 700 }
              : undefined
          }
          onClick={() => setMode("source")}
        >
          Sources ({sourceQueue.length} in queue)
        </button>
        <button
          type="button"
          className="btn secondary small"
          style={
            mode === "company"
              ? { borderColor: "var(--teal)", fontWeight: 700 }
              : undefined
          }
          onClick={() => setMode("company")}
        >
          Companies ({companyQueue.length})
        </button>
      </div>

      {error ? <div className="error">{error}</div> : null}
      {message ? (
        <div className="thesis" style={{ borderColor: "var(--teal)" }}>
          {message}
        </div>
      ) : null}

      <div className="workspace-layout">
        <section className="panel">
          <h2>
            {mode === "source"
              ? `Review queue (${sourceQueue.length})`
              : `Companies (${companyQueue.length})`}
          </h2>
          <p className="hint">Non-blocking — investigation continues in Workspace.</p>
          <div className="list">
            {mode === "source"
              ? sources.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="item"
                    style={{
                      textAlign: "left",
                      cursor: "pointer",
                      width: "100%",
                      borderColor: selectedId === s.id ? "var(--teal)" : undefined,
                    }}
                    onClick={() => {
                      setSelectedId(s.id);
                      setHumanScore(
                        String(s.suggestedConfidence ?? s.suggestedWeight ?? 70),
                      );
                    }}
                  >
                    <header>
                      <h4>{s.name}</h4>
                      <StatusChip label={s.status} />
                    </header>
                    <p className="muted">
                      {s.category} · suggested{" "}
                      {s.suggestedConfidence ?? s.suggestedWeight ?? "—"}
                    </p>
                  </button>
                ))
              : companies.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="item"
                    style={{
                      textAlign: "left",
                      cursor: "pointer",
                      width: "100%",
                      borderColor: selectedId === c.id ? "var(--teal)" : undefined,
                    }}
                    onClick={() => {
                      setSelectedId(c.id);
                      setHumanScore(String(suggestedForCompany(c, sources)));
                    }}
                  >
                    <header>
                      <h4>{c.name}</h4>
                      <StatusChip label={c.status} />
                    </header>
                    <p className="muted">
                      kvk_gate {c.kvk_gate} · suggested{" "}
                      {suggestedForCompany(c, sources)}
                    </p>
                  </button>
                ))}
            {mode === "source" && !sources.length ? (
              <div className="empty">No sources to review.</div>
            ) : null}
            {mode === "company" && !companies.length ? (
              <div className="empty">No companies yet.</div>
            ) : null}
          </div>
        </section>

        <section className="panel">
          <h2>Human judgement</h2>
          {mode === "source" && !selectedSource ? (
            <div className="empty">Select a source.</div>
          ) : null}
          {mode === "company" && !selectedCompany ? (
            <div className="empty">Select a company.</div>
          ) : null}

          {mode === "source" && selectedSource ? (
            <JudgementForm
              title={selectedSource.name}
              producer={selectedSource.producer}
              meta={`${selectedSource.category} · ${selectedSource.type}`}
              body={selectedSource.reason || "No reason recorded yet."}
              url={selectedSource.url}
              suggested={
                selectedSource.suggestedConfidence ??
                selectedSource.suggestedWeight ??
                "—"
              }
              humanScore={humanScore}
              setHumanScore={setHumanScore}
              reason={reason}
              setReason={setReason}
              onAgree={() => void submitSourceReview("agree")}
              onAdjust={() => void submitSourceReview("adjust")}
              onDisagree={() => void submitSourceReview("disagree")}
              prior={priorReviews}
            />
          ) : null}

          {mode === "company" && selectedCompany ? (
            <JudgementForm
              title={selectedCompany.name}
              producer={selectedCompany.producer}
              meta={`status ${selectedCompany.status} · kvk_gate ${selectedCompany.kvk_gate}`}
              body={
                selectedCompany.list_membership.length
                  ? `Lists: ${selectedCompany.list_membership.join(", ")}`
                  : "No list membership."
              }
              url={undefined}
              suggested={suggestedForCompany(selectedCompany, sources)}
              humanScore={humanScore}
              setHumanScore={setHumanScore}
              reason={reason}
              setReason={setReason}
              onAgree={() => void submitCompanyReview("agree")}
              onAdjust={() => void submitCompanyReview("adjust")}
              onDisagree={() => void submitCompanyReview("disagree")}
              prior={priorReviews}
            />
          ) : null}
        </section>
      </div>
    </div>
  );
}

function JudgementForm({
  title,
  producer,
  meta,
  body,
  url,
  suggested,
  humanScore,
  setHumanScore,
  reason,
  setReason,
  onAgree,
  onAdjust,
  onDisagree,
  prior,
}: {
  title: string;
  producer: "Human" | "OmegaClaw" | "ExternalAI" | "ImportedDataset";
  meta: string;
  body: string;
  url?: string;
  suggested: string | number;
  humanScore: string;
  setHumanScore: (v: string) => void;
  reason: string;
  setReason: (v: string) => void;
  onAgree: () => void;
  onAdjust: () => void;
  onDisagree: () => void;
  prior: Review[];
}) {
  return (
    <>
      <div className="mission-meta" style={{ marginBottom: "0.75rem" }}>
        <ProducerBadge producer={producer} />
        <StatusChip label={meta} />
      </div>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <p>{body}</p>
      {url ? <p className="mono">{url}</p> : null}
      <p className="muted">Suggested confidence: {suggested}</p>

      <form
        className="form-stack"
        onSubmit={(e: FormEvent) => e.preventDefault()}
        style={{ marginTop: "1rem" }}
      >
        <label>
          Adjusted score (for Adjust)
          <input
            type="number"
            min={0}
            max={100}
            value={humanScore}
            onChange={(e) => setHumanScore(e.target.value)}
          />
        </label>
        <label>
          Reasoning (required for Adjust / Disagree)
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why does this change human trust judgement?"
          />
        </label>
        <div className="row">
          <button className="btn" type="button" onClick={onAgree}>
            Agree
          </button>
          <button className="btn secondary" type="button" onClick={onAdjust}>
            Adjust
          </button>
          <button className="btn danger" type="button" onClick={onDisagree}>
            Disagree
          </button>
        </div>
      </form>

      <h3 style={{ marginTop: "1.5rem" }}>Prior reviews</h3>
      <div className="list">
        {prior.map((r) => (
          <article key={r.id} className="item">
            <header>
              <h4>
                {r.action} → {r.humanScore ?? "—"}
              </h4>
              <ProducerBadge producer={r.producer} />
            </header>
            {r.reason ? <p>{r.reason}</p> : null}
            <p className="mono muted">v{r.version}</p>
          </article>
        ))}
        {!prior.length ? <div className="empty">No prior reviews.</div> : null}
      </div>
    </>
  );
}
