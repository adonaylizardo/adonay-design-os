# Adonay's Design Methodology

## Core Principle: Diagnosis Before Prescription

Never propose a solution before understanding the real problem.
This is the line between an executor and a consultant.

An executor receives a brief and builds what's described.
A consultant receives a brief, asks what problem it actually solves, and then builds the right thing.

## The Consultant Questions

Before touching any tool, ask:
1. What is the user's actual goal? (not the stated feature request)
2. What is the business's actual goal? (not the stated deliverable)
3. What assumptions are being made that haven't been tested?
4. What would failure look like — and how would we know?

## On Enterprise B2B UX

Enterprise users are not the same as consumer users.
- They use the product because they have to, not because they want to
- Their success metric is "I didn't make a mistake today"
- Error states matter more than delight
- Efficiency > Discovery
- Consistency > Novelty

## On Stakeholder Communication

Design reviews with stakeholders are not presentations — they are negotiations.
The designer's job is to:
1. Make the problem legible (not the solution)
2. Show what the current design assumes
3. Propose a test before a decision

## On Zero-Budget Testing

Expensive research is better than cheap research. Cheap research is better than no research.
When there's no budget for testing, use:
- 3 internal employees who match the user profile (guerrilla)
- A Figma prototype link shared in Slack with one specific question
- A 5-second test screenshot on Maze free tier
- A Loom walkthrough asking stakeholders to respond async

The goal is not statistical significance. It's directional signal before committing to build.

## On Vibecoding Prototypes

A vibe prototype is not a deliverable. It's a thinking tool.

**Inbound (PM/stakeholder → designer):** When a PM shares a vibe-coded prototype, run `design vibe-check <slug> --agent` before any Figma or spec work. The prototype is a brief in disguise — triage requirements, assumptions, and AI filler first (Vibe-Check Framework, Marian Torrealba).

**Outbound (designer → validation):** Use vibe coding to test interaction logic, show stakeholders a realistic experience, and validate assumptions before the design review.

Use it to:
- Test if the interaction logic makes sense before designing it
- Show stakeholders a realistic experience, not a Figma prototype
- Validate assumptions before the design review

Once validated, the vibe prototype feeds into Figma — not the other way around.
Figma is for polish and handoff. Cursor/Claude Code is for thinking.

## On AI in the Design Workflow

AI writes v1. Judgment writes v2 through v10.
The replicable skill is not the prompt — it's knowing what to ask and what to reject.
Use AI to:
- Generate the first draft of a PRD or research synthesis
- Surface edge cases you haven't considered
- Write the vibe prototype fast
- Propose zero-budget test scripts

Never use AI to:
- Replace stakeholder conversations
- Skip the diagnosis step
- Validate assumptions it has no data on
