# H3 Trust — OmegaClaw Harness

> **The Harness never decides.**  
> It structures investigations, preserves evidence, captures human reasoning, and accumulates validated knowledge.

This is a **Trust Investigation Platform** — not an AI agent, not a trust engine.

| Role | Meaning |
|------|---------|
| **Harness** | Investigation environment |
| **Human** | Investigator (today) |
| **OmegaClaw** | Investigator (tomorrow) |
| **CARA** | Human alignment — final validation only |

Every saved record has a **Producer** badge: `Human`, `OmegaClaw`, `ExternalAI`, or `ImportedDataset`. That way you always know *who* wrote which fact, hypothesis, or score suggestion.

---

## Quick start

```powershell
pnpm install
pnpm seed
pnpm dev
```

- Harness UI: http://localhost:5173  
- API: http://localhost:8787  
- API health: http://localhost:8787/api/health  

`pnpm seed` loads the **DEMO** mission into `writable/` (local only — never committed).  
Maintainers can refresh the committed snapshot with `pnpm fixtures:write`.  
Reload a fixture with `pnpm fixtures:load`.

Sample bulk-import files: [`fixtures/samples/`](fixtures/samples/).

---

## BGI Open Build — 3-Minute Demo

1. `pnpm install && pnpm seed && pnpm dev`
2. Open http://localhost:5173
3. Click **Haarlemmermeer · Painters** → **Data Worker**
4. See: trusted sources, gap board, CARA queue — then Import → Results
5. On Results: ranked trust scores, list mentions, **Can / For / Notable** company profile tags, human check (Agree / Adjust / Disagree)
6. Click **Export investigation** → open the JSON → full reasoning trail
7. Or open **Search** (top bar or Mission Control) → type `painters in Haarlemmermeer` → top-5 ranked answer with Why + one-click CARA

This is Trust Discovery: evidence-based, human-validated, AI-ready.

**Three entrances, one system:**

| Entrance | Path | Job |
|----------|------|-----|
| **Data Worker** | `/work/:id/…` | Linear production: sources → import → results (CARA anytime) |
| **Investigation** | `/missions/:id` | Deep desk: notebook, Situation Room, graph |
| **Single Search** | `/search` | One question → ranked answer from existing investigations |

Switch anytime via Mission Control or the top bar.

---

## Design thesis

Human investigators work today. OmegaClaw becomes another investigator tomorrow. Every object carries a **Producer**. OmegaClaw never performs final CARA validation.

You investigate which **sources** and **signals** should count when judging trustworthiness of home-service companies — starting with residential maintenance (painters), later more sectors and geographies.

**OmegaClaw jobs (prompt + I/O contract):** see [`OmegaClaw.md`](OmegaClaw.md).  
Pipeline first, CARA later — CARA scores sources, confirms choices, and feeds reasons back so OmegaClaw improves; it does not block discovery.

---

## Repository layout

```
apps/harness     — Vite + React investigation UI
apps/server      — Local API (port 8787) + FileStore
packages/schema  — Shared Zod models + agent contracts
packages/store   — Store interface + FileStore (JSON on disk)
fixtures/        — Committed demos + sample imports (IN Git)
writable/        — Runtime mission data (NOT in Git)
```

| What | Location | Git? |
|------|----------|------|
| Source code | `apps/`, `packages/` | yes |
| Demo / sample data | `fixtures/` | yes |
| Live investigations | `writable/` | **no** |
| Secrets | `.env` | **no** (use `.env.example`) |

Flow:

```text
Browser (5173)  →  API (8787)  →  writable/*.json on disk
fixtures/demos  →  pnpm seed / fixtures:load  →  writable/
```

---

## Investigation pipeline

```text
Mission
  → Journal / Tasks
  → Observations          (facts only — no score)
  → Hypotheses            (ideas — keep Rejected ones)
  → Sources               (discovery list + category)
  → Companies             (candidates / targets / staged)
  → Signals               (explainable deltas)
  → Suggested confidence  (proposal, not truth)
  → CARA Review           (Sources or Companies)
  → Findings              (validated outcomes)
  → Export / Knowledge Graph / Situation Room
```

---

## How to use each screen

### 1. Mission Control — `/`

Start of every investigation.

