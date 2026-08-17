# Adonay Design OS

**Adonay Lizardo**

A daily design machine for Cursor. Reviews intent, not pixels. Diagnoses before prescribing.

This is a **from-zero starter**. No client projects, no mentee folders, no vendor design systems. You clone it, link the CLI, and run `design init "Name"` to create a full project — including mentoring templates.

## What it does

| Command | Purpose |
|---------|---------|
| `design init "Name"` | Scaffold a project under `projects/` |
| `design ingest <slug>` | Generate PRD + research from a brief |
| `design knowledge <slug>` | Index reference docs to program-knowledge |
| `design review <slug>` | Figma design review prompts |
| `design evaluate <slug>` | Mentoring: websites, docs, portfolios |
| `design vibe-check <slug>` | Analyze a stakeholder vibe-coded prototype |
| `design vibe <slug>` | Generate a vibe prototype brief |
| `design comment <slug>` | Post review comments to Figma |
| `design doctor` | Check workspace + templates |
| `design proto` | Not included in this starter |

## Setup


See the clone URL on GitHub. Then install, link the CLI, and run design doctor.
Node 18+ required. You can also run node .design-os/bin/design.js without linking.
For design comment, copy the example env file and add a Figma access token.
Telemetry is off by default.


## Daily workflow

1. design init "Checkout Redesign"
2. Fill projects/checkout-redesign/context/brief.md
3. design ingest checkout-redesign --agent
4. design review checkout-redesign --agent
5. design vibe checkout-redesign
6. design comment checkout-redesign --dry-run

--agent runs Cursor Agent after the prompt is generated.
Without it, open the prompt in insights/prompts/ and run Agent yourself.

## Mentoring quick start

Use design evaluate when the artifact is a website, PDF, portfolio, or case study.

Example with a fictional student:

    design init "Mentoring Alex Rivera"
    design evaluate mentoring-alex-rivera --agent

Fill mentoring.md, websites.md, and/or documents.md first.
Outputs: artifact-review.md, mentoring-notes.md, student-feedback.md, session-log.md.
Send student-feedback.md as-is; keep mentoring-notes.md internal.
Mentoring patterns live in context/mentoring-patterns.md. No real mentee data is included.


## Permanent context

Always-on files in context/:

- methodology.md — diagnosis before prescription
- enterprise-b2b-patterns.md — B2B states and edge cases
- frameworks.md — framework selection protocol
- mentoring-patterns.md — evaluate tone and dual-output contract

Cursor rule: .cursor/rules/design-os.mdc (applies when you work under projects/).

## Starter notes

- projects/ is empty on purpose (only .gitkeep). Your work stays local and is gitignored.
- Vendor prototype scaffolds are not included. design proto explains that and exits cleanly.
- This is Adonay Lizardo's operating system for IC design work and mentoring.

## License

MIT. Copyright Adonay Lizardo. See LICENSE and NOTICE.
