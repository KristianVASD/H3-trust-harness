import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { v4 as uuid } from "uuid";
import {
  computeListCoverage,
  type Company,
  type Mission,
  type Review,
  type ServiceContext,
} from "@h3-trust/schema";
import { api } from "../api";
import { listReviews } from "../api-extra";
import { countTrustedLists } from "../lib/worker";
import { CompanyProfileTags } from "../components/CompanyProfileTags";
import { StatusChip } from "../components/Badges";
import "./Search.css";

/* ── Query parser — geen NLP, gewoon keyword-match ── */

interface ParsedQuery {
  sector?: string;
  location?: string;
  context?: string;
}

const SECTOR_ALIASES: Record<string, string[]> = {
  painter: ["schilder", "painter", "painters", "schilderwerk", "schilders"],
  plumber: ["loodgieter", "plumber", "plumbers", "loodgieters"],
  electrician: ["elektricien", "electrician", "elektriciens", "elektra"],
  roofing: ["dakdekker", "roofer", "roofing", "dakdekkers"],
  carpentry: ["timmerman", "carpenter", "timmerwerk"],
  drainage: ["riool", "drainage", "riolering", "ontstopping"],
};

const CONTEXT_ALIASES: Record<string, string> = {
  particulier: "private",
  private: "private",
  vve: "hoa",
  hoa: "hoa",
  gemeente: "municipal",
  municipal: "municipal",
  commercieel: "commercial",
  commercial: "commercial",
  industrieel: "industrial",
  industrial: "industrial",
};

function parseQuery(raw: string, missions: Mission[]): ParsedQuery {
  const lower = raw.toLowerCase();

  let location: string | undefined;
  for (const m of missions) {
    if (lower.includes(m.location.toLowerCase())) {
      location = m.location;
      break;
    }
  }

  let sector: string | undefined;
  for (const [key, aliases] of Object.entries(SECTOR_ALIASES)) {
    if (aliases.some((a) => lower.includes(a))) {
      sector = key;
      break;
    }
  }
  if (!sector) {
    for (const m of missions) {
      if (lower.includes(m.subsector.toLowerCase())) {
        sector = m.subsector;
        break;
      }
    }
  }

  let context: string | undefined;
  for (const [alias, value] of Object.entries(CONTEXT_ALIASES)) {
    if (lower.includes(alias)) {
      context = value;
      break;
    }
  }

  return { sector, location, context };
}

function missionMatchesSector(m: Mission, sector: string): boolean {
  const needle = sector.toLowerCase();
  const hay = `${m.subsector} ${m.sector}`.toLowerCase();
  if (hay.includes(needle)) return true;
  const aliases = SECTOR_ALIASES[needle];
  if (aliases?.some((a) => hay.includes(a))) return true;
  for (const [key, list] of Object.entries(SECTOR_ALIASES)) {
    if (list.some((a) => a === needle || needle.includes(a)) && hay.includes(key)) {
      return true;
    }
    if (list.some((a) => hay.includes(a)) && (key === needle || list.includes(needle))) {
      return true;
    }
  }
  return false;
}

/* ── Ranked result ── */

interface RankedCompany {
  company: Company;
  score: number;
  onCount: number;
  totalCount: number;
  lists: { id: string; name: string }[];
  humanReview?: Review;
  displayScore: number;
}

/* ── Page ── */

