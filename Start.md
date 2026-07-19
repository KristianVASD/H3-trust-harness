I would rename this project

Not

OmegaClaw

but

OmegaClaw Harness

or

OmegaClaw Workbench

or even

OmegaClaw Studio

Because that is what you are actually building now.

Not the AI.

But the environment in which AI and people collaborate.

In practice you are building five screens

Not a hundred.

Five.

No more.

1. Mission Control

Everything starts here.

No AI.

Only the assignment.

Location

Haarlemmermeer

Country

Netherlands

Sector

Home Maintenance

Subsector

Painters

Start

Click.

Project is created.

Then you see on the left:

Phase 1

waiting

Phase 2

waiting

Phase 3

waiting

Phase 4

waiting

This is literally Mission Control.

2. Omega Workspace

This is where "OmegaClaw" would normally work.

But for now...

you work.

The screen consists of two panels.

Left:

Prompt

Notes

Brainstorm

Tasks

Right:

Structured Output

Source

Type

Confidence

Reasoning

Evidence

Suggested Weight

Notes

Every source you find...

goes in here.

So you are the AI.

But the UI pretends OmegaClaw exists.

Later you only replace the input.

Not the architecture.

That is enormous.

3. Source Review

Now CARA begins.

You see all sources.

Google Business

80

Why?

....

KvK

95

Why?

....

Entrepreneurs association

70

Why?

....


Click.

Open.

At the bottom.

Agree

Disagree

Adjust score

Reason


That IS Human in the Loop.

Do not make it more complicated.

4. Situation Room

This becomes my favourite screen.

Left:

Pipeline

█ Phase 1

███ Phase 2

██ Phase 3

█ Phase 4

Centre:

Live Metrics

Sources

126

Companies

983

Validated

201

Pending

44

Rejected

13

Right

Issues

Low confidence

Duplicate companies

Human review needed

Conflicting evidence


This becomes your command centre.

Not technical.

Operational.

5. Knowledge Graph

Not Neo4J.

Not complicated.

Just.

Source

↓

Company

↓

Evidence

↓

Decision

↓

Human Feedback

↓

New Weight

Click.

Everything opens.

You can follow exactly.

Why.

And then the beautiful part.

Every action is stored.

Not only data.

But thinking.

For example.

Mission

Home Maintenance Haarlem


Source.

Entrepreneurs association Haarlem


Omega says

score 70


Human says

85


Why?

This association has been organising
local meetings for twenty years.

That is stored.

Not as text.

But as

Learning

Then you get something like
Learning

ID

....

Category

Association

Original score

70

Human score

85

Difference

+15

Reason

Longevity underestimated

Evidence

Website

Meeting archive

Municipality references

Approved

Yes


THAT

is reinforcement.

Not GPT fine-tuning.

But collecting human wisdom.

Then the next layer.

I am still missing that.

I would add it.

Omega Memory

Not for datasets.

For insights.

For example.

Insight


"Local entrepreneurs associations
with at least 15 years of history
proved to be strong indicators
in 82% of cases."

Or

Insight


"New quality marks
without board information
often turned out to have little value."

Or

Insight


"DNS age
proved less predictive
than local collaboration."

These are not datasets.

These are

Patterns.

And that is exactly what OmegaClaw should use later.

Then this architecture emerges
Mission

↓

Workspace

↓

Source Discovery

↓

Evidence

↓

Human Review

↓

Learning

↓

Pattern Memory

↓

Knowledge Base

↓

Future OmegaClaws

And here something very interesting happens.

You are not training an AI.

You are building a reasoning library.

A future OmegaClaw does not only need to know that an entrepreneurs association is often important; it can look back at which arguments people gave for that, in which context, and how that assessment held up in practice.

Cursor Build Plan (MVP Harness)

I would give Cursor one assignment:

"Do not build an AI agent. Build a Human-AI Research Harness."

Modules:

Mission Control – start new assignments (location, sector, status).
Phase Workspace – a workspace per phase with input, notes and structured output.
Evidence Registry – all sources, companies and evidence snippets stored centrally.
CARA Review Queue – human assessment, score adjustment and mandatory rationale.
Learning Ledger – every change is stored as a learning point.
Pattern Library – abstracted insights that emerge from multiple reviews.
Situation Room – live progress, statistics, bottlenecks and review queues.
Knowledge Graph Viewer – visual relations between sources, companies, evidence and decisions.
Export API – all data available as JSON for a future OmegaClaw.

I would put the most important design rule at the top of README.md:

The Harness never decides. It records, structures, explains and learns. Decision support comes from human reasoning today, and from OmegaClaw tomorrow.

