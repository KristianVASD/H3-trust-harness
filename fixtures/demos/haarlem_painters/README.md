# Demo: Haarlemmermeer Painters

Full walkthrough fixture — every pipeline step has mock data.

## Steps covered

| Step | What you’ll see in the UI |
|------|---------------------------|
| Mission | Haarlemmermeer · Painters (DEMO) |
| Journal | Kickoff + tasks (KvK, CARA) |
| Observations | Gemeente, KvK, association, DNS age |
| Hypotheses | Testing / Draft / **Rejected** (rejected kept on purpose) |
| Sources | KvK, GBP, association, trade fair (+ categories) |
| Evidence | Linked URLs / snippets |
| Signals | registry, longevity, association, infra (−) |
| Confidence | Explainable proposals per source |
| Companies | candidate / target / staged + blacklist example |
| CARA | Source + company reviews |
| Findings | Validated human outcomes |
| Investigations | Five units (pattern threshold N≥5) |
| Pattern | Association insight |

## Load

```powershell
pnpm seed
# or
pnpm fixtures:load -- demos/haarlem_painters
```

Safe to delete the mission in Mission Control; re-run seed to restore.
