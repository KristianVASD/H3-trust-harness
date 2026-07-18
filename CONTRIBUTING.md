# Contributing

## What belongs in Git

- Source under `apps/` and `packages/`
- Committed demos under `fixtures/`
- Config templates (`.env.example`, EditorConfig, ESLint, Prettier)

## What must stay local

- Everything under `writable/` (runtime missions, reviews, exports)
- Real `.env` files

## Demo data

```powershell
pnpm seed                 # load DEMO into writable/
pnpm fixtures:write       # refresh fixtures/demos from seed (maintainers)
pnpm fixtures:load        # load fixtures/demos/haarlem_painters into writable/
```

## Checks before PR

```powershell
pnpm typecheck
pnpm lint
```
