# Demo: Haarlemmermeer Painters

Full walkthrough fixture — every pipeline step has mock data.

## Steps covered

| Step | What you’ll see in the UI |
|------|---------------------------|
| Mission | Haarlemmermeer · Painters (DEMO) |
| **Data Worker** | 5 trusted lists · 18 companies · ranked Results · CARA trail |
| Journal | Kickoff + tasks (KvK, CARA) |
| Observations | Gemeente, KvK, association, DNS age |
| Hypotheses | Testing / Draft / **Rejected** (rejected kept on purpose) |
| Sources | 10 sources: 5 trusted, drafts, candidate, rejected SEO-farm |
| Evidence | Linked URLs / snippets |
| Signals | registry, longevity, association, infra (−) |
| Confidence | Explainable proposals per source |
| Companies | 18 firms with list-coverage spread + blacklist example |
| CARA | Source + company reviews (agree / adjust / disagree) |
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
