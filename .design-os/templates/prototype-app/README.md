# Outbound prototype — __FEATURE__

Project: **__SLUG__** · Feature: **__FEATURE__**

This folder is the **outbound** option machine (`design proto`). It is separate from inbound stakeholder HTML in `insights/prototypes/` (`design vibe-check`).

## Brand source

Design system attributes come from the project, not this template:

1. Drop DS markdown in `projects/__SLUG__/context/documents/`
2. Run `design knowledge __SLUG__`
3. Tokens land in `src/tokens.css` and citations in `BRAND.md`

Do not restyle from personal taste. If tokens are placeholders, complete them from `BRAND.md` and re-run `design proto init` on a fresh feature, or edit `tokens.css` with cited values only.

## Options

See `OPTIONS.md`. Each option is a git branch: `proto/__SLUG__/__FEATURE__/<option>`.

```bash
design proto branch create __SLUG__ --feature __FEATURE__ --option alt-a
design proto branch switch __SLUG__ --feature __FEATURE__ --option alt-a
design proto branch list __SLUG__ --feature __FEATURE__
```

## Local run

```bash
cd projects/__SLUG__/prototypes/__FEATURE__
npm install
npm run dev
```

Dev server port: **__PORT__** (see `vite.config.ts`).

## Build

```bash
npm run build
```

## v0-export/

Optional exports from external tools. Not required for the OS workflow.

## Related commands

| Command | Direction | Purpose |
|---------|-----------|---------|
| `design vibe-check` | Inbound | Analyze stakeholder HTML in `insights/prototypes/` |
| `design proto` | Outbound | Branch-scaffolded prototype using DS + PRD |
| `design vibe` | Outbound brief | HTML+Tailwind brief when React is not needed |
