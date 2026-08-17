# Vibe-Check: {project_name}

Analyze the stakeholder's vibe-coded prototype before any design work begins.

**Framework:** Vibe-Check Framework (Marian Torrealba) — [The UX Sidekick Chronicles](https://uxsidekick.substack.com/p/stop-designing-upon-what-the-pm-vibe)

## Reframe

The prototype is **not a spec**. It is a **brief in disguise** — a mix of real requirements, stakeholder assumptions, and AI hallucinations. Your job is to separate those layers before designing in Figma or writing specs.

## Context (read these files)

### Permanent context (read first)

- context/methodology.md
- context/enterprise-b2b-patterns.md
- context/frameworks.md
{program_knowledge_block}
### Prototype (primary artifact)

{prototype_paths}

Open in Browser MCP or read source directly. Walk the primary user path end-to-end.

### Stakeholder notes

{stakeholder_notes_paths}

### Scope and evidence (read next)

- projects/{slug}/context/prd.md (if present and not empty template)
- projects/{slug}/context/research.md (if present)
- projects/{slug}/insights/evidence-synthesis.md (if exists)
- projects/{slug}/insights/module-map.md (if exists)
- projects/{slug}/insights/prototype-inventory.md (if exists)
- projects/{slug}/insights/design-review.md (if exists — input only, do not copy)

## Phase 1 — Unpack (solo analysis)

Work the **primary user path** first, then note other roles briefly.

### 1a. North Star statements

One sentence per navigable surface: **what is this screen's job?**

For each North Star, add:
- **Stakeholder intent** (from their notes)
- **Prototype execution** (what it actually does)
- Mark misalignments in **bold**

### 1b. Layout anatomy + flags

Per screen, document:
- **Regions** (sidebar, main panel, footer CTA, master-detail, etc.)
- **Primary action** (what the UI pushes the user to do)
- **Flags** — cannot validate from prototype alone:
  - Pre-fill source unknown
  - Routing destinations after approve
  - Delegation behavior
  - Channel indicator (Teams vs tool, etc.)
  - Empty / loading / error states
  - Bulk approve in production

### 1c. Triage matrix

Tag every major UI block:

| Tag | Definition |
|-----|------------|
| **REQ** | Backed by stakeholder notes, PRD, survey, or program evidence |
| **ASSUMP** | Plausible stakeholder thinking, not explicitly scoped |
| **HALL** | No source; likely AI tool filler |
| **FLAG** | Needs stakeholder walkthrough to classify |

Output a block-by-block table: # | UI block | Tag | Basis (cite source)

---

## Phase 2 — The Gaps (stakeholder alignment)

Produce **exactly 5 prioritized questions**. Each must:

1. Name the **prototype element** that triggered it
2. State the **intent vs execution gap**
3. Include a **suggested default** if the stakeholder has no answer
4. Map to the **design decision** it unblocks

Include a **conversation opener** (2–3 sentences, collaborative tone):

> "A prototype is a great way to think out loud, and this one gives us a lot to work with. I've gone through it and sorted what's ready to keep from what we'd validate or leave out. There are five things I'd love to align on so I can shape the MVP with confidence."

---

## Phase 3 — Scale Up (field inventory)

AI handles volume; you handle intention and judgment.

### 3a. Data field inventory

Master table:

| Field / artifact | Screen | Pre-filled? | Editable? | Approve action? | Tag | Consistent label elsewhere? | MVP status |

Group by domain (metadata, proposal, knowledge, compliance, feedback, etc.)

### 3b. Cross-screen consistency check

Flag patterns:
- Approval vocabulary ("Confirm" vs "Approve" vs bulk actions)
- Progress model (step count vs unified process)
- Role surfaces (demo personas vs MVP scope)
- Duplicate concepts across screens
- Missing counterparts (stakeholder says "valuable" but UI absent)

### 3c. Synthesis

Three columns:
- **Keep** — REQ elements worth preserving
- **Remove** — HALL + explicit out-of-scope cuts
- **Redesign** — ASSUMP + misaligned REQ

Optional appendix: tag counts per screen.

---

## Stakeholder narrative (SCQR)

At the top of the output, write a **SCQR narrative** (Situation, Complication, Question, Resolution):
- Collaborative expert-review tone — not confrontational
- Do not use "brief in disguise" or "hallucination" in stakeholder-facing prose; use Keep / Validate / Clarify / Out of scope language in the walkthrough

---

## Output (write to this file)

**projects/{slug}/insights/vibe-check-analysis.md**

Follow the structure in:
`.design-os/templates/vibe-check-analysis.template.md`

## Rules

Read `.cursor/rules/design-os.mdc` for full guidelines (STEP 1c — VIBE-CHECK).

Key requirements:
1. Review intent, not pixels
2. Write only to the insights folder
3. Every recommendation must cite a source — never invent metrics or fields
4. Complement (do not replace) `design-review.md` if it exists
5. Do not start Figma or spec work — this analysis is the gate before design
6. Open prototype in Browser MCP when HTML; parse source for field inventory