- See existing missions (after seed: Haarlemmermeer · Painters)
- Or create a new one: location, country, sector, subsector, goal, notes
- Click **Open** to enter the workspace
- Click **Delete** to remove a mission and all its related records (confirm required)

Saves a `Mission` with phase badges (observation, hypothesis, evidence, CARA, …). Early phases are active; company deep-check is stubbed for later.

### 2. Investigation Workspace — `/missions/:id`

Your main research desk (not a chatbot).

| Tab | Meaning | How to use |
|-----|---------|------------|
| **Journal** | Notes & tasks | Log what you did / what’s next |
| **Observations** | Facts only | e.g. “Gemeente site links to ondernemersvereniging” + URL. **No score.** |
| **Hypotheses** | Claims under test | e.g. “Associations beat commercial directories.” Status: Draft → Testing → Validated / **Rejected** / Archived. Rejected stays — that is knowledge. |
| **Sources** | Candidate trust sources | KvK, Google Business, local association, etc. Each has a **category** (registry, local_business_association, …). Suggested weight is a **suggestion**, not a decision. |
| **Companies** | Firms from lists / discovery | Filter candidate / target / staged. Hard **kvk_gate** (pass/fail/unchecked). Link sources, list membership, blacklist flags. Bulk-import paste/CSV. Each company can carry a **category** (navigation door) plus harvested/manual **profile dimensions** — see below. |

Right side: forms to **Add** each of those. Every save is stamped **Producer · Human**.

Top navigation:

- **CARA Review** — human validation  
- **Signals** — build explainable confidence  
- **Situation Room** — ops overview  
- **Knowledge Graph** — browse the chain  
- **Export investigation** — download full JSON bundle  

**Typical first session:** open seed mission → Companies tab → review seed firms → bulk-import a short list → CARA a company.

### Company profile (Can / For / Notable)

Category alone is too coarse (“painter” says nothing about interior vs spray work, or private vs HOA clients). Companies therefore carry optional descriptive fields — **not** part of the trust score:

| Dimension | Field | Meaning |
|-----------|-------|---------|
| Door | `category` | Navigation label (e.g. `painting`) |
| **Can** | `capabilities` | What they do (free strings, e.g. `interior painting`, `wood-rot repair`) |
| **For** | `serviceContexts` | Who they serve (`private`, `hoa`, `municipal`, `commercial`, `industrial`) |
| **Notable** | `differentiators` | What stands out (e.g. `heritage experience`) |
| Evidence | `profileSnippet` (+ URL / harvested-at / producer) | Short website summary with provenance |

Shown read-only on Companies, Worker Results, and Single Search as teal / blue / purple chips — visually separate from CARA / trust chips. Synonyms can later collapse via [`searchplans/capability_aliases.v1.json`](searchplans/capability_aliases.v1.json). Harvesting (OmegaClaw reading a site → filling these fields) is the intended next producer path; the harness already displays the output.

### 3. Single Search — `/search`

One question, one ranked answer — reads **existing** investigations only (does not create missions).

1. Type e.g. `painters in Haarlemmermeer` or `schilder voor VvE`
2. Keyword parse matches location / sector / service context to a mission
3. Companies ranked by weighted trusted-list coverage (KvK-fail excluded); optional context filter
4. Top 5 cards: score, **Can / For / Notable**, expandable **Why** (which lists), one-click backwards CARA (Correct / Adjust / Wrong)

Links out to full Investigation and Data Worker for the matched mission.

### 4. Signals — `/missions/:id/signals`

The reasoning layer.

1. Pick a source (e.g. KvK)  
2. Add a signal key: `registry`, `longevity`, `association`, …  
3. Each key has a fixed delta (e.g. longevity +8)  
4. System recomputes **suggested confidence** from base 50 + sum of deltas  
5. Explainability panel shows the math in plain text  

Still **not** a final trust score — only a proposal for CARA.

### 5. CARA Review — `/missions/:id/cara` (two checkpoints)

Human alignment. OmegaClaw must never do this as final authority.

Toggle **CARA (sources)** | **CARA (companies)** — same agree/adjust/disagree mechanism, same mark in every overview.  
**Check known sources** (Workspace → Sources coverage panel) is a separate mechanical lookup: only `accepted` / `adjusted` sources count as covered.