That is, in my view, the big breakthrough in your architecture. You are not building a system that depends on one AI model. You are building an environment in which people and future AIs can collaborate, learn and improve in the same transparent way. That makes the knowledge durable, reusable and transferable to multiple OmegaClaws and even other AI systems.

H3 Trust — OmegaClaw Harness (Masterplan)

Product identity

We are not building an AI agent.
We are not building a Trust Engine that outputs scores as truth.  

We are building a Trust Investigation Platform.




Role



What it is






Harness



The investigation environment






Human



An investigator (today)






OmegaClaw



Another investigator (tomorrow)






Other AIs



Additional investigators (later)






CARA



Human alignment / final validation layer — never delegated to AI

Long-term purpose: find companies worldwide that are trustworthy for residential service and maintenance — starting with home maintenance / painters in NL, then more sectors and geographies. Every completed investigation strengthens a shared Trust Knowledge Base.

Design thesis



The Harness never decides.
It structures investigations, preserves evidence, captures human reasoning, and accumulates validated knowledge.
Human investigators work today. OmegaClaw becomes another investigator tomorrow.
Every investigation strengthens the shared Trust Knowledge Base.

Golden rule — Producer on every object

Every record answers: Who performed this step?

Producer: Human | OmegaClaw | ExternalAI | ImportedDataset

This is not cosmetic. Later you must reconstruct: this hypothesis came from Omega; this observation from me; this confidence from the signal engine; this validation from CARA.

Locked technical choices






Persistence: hybrid — typed local JSON under writable/ now; Store interface designed for Supabase later



Stack: Vite + React + TypeScript; shared Zod schemas; FileStore first



First mission seed: NL / Haarlemmermeer (or Haarlem region) / Home Maintenance / Painters



Out of early sprints: live OmegaClaw, Telegram, Chroma, MeTTa, Track B fraud pipeline, multi-user consensus auth

Fundamental pipeline

flowchart TD
  Mission --> Workspace
  Workspace --> Observations
  Observations --> Hypotheses
  Hypotheses --> SourceDiscovery
  SourceDiscovery --> EvidenceGraph
  EvidenceGraph --> SignalInterpretation
  SignalInterpretation --> SuggestedConfidence
  SuggestedConfidence --> CaraReview
  CaraReview --> ValidatedFinding
  ValidatedFinding --> InvestigationMemory
  InvestigationMemory --> PatternLibrary
  PatternLibrary --> ExportAPI
  ExportAPI --> FutureInvestigators

Separation that matters:






Observations = facts only (no judgement, no score)



Hypotheses = possible explanations (including rejected ones — that is knowledge)



Signals / confidence = interpretable suggestions, not decisions



CARA = human judgement + versioned reasoning



Finding / Investigation Memory = validated investigation units (not generic “learnings”)



Patterns = promoted only after enough validated investigations (default N ≥ 5)

Where OmegaClaw plugs in later






Step



Human



OmegaClaw later






Mission



yes



suggest only





Journal



yes



yes






Observations



yes



yes






Hypothesis generation



yes



yes






Source discovery



yes



yes






Evidence collection



yes



yes






Signal interpretation



assist



yes






Suggested confidence



assist



yes






CARA Review



yes



never






Final validation



yes



never






Pattern promotion



yes



propose only

OmegaClaw never decides. It proposes, links, and drafts underpinnings.

Architecture (repo)

apps/harness/           Vite + React UI
packages/schema/        Zod: Mission, JournalEntry, Observation, Hypothesis,
                        Source, Evidence, Signal, ConfidenceProposal,
                        Review, Finding, Investigation, Pattern
                        + Producer enum on every writable entity
packages/store/         Store interface + FileStore; SupabaseStore stub later
writable/
  missions/
  journal/
  observations/
  hypotheses/
  sources/
  evidence/
  signals/
  reviews/
  findings/
  investigations/
  patterns/
  export/

Eight modules (+ ops surfaces)

1. Mission Control

Start an investigation mission: location, country, sector, subsector, mission goal, optional notes. Output: Mission (Producer: Human by default).

2. Investigation Workspace

Primary screen — research, not chat.





Left: Journal, Tasks, Notes, Hypotheses  



Right: Observations, Evidence, Sources, Imports, Attachments

Every write stamps Producer. Same UI later accepts OmegaClaw-produced structured payloads.

3. Observation Registry

Facts only. Example: Municipality links to association + URL + timestamp. No score. No verdict.

4. Hypothesis Manager

Ideas with status: Draft | Testing | Validated | Rejected | Archived. Rejected hypotheses are retained — they are knowledge.

