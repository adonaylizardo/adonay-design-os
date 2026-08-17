# Mentoring Patterns

Guidance for artifact review during mentoring sessions — websites, documents, portfolios, and case studies.

---

## Feedback framing

- **Specific over generic** — cite the page, section, or screenshot; avoid "make it pop"
- **Question over verdict** — "What do you want the reader to do after this section?" beats "This is wrong"
- **Growth over gatekeeping** — name the next skill to build, not just what's missing
- **Evidence-linked** — every observation ties to something in the artifact
- **Diagnosis before prescription** — same as client work; mentoring is not softer, it's more developmental

---

## Common review types

| Type | Primary artifacts | Focus areas |
|------|-------------------|-------------|
| Portfolio site | `websites.md` | IA, hierarchy, case study framing, hiring narrative, CTA clarity |
| Case study doc | `documents.md`, PDFs | Problem framing, process visibility, outcomes, storytelling arc |
| Research write-up | `documents.md` | Method rigor, insight quality, implications for design |
| Live product / prototype | `websites.md`, optional `figma.md` | Flow, states, accessibility, intent vs execution |
| Mixed session | websites + documents + Figma | Prioritize via `artifacts.md`; don't try to cover everything equally |

---

## When to recommend which artifact

| Situation | Recommend |
|-----------|-----------|
| Student needs to show process to hiring managers | Written case study doc + portfolio page that summarizes it |
| Interaction or flow is the question | Live URL or Figma prototype — not a static PDF |
| Visual craft or layout is the question | Figma or live site with screenshots at multiple breakpoints |
| Research or strategy is the question | Document with pasted excerpts — avoid reviewing only a link |
| Student shared a Google Doc / Notion link | Paste excerpts into `documents.md` or export PDF to `documents/` |

---

## Dual output contract

Every evaluate run produces two voices:

### mentoring-notes.md (internal)
- Probing questions for the live call
- What to hold back until next session
- Skill tags for tracking growth over `session-log.md`

### student-feedback.md (send as-is)
- Warm, plain language
- 2–3 strengths, 2–3 prioritized improvements with concrete next steps
- Optional SCQR block at bottom for framing the conversation

Never copy mentoring-notes verbatim into student-feedback.

---

## Content integrity

- **Never invent content** from source links that weren't pasted or exported locally
- If an excerpt is missing, say so in the review and skip that artifact
- If a website requires auth and credentials aren't in `websites.md`, note the blocker — don't guess what's behind login

---

## Session continuity

- Append each evaluate run to `insights/session-log.md`
- Reference prior session themes from `transcripts/` and previous log entries
- Callback to `mentoring.md` → "Prior session callbacks" when present

---

*Used by `design evaluate` — read alongside methodology.md and frameworks.md*
