# Adonay Design OS

**Adonay Lizardo**

A daily design machine for Cursor. It reviews intent, not pixels. It diagnoses before it prescribes.

Most designers do not lack tools. They lack a repeatable way to think under pressure. Briefs arrive half-true. Stakeholders send vibe-coded prototypes. Reviews turn into taste arguments. Mentoring becomes generic advice. This OS is the opposite of that week: one workspace, one methodology, commands that force the right question before anyone opens Figma.

This repo is a **from-zero starter**. No client projects, no mentee folders, no vendor design systems. Clone it, link the CLI, run `design init "Name"`. You get a full project, including mentoring templates.

## What changes if you run this

You stop being the person who "makes the screens." You become the person who can name the real problem in the room.

- **Mornings get a ritual.** A new piece of work is a project, not a Slack thread. Brief in, diagnosis out, then design.
- **Reviews get sharper.** Comments land on the frame that is wrong, with a reason, not "can we make this pop."
- **Stakeholders get cheaper tests.** Before a big build, you already have a zero-budget way to see if the assumption is real.
- **AI stays in its lane.** It writes v1. Your judgment writes v2 through v10. The OS decides what to ask and what to reject.
- **Mentoring stops being vibes.** A student leaves with a file they can act on. You keep the notes they should not see.

The impact is not more files. It is fewer wasted cycles: fewer pixel debates, fewer rebuilds after a late "that's not what we meant," fewer mentees who nod and change nothing.

## Who it is for

- Product designers and ICs in enterprise B2B who have to defend decisions, not just ship mockups
- Design leads who review other people's Figma and want comments that teach
- Mentors and academy instructors who review portfolios, case studies, and live sites
- Anyone using Cursor who wants the agent to follow a methodology, not invent one every chat

If you want a Figma plugin that restyles frames, this is not that. If you want a consultant sitting next to you in Cursor, this is.

## How a week feels

**Monday.** A PM drops a one-pager and a vibe-coded checkout. You init a project, paste the brief, run ingest. The OS writes a PRD and research notes that name the user goal, the business goal, and the untested assumptions. You have not drawn anything yet. That is the point.

**Tuesday.** You run a vibe-check on the PM's prototype before you open Figma. You learn what is a real requirement, what is an assumption, and what is AI filler. Then you design the right thing, not the thing in the HTML.

**Wednesday.** The file is in review. `design review` reads the Figma against the PRD. You get a short list of comments, pinned to node ids, each with a why. You dry-run them, then post. The designer on the other side sees intent, not taste.

**Thursday.** A mentee, Alex Rivera, sends a portfolio. You init a mentoring project, fill the artifact links, run evaluate. You send `student-feedback.md` as-is. You keep `mentoring-notes.md` for yourself. Next session starts from a log, not from memory.

**Friday.** `design doctor` tells you the machine is still healthy. You did not invent a new process this week. You ran the one you already trust.

## Use cases

### 1. A messy product brief
A stakeholder asks for "a better dashboard." You put the brief in `context/brief.md` and run `design ingest`. The output is not a layout. It is a diagnosis: who is trying not to make a mistake, what the business thinks success is, which assumptions have never been tested. You walk into the next meeting with questions, not screens.

### 2. A Figma file that looks done and is not
The visual craft is fine. The empty, error, and permission states are missing. `design review` reads the file against the PRD and enterprise B2B patterns, then drafts at most ten comments pinned to real nodes. `design comment --dry-run` shows them. When you post, the conversation is about failure cases, not spacing.

### 3. A vibe-coded prototype that showed up too early
A PM built something in an AI canvas and wants it "cleaned up in Figma." You run `design vibe-check` first. The OS separates signal from demo-ware. You only move to Figma once the interaction logic is the thing you actually want to polish.

### 4. Mentoring a designer without a Figma file
Alex Rivera shares a live portfolio and a case-study PDF. `design evaluate` reviews the artifact, not the person. They get specific, page-level feedback. You get an internal note on the skill to build next. Same methodology as client work, pointed at growth.

### 5. Teaching a team to think the same way
The OS is the shared brain: methodology, B2B patterns, framework selection, mentoring tone. New people clone the starter. They do not inherit your clients. They inherit how you decide.

## Daily commands

| Command | What it is for |
|---------|----------------|
| `design init "Name"` | Start a project under `projects/` |
| `design ingest <slug>` | Turn a brief into PRD + research |
| `design knowledge <slug>` | Index reference docs into program knowledge |
| `design review <slug>` | Review a Figma file against intent |
| `design evaluate <slug>` | Mentor on websites, docs, portfolios |
| `design vibe-check <slug>` | Triage a stakeholder vibe prototype |
| `design vibe <slug>` | Write a vibe prototype brief |
| `design comment <slug>` | Post the review comments to Figma |
| `design doctor` | Check the workspace and templates |
| `design proto` | Not included in this starter |

`--agent` runs Cursor Agent after the prompt is generated. Without it, open the prompt in `insights/prompts/` and run Agent yourself.

## Setup

You need Node 18+. Clone this repo, then:

```bash
npm install
npm link
design doctor
```

Or run without linking:

```bash
node .design-os/bin/design.js doctor
```

For Figma comments, copy `.env.example` to `.env` and add a Figma access token (https://www.figma.com/developers/api#access-tokens). Telemetry is off unless you turn it on.

A first project:

```bash
design init "Checkout Redesign"
# fill projects/checkout-redesign/context/brief.md
design ingest checkout-redesign --agent
design review checkout-redesign --agent
design comment checkout-redesign --dry-run
```

A first mentee (fictional example):

```bash
design init "Mentoring Alex Rivera"
# fill mentoring.md, websites.md, and/or documents.md
design evaluate mentoring-alex-rivera --agent
```

Send `student-feedback.md`. Keep `mentoring-notes.md` internal.

## What stays on in the background

These files shape every output. They are not optional flavor text.

- `context/methodology.md` — diagnosis before prescription
- `context/enterprise-b2b-patterns.md` — states and edge cases for B2B
- `context/frameworks.md` — pick a framework for the problem, not the habit
- `context/mentoring-patterns.md` — evaluate tone and the dual-output contract

Cursor reads `.cursor/rules/design-os.mdc` when you work under `projects/`.

`projects/` is empty on purpose (only `.gitkeep`). Your real work stays local and is gitignored. Vendor prototype scaffolds are not in this starter.

## Feedback

Share how it went in [Discussions](https://github.com/adonaylizardo/adonay-design-os/discussions).

Ask for a change, or report something broken, in [Issues](https://github.com/adonaylizardo/adonay-design-os/issues).

## License

MIT. Copyright Adonay Lizardo. See LICENSE and NOTICE.
