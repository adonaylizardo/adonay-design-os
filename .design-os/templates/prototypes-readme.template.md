# Stakeholder Prototypes

Drop vibe-coded prototypes shared by PMs or stakeholders here before starting design work.

## What goes here

- HTML prototypes (`.html`) — open directly in a browser, no build step
- Links documented in `context/brief.md` § Stakeholder Prototype (download and save locally when possible)
- Optional: `prototype-inventory.md` in `insights/` for screen → step → MVP status

## How to open

```bash
open "projects/{slug}/insights/prototypes/your-prototype.html"
```

Or drag the file into Chrome / Safari. Use Browser MCP in Cursor for agent analysis.

## Required workflow

**Before Figma or spec work**, run:

```bash
design vibe-check {slug} --agent
```

This generates `insights/vibe-check-analysis.md` — separating real requirements, stakeholder assumptions, and AI filler (Vibe-Check Framework, Marian Torrealba).

## Stakeholder notes

Pair every prototype with scoping notes in `context/transcripts/` (e.g. `YYYY-MM-DD stakeholder-prototype-notes.md`).

## Related outputs

| Artifact | Purpose |
|----------|---------|
| `insights/vibe-check-analysis.md` | Full analysis (Phases 1–3 + SCQR) |
| `insights/design-review.md` | Figma review vs PRD (separate, later) |
| `insights/module-map.md` | MVP / coming soon / out of scope |
