# canopyseeds.com

Launch site for **BoB** — the agent that builds your software — under the **Canopy Seed** philosophy
(*plant an idea, grow it, own it*). BoB leads (the keyboard-hoisting Highlander); Canopy Seed is the
underlying worldview: sovereignty, local-first, grown-not-rented.

Static site, built with [Astro](https://astro.build).

## Develop
```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # -> dist/
npm run preview
```

## Deploy
Git-linked to the existing Netlify project (**canopyseeds.com** / `hilarious-ganache-c6a729`,
team CSLv1). In Netlify: *Project configuration → Build & deploy → Link repository*. Build command
`npm run build`, publish dir `dist` (see `netlify.toml`). Push to `main` → auto-deploy; PRs get
preview URLs. This replaces the old manual Netlify-Drop workflow.

## Brand assets
`public/brand/` (bob-sticker / bob-crest / bob-action) + `public/icon/` (favicon set) — copied from
`bobclaw-app/brand/` (BoB mascot, created 2026-06-19). Do not edit the bobclaw repo; re-copy if updated.

## Source of truth for copy
- Thesis + claims: `../canopy-seed/bob-launch/whitepaper/` + `/build-story/` (ledger-reconciled).
- Existing voice/assets: `bobclaw/docs/marketing/` (Copy Pack, Marketing Plan, PR Brief, Founding Story).
