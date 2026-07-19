import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { v4 as uuid } from "uuid";
import { DEFAULT_SEARCH_PLAN_VERSION, type Mission } from "@h3-trust/schema";
import { api } from "../api";
import { ProducerBadge, StatusChip } from "../components/Badges";

const defaultPhases: Mission["phases"] = [
  { key: "observation", status: "active" },
  { key: "hypothesis", status: "waiting" },
  { key: "evidence", status: "waiting" },
  { key: "cara", status: "waiting" },
  { key: "patterns", status: "waiting" },
  { key: "companies", status: "waiting" },
  { key: "deep_check", status: "waiting" },
];

export function MissionControl() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    location: "Haarlemmermeer",
    country: "Nederland",
    sector: "Home Maintenance",
    subsector: "Painters",
    goal: "Find trustworthy local painters and validate source reliability.",
    notes: "",
  });

  async function load() {
    try {
      setError(null);
      setMissions(await api.listMissions());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load missions");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const mission: Mission = {
        id: uuid(),
        ...form,
        notes: form.notes || undefined,
        search_plan_version: DEFAULT_SEARCH_PLAN_VERSION,
        discoveryBrief: {
          approach: "",
          candidateListTypes: ["registry", "local_business_association"],
          successCriteria:
            "≥5 CARA-accepted/adjusted lists before company deep-check",
          producer: "Human",
          updatedAt: now,
        },
        phases: defaultPhases,
        producer: "Human",
        createdAt: now,
        updatedAt: now,
        v: 1,
      };
      await api.createMission(mission);
      setForm((f) => ({ ...f, notes: "" }));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create mission");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(missionId: string, label: string) {
    if (
      !window.confirm(
        `Delete mission “${label}” and all its journal, observations, sources, companies, reviews?\nThis cannot be undone.`,
      )
    ) {
      return;
    }
    try {
      setError(null);
      await api.deleteMission(missionId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete mission");
    }
  }

  return (
    <div>
      <p className="thesis">
        <strong>The Harness never decides.</strong> It structures investigations,
        preserves evidence, captures human reasoning, and accumulates validated
        knowledge. You are the investigator today — OmegaClaw can be one tomorrow.
      </p>

      {error ? <div className="error">{error}</div> : null}

      <div className="grid-missions">
        <section className="panel">
          <h2>Missions</h2>
          <p className="hint">Open an investigation. No AI required.</p>
          {missions.length === 0 ? (
            <div className="empty">No missions yet. Create one to begin.</div>
          ) : (
            missions.map((m) => (
              <div key={m.id} className="mission-card" style={{ position: "relative" }}>
                <Link to={`/missions/${m.id}`} style={{ display: "block" }}>
                  <h3>
                    {m.location} · {m.subsector}
                  </h3>
                  <p className="muted">{m.goal}</p>
                  <div className="mission-meta">
                    <ProducerBadge producer={m.producer} />
                    <StatusChip label={m.country} />
                    <StatusChip label={m.sector} />
                    {m.phases
                      .filter((p) => p.status === "active")
                      .map((p) => (
                        <StatusChip key={p.key} label={p.key} tone="active" />
                      ))}
                  </div>
                </Link>
                <div className="row" style={{ marginTop: "0.75rem" }}>
                  <Link className="btn small" to={`/missions/${m.id}`}>
                    Open
                  </Link>
                  <button
                    type="button"
                    className="btn danger small"
                    onClick={() =>
                      void onDelete(m.id, `${m.location} · ${m.subsector}`)
                    }
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </section>

        <section className="panel">
          <h2>New mission</h2>
          <p className="hint">Mission Control — start research, not a chat.</p>
          <form className="form-stack" onSubmit={onSubmit}>
            <div className="split-2">
              <label>
                Location
                <input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  required
                />
              </label>
              <label>
                Country
                <input
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  required
                />
              </label>
            </div>
            <div className="split-2">
              <label>
                Sector
                <input
                  value={form.sector}
                  onChange={(e) => setForm({ ...form, sector: e.target.value })}
                  required
                />
              </label>
              <label>
                Subsector
                <input
                  value={form.subsector}
                  onChange={(e) => setForm({ ...form, subsector: e.target.value })}
                  required
                />
              </label>
            </div>
            <label>
              Mission goal
              <textarea
                value={form.goal}
                onChange={(e) => setForm({ ...form, goal: e.target.value })}
                required
              />
            </label>
            <label>
              Notes (optional)
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </label>
            <button className="btn" type="submit" disabled={saving}>
              {saving ? "Creating…" : "Start investigation"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
