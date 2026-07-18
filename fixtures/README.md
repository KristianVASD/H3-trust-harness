# Fixtures (committed)

Demo and sample data that **is** version-controlled.

| Path | Purpose |
|------|---------|
| [`demos/`](demos/) | Full investigation bundles (ExportBundle JSON) for demos |
| [`samples/`](samples/) | Small paste/CSV files to try Bulk Import |

## Runtime vs fixtures

| Location | Git? | Role |
|----------|------|------|
| `fixtures/` | **yes** | Examples, demos, sample imports |
| `writable/` | **no** | Live missions you create while investigating |

```text
pnpm seed              → writes DEMO mission into writable/ (local only)
pnpm fixtures:write    → refresh fixtures/demos from current seed (maintainers)
pnpm fixtures:load     → load a demo bundle into writable/ without re-running seed TS
```

After `pnpm seed` or `pnpm fixtures:load`, open http://localhost:5173 and open **Haarlemmermeer · Painters (DEMO)**.