5. Source Discovery

Human now; OmegaClaw later. Output: Source + reason + evidence refs + suggested weight + signals. Still no decision.

6. Evidence & Signal Engine

Chain: Observation → Evidence → Signal → Suggested confidence. Fully explainable (e.g. site since 2003 → longevity signal → confidence +8). Explainability panel required.

7. CARA — two human control points

Not one final button. Two explicit human gates with the same mechanism
(CARA tab: Sources toggle / Companies toggle), **same marking** in every diagram:

- **CARA (sources)** — source rating → status accepted / adjusted / rejected
- **CARA (companies)** — company review → Review + Finding

**Check known sources** (mechanical coverage) gets a **neutral** marking —
never the same colour as CARA. Only accepted/adjusted sources count as covered.

Richer than score adjust. Review chain in UI (simple, not heavy):

Observation → Hypothesis → Evidence → Suggested confidence
  → Human judgement → Reasoning → Version

Non-blocking UX preserved:

One-click Agree (no reason)

Adjust / Disagree requires reason

Queue optional; investigation continues in Workspace

CARA-only producers for final validation acts

Reusing a source always inherits a prior human CARA judgement —
it never bypasses one.

8. Investigation Memory

Core knowledge unit (replaces thin “Learning” as the primary concept):

Investigation {
  missionId, observationIds, hypothesisIds, evidenceIds,
  reviewIds, outcome, confidence, status
}
status: Validated | Rejected | NeedsMoreEvidence

Findings are the validated outcomes inside / linked to investigations.

Pattern Library

Patterns never auto-spawn. Promote only when ≥ 5 supporting validated investigations (configurable). Pattern cites investigation IDs.

Situation Room (ops)

Not vanity stats — operational attention:





Phase bars: Observation / Hypothesis / Evidence / CARA / Patterns  



Issues: Needs human review, Rejected hypotheses, Missing evidence, Conflicting signals, Weak confidence

Knowledge Graph (human, not Neo4j)

Expandable / simple graph: Mission → Hypothesis → Observation → Evidence → Signal → Review → Finding → Pattern. Click opens record panel.

Export

Complete investigation bundles (not bare company lists):

{
  "mission": {},
  "investigations": [],
  "observations": [],
  "evidence": [],
  "hypotheses": [],
  "sources": [],
  "reviews": [],
  "findings": [],
  "patterns": [],
  "journal": []
}

A future OmegaClaw must be able to reconstruct the same investigation.

Relation to SANTA and process diagram






SANTA remains the proof that structured evidence + export works; company-level deep check is a later mission phase, not the platform’s center of gravity.



omegaclaw_santa_process.svg Track A Phase 1–2 maps to Mission → Observations/Hypotheses → Source Discovery → Signals. Phase 3–4 (companies / deep check) and Track B (fraud) stay as phase placeholders until Investigation Memory is solid for sources/lists.

Build roadmap (6 sprints)

Sprint 1 — Foundation

Monorepo, Zod schemas (incl. Producer), FileStore, Mission Control, Investigation Workspace, Journal. Seed one NL painters mission.

Sprint 2 — Investigation Engine

Observation Registry, Hypothesis Manager, Source Registry, Evidence Registry, JSON import/export for those entities.

Sprint 3 — Reasoning Layer

Signal Engine, suggested confidence, explainability panel, Producer badges everywhere.

Sprint 4 — CARA

Review workflow over the full chain, versioning, Finding records, review queue. Human-only final validation enforced in schema/API.

Sprint 5 — Knowledge Platform

Investigation Memory, Pattern Library (N≥5), Situation Room, Knowledge Graph, full Export Bundle.

Sprint 6 — OmegaClaw Ready

Agent API contracts, Producer = OmegaClaw payloads, async job stubs. Harness runs the same workflow with human input or future agent input. No live agent required to call Sprint 6 “done” — contracts + fixtures suffice.

Success criteria






A human investigator can complete a full source-trust investigation without any AI.



Every object shows who produced it.



Observations stay judgement-free; scores only appear as suggested confidence until CARA.



Rejected hypotheses remain queryable knowledge.



Patterns cite ≥5 validated investigations.



Export reconstructs the investigation end-to-end.



Swapping Human → OmegaClaw as producer of observations/sources/hypotheses requires no screen redesign.

Why this is the right masterplan

The software is a usable product without AI. When OmegaClaw arrives, it does not replace screens or process — it becomes another investigator. Knowledge, evidence chains, and human control remain. That makes the Harness durable infrastructure for H3 Trust and the wider BGI Nexus vision — not a wrapper around one model.