1. Pick an item from the queue  
2. Read suggested confidence (for companies: average of linked sources)  
3. Choose:  
   - **Agree** — one click, no reason required  
   - **Adjust** — set your score + **reason required** (≥ 8 characters)  
   - **Disagree** — reject + **reason required**  

For **sources**, Agree/Adjust/Disagree also updates source status (`accepted` / `adjusted` / `rejected`).  
For **companies**, CARA writes Review + Finding only — it does **not** change `candidate` / `target` / `staged` or `kvk_gate`.

Reuse of a source always inherits a prior human CARA judgement — it never bypasses one.

You can keep working in Workspace while reviews wait — **CARA is not a blocker.** OmegaClaw may continue Jobs 1–4; CARA later locks scores and stores Adjust/Disagree reasons as feedback (see [`OmegaClaw.md`](OmegaClaw.md)).

### 6. Situation Room — `/missions/:id/situation`

Operational cockpit:

- Progress bars (observations, hypotheses, sources, companies, CARA, journal)  
- Attention counts: needs review, company candidates, KvK fail, blacklist flags, rejected hypotheses, missing evidence, weak confidence  

Use it when you ask: “Where should I spend time next?”

### 7. Knowledge Graph — `/missions/:id/graph`

A simple human graph (not Neo4j).

Lists nodes by kind: Mission → Hypothesis → Observation → Source → Company → Review. Click a node to see producer, detail, and id.

Use it to answer: “How did we get to this judgement?”

### 8. Export

From Workspace → **Export investigation**.

Produces a full bundle (mission, observations, hypotheses, sources, signals, reviews, findings, journal, …), downloads it, and writes under `writable/export/`.

That file is what a future OmegaClaw (or another AI) should be able to **reconstruct** the same investigation from.

---

## Where data lives

After seed/use you will see folders like:

```text
writable/
  missions/
  journal/
  observations/
  hypotheses/
  sources/
  companies/
  signals/
  reviews/
  findings/
  export/
```

Each record is one JSON file. You can open them in an editor — the platform is transparent by design.

---

## Who does what

| Step | Human (now) | OmegaClaw (later) |
|------|-------------|-------------------|
| Mission | create | suggest only |
| Journal / observations / hypotheses / sources | write | write same shapes |
| Company profile (Can / For / Notable) | correct / fill | harvest from websites |
| Signals / suggested confidence | assist | propose |
| **CARA / final validation** | **yes** | **never** |
| Pattern promotion | human | propose only |

Today **you are the field researcher**. The UI is already shaped so an agent can fill the same forms later without redesigning screens.

---

## 15-minute walkthrough

1. `pnpm dev` → open http://localhost:5173  
2. Open **Haarlemmermeer · Painters**  
3. **Observations** → add one new fact with a URL  
4. **Hypotheses** → add one claim; set status to Testing  
5. **Sources** → add e.g. a local association site  
6. **Signals** → attach `association` to that source; read the explanation  
7. **CARA** → Agree or Adjust with a real reason  
8. **Situation Room** → see queue counts move  
9. **Export** → save the JSON and open it to see your reasoning trail  
10. **Search** → `painters in Haarlemmermeer` → confirm the same firms surface with Why + profile tags  

If that loop feels natural, the product thesis is working: you ran a trust **investigation**, not a black-box score.

---

## Status: solid vs thin

**Solid now:** Mission Control, **Single Search**, Data Worker + Investigator desks, Workspace (journal / observations / hypotheses / sources / **companies** + bulk import), Source **category**, company **profile dimensions** (Can / For / Notable + snippet), Signals + explainability, CARA (sources **and** companies), Situation Room, Knowledge Graph, Export (includes companies), Producer on records, seed mission, local FileStore.

**Thin / next:** live OmegaClaw jobs per [`OmegaClaw.md`](OmegaClaw.md) (Gap Fill stub → Job 1/2; profile harvest Job 4), capability-filter / CSI query UX, Pattern Library promote UI (schema has `PATTERN_MIN_INVESTIGATIONS = 5`), full Investigation Memory screen, richer Evidence tab, Track B fraud / company deep-check phases.

---

## License

Apache License 2.0 — see [LICENSE](LICENSE). Part of the H3 Trust / BGI Nexus vision.