export function SingleSearchPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [matchedMission, setMatchedMission] = useState<Mission | null>(null);
  const [ranked, setRanked] = useState<RankedCompany[]>([]);
  const [trustedCount, setTrustedCount] = useState(0);

  const [busy, setBusy] = useState(false);
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [adjustScore, setAdjustScore] = useState("70");
  const [reason, setReason] = useState("");

  useEffect(() => {
    void api
      .listMissions()
      .then(setMissions)
      .catch(() => {});
  }, []);

  async function onSearch(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setSearched(true);
    setMatchedMission(null);
    setRanked([]);

    try {
      const parsed = parseQuery(query, missions);

      const match = missions.find((m) => {
        const locOk = parsed.location
          ? m.location.toLowerCase() === parsed.location.toLowerCase()
          : true;
        const secOk = parsed.sector
          ? missionMatchesSector(m, parsed.sector)
          : true;
        return locOk && secOk;
      });

      if (!match) {
        setLoading(false);
        return;
      }

      setMatchedMission(match);

      const [src, comps, revs] = await Promise.all([
        api.listSources(match.id),
        api.listCompanies(match.id),
        listReviews(match.id),
      ]);

      setTrustedCount(countTrustedLists(src));

      const reviewMap = new Map<string, Review>();
      for (const r of revs) {
        if (r.targetType !== "company") continue;
        const prev = reviewMap.get(r.targetId);
        if (!prev || r.createdAt > prev.createdAt) reviewMap.set(r.targetId, r);
      }

      let results: RankedCompany[] = comps
        .filter((c) => c.kvk_gate !== "fail")
        .map((c) => {
          const cov = computeListCoverage(c, src);
          const human = reviewMap.get(c.id);
          const displayScore =
            human?.humanScore != null ? human.humanScore : cov.score;
          return {
            company: c,
            score: cov.score,
            onCount: cov.onCount,
            totalCount: cov.totalCount,
            lists: cov.lists.map((s) => ({ id: s.id, name: s.name })),
            humanReview: human,
            displayScore,
          };
        })
        .sort((a, b) => b.displayScore - a.displayScore);

      if (parsed.context) {
        const ctx = parsed.context as ServiceContext;
        results = results.filter((r) =>
          (r.company.serviceContexts ?? []).includes(ctx),
        );
      }

      setRanked(results.slice(0, 5));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  async function submitReview(
    company: Company,
    listScore: number,
    action: "agree" | "adjust" | "disagree",
  ) {
    if (!matchedMission) return;
    if (
      (action === "adjust" || action === "disagree") &&
      reason.trim().length < 8
    ) {
      setError("Adjust / Disagree requires a reason (min 8 characters).");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const now = new Date().toISOString();
      const humanScore =
        action === "agree"
          ? listScore
          : action === "disagree"
            ? 0
            : Number(adjustScore);

      const review: Review = {
        id: uuid(),
        missionId: matchedMission.id,
        producer: "Human",
        targetType: "company",
        targetId: company.id,
        action,
        originalScore: listScore,
        humanScore,
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

      await api.createInMission(matchedMission.id, "reviews", review);
      setAdjustingId(null);
      setReason("");

      setRanked((prev) =>
        prev
          .map((r) =>
            r.company.id === company.id
              ? { ...r, humanReview: review, displayScore: humanScore }
              : r,
          )
          .sort((a, b) => b.displayScore - a.displayScore),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Review failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="single-search">
      {/* Hero */}
      <div className="search-hero">
        <h1>🔍 Single Search</h1>
        <p className="thesis">
          One question. One answer. Evidence-based, not popularity-based.
          Every score has a reason. Every reason has a source.
        </p>
      </div>

      {/* Search bar */}
      <form className="search-bar" onSubmit={onSearch}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='e.g. "painters in Haarlemmermeer" or "schilder voor VvE"'
          autoFocus
        />
        <button type="submit" className="btn" disabled={loading}>
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {error ? <div className="error">{error}</div> : null}

      {/* No match */}
      {searched && !loading && !matchedMission ? (
        <div className="search-no-match">
          <p>
            <strong>No investigation found for this query.</strong>
          </p>
          <p className="muted">
            Single Search reads existing investigations. Start one in Mission
            Control first, then come back here.
          </p>
          <div className="row" style={{ justifyContent: "center", marginTop: "0.75rem" }}>
            <Link className="btn" to="/">
              ← Mission Control
            </Link>
          </div>
        </div>
      ) : null}

      {/* Results */}
      {matchedMission ? (
        <div className="search-results">
          {/* Mission context bar */}
          <div className="search-mission-bar">
            <div>
              <h2>
                {matchedMission.location} · {matchedMission.subsector}
              </h2>
              <p className="muted">{matchedMission.goal}</p>
            </div>
            <div className="row" style={{ gap: "0.35rem", flexWrap: "wrap" }}>
              <StatusChip
                label={`${trustedCount} trusted lists`}
                tone={trustedCount >= 5 ? "done" : "active"}
              />
              <StatusChip
                label={`${ranked.length} results`}
                tone={ranked.length ? "active" : "waiting"}
              />
              <Link
                className="btn secondary small"
                to={`/missions/${matchedMission.id}`}
              >
                ← Investigation
              </Link>
              <Link
                className="btn secondary small"
                to={`/work/${matchedMission.id}/sources`}
              >
                ⚡ Data Worker
              </Link>
            </div>
          </div>

          {/* Ranked cards */}
          {!ranked.length ? (
            <div className="empty">
              No companies found. Import companies in the Data Worker first.
            </div>
          ) : (
            <div className="search-result-list">
              {ranked.map((r, idx) => (
                <article key={r.company.id} className="search-result-card">
                  <div className="search-result-rank">#{idx + 1}</div>

                  <div className="search-result-body">
                    <header>
                      <div>
                        <strong>{r.company.name}</strong>
                        {r.company.category ? (
                          <span
                            className="muted mono"
                            style={{ marginLeft: "0.5rem" }}
                          >
                            {r.company.category}
                          </span>
                        ) : null}
                        {r.company.region ? (
                          <span
                            className="muted"
                            style={{ marginLeft: "0.5rem" }}
                          >
                            {r.company.region}
                          </span>
                        ) : null}
                      </div>
                      <div className="row" style={{ gap: "0.35rem" }}>
                        <span
                          className={`search-score ${
                            r.displayScore >= 70
                              ? "high"
                              : r.displayScore >= 40
                                ? "mid"
                                : "low"
                          }`}
                        >
                          {r.displayScore}
                        </span>
                        <StatusChip
                          label={`KvK: ${r.company.kvk_gate}`}
                          tone={
                            r.company.kvk_gate === "pass"
                              ? "done"
                              : r.company.kvk_gate === "fail"
                                ? "waiting"
                                : "active"
                          }
                        />
                      </div>
                    </header>

                    {/* Can / For / Notable + profile snippet */}
                    <CompanyProfileTags company={r.company} />

                    {/* Why */}
                    <details className="search-why">
                      <summary>
                        Why {r.displayScore}/100? · {r.onCount}/
                        {r.totalCount} trusted lists
                      </summary>
                      <div className="search-why-body">
                        {r.lists.length ? (
                          <ul>
                            {r.lists.map((s) => (
                              <li key={s.id}>{s.name}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="muted">No trusted list mentions yet.</p>
                        )}
                        {r.humanReview ? (
                          <p className="search-human-note">
                            Human: {r.humanReview.action}
                            {r.humanReview.humanScore != null
                              ? ` → ${r.humanReview.humanScore}`
                              : ""}
                            {r.humanReview.reason
                              ? ` · "${r.humanReview.reason}"`
                              : ""}
                          </p>
                        ) : null}
                      </div>
                    </details>

                    {/* Backwards CARA — one click */}
                    <div className="search-cara">
                      {r.humanReview ? (
                        <span className="search-cara-done">
                          ✓ {r.humanReview.action}
                          {r.humanReview.reason
                            ? ` · "${r.humanReview.reason}"`
                            : ""}
                        </span>
                      ) : adjustingId === r.company.id ? (
                        <div className="search-cara-form">
                          <label>
                            Score
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={adjustScore}
                              onChange={(e) => setAdjustScore(e.target.value)}
                            />
                          </label>
                          <label>
                            Reason
                            <textarea
                              rows={2}
                              value={reason}
                              onChange={(e) => setReason(e.target.value)}
                              placeholder="Why adjust / disagree? (min 8 chars)"
                            />
                          </label>
                          <div className="row" style={{ gap: "0.25rem" }}>
                            <button
                              type="button"
                              className="btn small"
                              disabled={busy}
                              onClick={() =>
                                void submitReview(r.company, r.score, "adjust")
                              }
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              className="btn danger small"
                              disabled={busy}
                              onClick={() =>
                                void submitReview(
                                  r.company,
                                  r.score,
                                  "disagree",
                                )
                              }
                            >
                              Disagree
                            </button>
                            <button
                              type="button"
                              className="btn secondary small"
                              onClick={() => {
                                setAdjustingId(null);
                                setReason("");
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="row" style={{ gap: "0.25rem" }}>
                          <button
                            type="button"
                            className="btn small"
                            disabled={busy}
                            onClick={() =>
                              void submitReview(r.company, r.score, "agree")
                            }
                          >
                            ✓ Correct
                          </button>
                          <button
                            type="button"
                            className="btn secondary small"
                            disabled={busy}
                            onClick={() => {
                              setAdjustingId(r.company.id);
                              setAdjustScore(String(r.score));
                              setReason("");
                            }}
                          >
                            ~ Adjust
                          </button>
                          <button
                            type="button"
                            className="btn danger small"
                            disabled={busy}
                            onClick={() => {
                              setAdjustingId(r.company.id);
                              setAdjustScore("0");
                              setReason("");
                            }}
                          >
                            ✗ Wrong
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {/* Footer */}
      <footer className="search-footer">
        <p className="muted">
          Single Search reads existing investigations. It does not create new
          data. Every result links back to the full investigation trail.
        </p>
      </footer>
    </div>
  );
}