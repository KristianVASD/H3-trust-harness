Ik zou dit project hernoemen

Niet

OmegaClaw

maar

OmegaClaw Harness

of

OmegaClaw Workbench

of zelfs

OmegaClaw Studio

Want dat is wat je nu eigenlijk maakt.

Niet de AI.

Maar de omgeving waarin AI en mensen samenwerken.

Eigenlijk bouw je vijf schermen

Niet honderd.

Vijf.

Meer niet.

1. Mission Control

Hier begint alles.

Geen AI.

Alleen opdracht.

Locatie

Haarlemmermeer

Land

Nederland

Sector

Home Maintenance

Subsector

Painters

Start

Klik.

Project wordt aangemaakt.

Daarna zie je links:

Phase 1

waiting

Phase 2

waiting

Phase 3

waiting

Phase 4

waiting

Dit is letterlijk Mission Control.

2. Omega Workspace

Dit is waar "OmegaClaw" normaal zou werken.

Maar voorlopig...

werk jij.

Scherm bestaat uit twee panelen.

Links:

Prompt

Notities

Brainstorm

Taken

Rechts:

Structured Output

Source

Type

Confidence

Reasoning

Evidence

Suggested Weight

Notes

Elke bron die jij vindt...

komt hierin.

Dus jij bent de AI.

Maar de UI doet alsof OmegaClaw bestaat.

Later vervang je alleen de invoer.

Niet de architectuur.

Dat is enorm.

3. Source Review

Nu begint CURA.

Je ziet alle bronnen.

Google Business

80

Waarom?

....

KVK

95

Waarom?

....

Ondernemersvereniging

70

Waarom?

....


Klik.

Open.

Onderin.

Agree

Disagree

Adjust score

Reason


Dat IS Human in the Loop.

Niet ingewikkelder maken.

4. Situation Room

Dit wordt mijn favoriete scherm.

Links:

Pipeline

█ Phase 1

███ Phase 2

██ Phase 3

█ Phase 4

Midden:

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

Rechts

Issues

Low confidence

Duplicate companies

Human review needed

Conflicting evidence


Dit wordt jouw command center.

Niet technisch.

Operationeel.

5. Knowledge Graph

Niet Neo4J.

Niet ingewikkeld.

Gewoon.

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

Klik.

Alles open.

Je kunt precies volgen.

Waarom.

En dan komt het mooie.

Iedere actie wordt opgeslagen.

Niet alleen data.

Maar denken.

Bijvoorbeeld.

Mission

Home Maintenance Haarlem


Bron.

Ondernemersvereniging Haarlem


Omega zegt

score 70


Mens zegt

85


Waarom?

Deze vereniging organiseert
al twintig jaar lokale bijeenkomsten.

Dat wordt opgeslagen.

Niet als tekst.

Maar als

Learning

Dan krijg je iets als
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


DAT

is reinforcement.

Niet GPT finetunen.

Maar menselijke wijsheid verzamelen.

Dan de volgende laag.

Die mis ik nog.

Ik zou hem toevoegen.

Omega Memory

Niet voor datasets.

Voor inzichten.

Bijvoorbeeld.

Insight


"Lokale ondernemersverenigingen
met minimaal 15 jaar geschiedenis
bleken in 82% van de gevallen
sterke indicatoren."

Of

Insight


"Nieuwe keurmerken
zonder bestuursinformatie
bleken vaak weinig waarde te hebben."

Of

Insight


"DNS leeftijd
bleek minder voorspellend
dan lokale samenwerking."

Dit zijn geen datasets.

Dit zijn

Patterns.

En dat is precies wat OmegaClaw later zou moeten gebruiken.

Dan ontstaat deze architectuur
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

En hier gebeurt iets heel interessants.

Je bent geen AI aan het trainen.

Je bent een redenatiebibliotheek aan het bouwen.

Een toekomstige OmegaClaw hoeft niet alleen te weten dat een ondernemersvereniging vaak belangrijk is; hij kan terugzien welke argumenten mensen daarvoor gaven, in welke context, en hoe die beoordeling zich in de praktijk hield.

Cursor Build Plan (MVP Harness)

Ik zou Cursor één opdracht geven:

"Bouw geen AI-agent. Bouw een Human-AI Research Harness."

Modules:

Mission Control – nieuwe opdrachten starten (locatie, sector, status).
Phase Workspace – per fase een werkruimte met invoer, notities en gestructureerde output.
Evidence Registry – alle bronnen, bedrijven en bewijsstukken centraal opgeslagen.
CARA Review Queue – menselijke beoordeling, score-aanpassing en verplichte motivatie.
Learning Ledger – iedere wijziging wordt als leerpunt opgeslagen.
Pattern Library – geabstraheerde inzichten die uit meerdere reviews ontstaan.
Situation Room – live voortgang, statistieken, knelpunten en reviewwachtrijen.
Knowledge Graph Viewer – visuele relaties tussen bronnen, bedrijven, bewijs en beslissingen.
Export API – alle data als JSON beschikbaar voor een toekomstige OmegaClaw.

De belangrijkste ontwerpregel zou ik bovenaan README.md zetten:

The Harness never decides. It records, structures, explains and learns. Decision support comes from human reasoning today, and from OmegaClaw tomorrow.

Dat is volgens mij de grote doorbraak in je architectuur. Je bouwt geen systeem dat afhankelijk is van één AI-model. Je bouwt een omgeving waarin mensen en toekomstige AI's op dezelfde transparante manier kunnen samenwerken, leren en verbeteren. Dat maakt de kennis duurzaam, herbruikbaar en overdraagbaar naar meerdere OmegaClaws en zelfs andere AI-systemen.

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

7. CARA Review

Richer than score adjust. Review chain in UI (simple, not heavy):

Observation → Hypothesis → Evidence → Suggested confidence
  → Human judgement → Reasoning → Version

Non-blocking UX preserved:





One-click Agree (no reason)



Adjust / Disagree requires reason



Queue optional; investigation continues in Workspace



CARA-only producers for final validation acts

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



omegaclaw_santa_process.svg Track A Fase 1–2 maps to Mission → Observations/Hypotheses → Source Discovery → Signals. Fase 3–4 (companies / deep check) and Track B (fraud) stay as phase placeholders until Investigation Memory is solid for sources/lists.

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