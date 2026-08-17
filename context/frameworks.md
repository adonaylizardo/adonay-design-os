# UX & Consulting Frameworks Reference

> This file is loaded as permanent context by the Design OS agent.
> Frameworks are NOT applied automatically — the agent must diagnose the problem type first,
> then propose which framework fits, and wait for Adonay's approval before using it.
>
> EXCEPTION: SCQR is the default framework for client-facing design rationale.
> EXCEPTION: Vibe-Check applies automatically when a stakeholder prototype exists in insights/prototypes/.
> It is applied automatically whenever generating stakeholder presentations or proposal documents.

---

## FRAMEWORK SELECTION PROTOCOL

Before applying any framework, the agent must:

1. **Diagnose the problem type** — what kind of question are we trying to answer?
2. **Propose 2–3 candidate frameworks** with a one-line rationale for each
3. **Wait for Adonay's approval** before proceeding
4. **Apply only the approved framework** — do not mix frameworks in one output

### Problem type → Framework candidates

| Problem type | Primary candidate | Alternative | Skip |
|---|---|---|---|
| "Why do users do X?" / motivation unclear | JTBD | Mental Models | Design Thinking |
| "What should we design?" / blank slate | Design Thinking (HCD) | JTBD | SCQR |
| "How do we present this to a stakeholder?" | SCQR (auto) | Pyramid Principle | — |
| "Is this the right solution?" / validation | Jobs-to-be-Done + Assumption Mapping | Five Whys | — |
| "Users aren't adopting the feature" | JTBD | Behavior Change (COM-B) | Design Thinking |
| "We have too many features to prioritize" | RICE + Opportunity Scoring | Kano Model | — |
| "The flow is confusing but we don't know why" | Cognitive Walkthrough | Task Analysis | Design Thinking |
| "Stakeholders disagree on the direction" | SCQR + Assumption Mapping | — | JTBD |
| "PM/stakeholder shared a vibe-coded prototype" | Vibe-Check (Marian Torrealba) | — | Design review |
| "We need to understand the user's world" | Mental Models | Contextual Inquiry | JTBD |
| "The business metric isn't moving" | Outcome-driven thinking (ODT) | Pirate Metrics | Design Thinking |

---

## THE FRAMEWORKS

---

### 1. Jobs to Be Done (JTBD)
**When:** The team is solving the wrong problem because they're focused on the feature, not the user's underlying motivation.
**Core question:** What progress is the user trying to make in their life or work?

**Structure:**
- **Functional job** — the practical task (e.g., "track my team's project status")
- **Emotional job** — how they want to feel (e.g., "feel in control without micromanaging")
- **Social job** — how they want to be perceived (e.g., "look like a competent manager to leadership")
- **Job statement format:** When [situation], I want to [motivation], so I can [expected outcome]

**Application in design review:**
- Reframe each user story as a job statement
- Identify which jobs the current design serves vs. ignores
- Surface emotional and social jobs that the UI doesn't acknowledge

**Red flag that JTBD is needed:** User stories that start with "As a user, I want to click..." (feature-centric, not job-centric)

---

### 2. SCQR — Situation, Complication, Question, Resolution
**When:** Always — for client-facing design rationale, stakeholder presentations, and proposal documents.
**DEFAULT for:** Any output that will be shown to a client or presented in a review meeting.
**Core idea:** Humans process information as a story. SCQR is the minimal story structure that moves someone from "I don't understand why" to "I agree with this decision."

**Structure:**
- **Situation** — what is true today that everyone agrees on (neutral, factual, uncontested)
- **Complication** — what changed or what tension exists that makes the situation unstable
- **Question** — the question the complication naturally raises (usually implied, sometimes explicit)
- **Resolution** — the design decision that answers the question

**Rules:**
- Situation must be something the client already knows and agrees with — no new information here
- Complication is where you introduce the insight or the problem — this is the hook
- Question is often left implicit but must be answerable by the Resolution
- Resolution is your design recommendation — specific, not vague

**Example (Enterprise B2B dashboard):**
- S: "Your operations team currently reviews performance data in weekly spreadsheet exports."
- C: "As the team has grown from 8 to 34 people, the export process takes 4 hours per week and the data is always 5 days old when decisions are made."
- Q: "How do we give the team access to current data without adding process overhead?"
- R: "A live dashboard with role-based views eliminates the export cycle and surfaces the 3 metrics each role actually needs."

**When NOT to use SCQR:** Internal team working sessions where the goal is divergent thinking, not alignment.

---

### 3. Vibe-Check Framework (Marian Torrealba)
**When:** A PM or stakeholder shares a vibe-coded prototype and the team is tempted to design directly from it.
**DEFAULT for:** Any inbound stakeholder prototype in `insights/prototypes/` — run before Figma or spec work.
**Source:** [The UX Sidekick Chronicles — Stop Designing Upon What the PM Vibe-Coded](https://uxsidekick.substack.com/p/stop-designing-upon-what-the-pm-vibe)
**Core idea:** The prototype is a brief in disguise — a mix of real requirements, stakeholder assumptions, and AI hallucinations. Separate those layers before designing.

**Three phases:**
1. **Unpack** — North Star per screen, layout anatomy, triage tags (REQ / ASSUMP / HALL / FLAG)
2. **Gaps** — 5 prioritized questions aligning stakeholder intent vs prototype execution
3. **Scale Up** — Data field inventory, cross-screen consistency, Keep / Remove / Redesign synthesis

**Triage tags:**

| Tag | Definition |
|-----|------------|
| **REQ** | Backed by stakeholder notes, PRD, survey, or program evidence |
| **ASSUMP** | Plausible stakeholder thinking, not explicitly scoped |
| **HALL** | No source; likely AI tool filler |
| **FLAG** | Needs stakeholder walkthrough to classify |

**Application in this OS:**
- Maps to `design vibe-check <slug> --agent` → `insights/vibe-check-analysis.md`
- Stakeholder-facing summary uses SCQR + Keep / Validate / Clarify / Out of scope (collaborative tone)
- Complements `design-review.md`; does not replace it

**When NOT to use:** Designer-built prototypes (`design vibe` output) — those follow review-and-validate, not inbound triage.

---

### 4. Design Thinking (HCD — Human-Centered Design)
**When:** The problem space is genuinely unknown. The team is designing something new, not improving something existing.
**Phases:** Empathize → Define → Ideate → Prototype → Test

**Application in this OS:**
- **Empathize** → maps to `research.md` generation from transcripts and briefs
- **Define** → maps to problem statement in `prd.md` (one crisp sentence)
- **Ideate** → maps to the vibe brief (divergent prototyping before converging)
- **Prototype** → maps to `design vibe` command
- **Test** → maps to zero-budget testing section in `design-review.md`

**Warning:** Design Thinking is a discovery framework, not a delivery framework. Don't apply it to a defined feature with existing constraints — it will generate scope creep.

---

### 5. Mental Models
**When:** Users are confused by the current design because the UI's model doesn't match how they think about their work.
**Core idea:** Every user has a mental model of how something works. When the UI's model diverges from the user's model, friction appears.

**Application:**
- Map what the user thinks the system does (from research transcripts)
- Map what the system actually does (from PRD + Figma review)
- Identify the gaps — those gaps are the root cause of confusion

**Output:** A two-column comparison: "User thinks..." vs "System does..." — each gap becomes a design recommendation.

---

### 6. Assumption Mapping
**When:** The team has a solution but hasn't examined what must be true for it to work.
**Pairs well with:** JTBD (to validate job statements), Business Assumptions section of design review.

**2x2 grid:**
- **X axis:** Evidence (low → high)
- **Y axis:** Importance (low → high)

**Quadrants:**
- High importance + Low evidence = **Test immediately** (these can kill the product)
- High importance + High evidence = **Proceed with confidence**
- Low importance + Low evidence = **Deprioritize**
- Low importance + High evidence = **Monitor**

**Application in design review:**
- Take business assumptions table from `prd.md`
- Plot each assumption on the grid
- The top-right quadrant (high importance, low evidence) drives the zero-budget testing plan

---

### 7. Cognitive Walkthrough
**When:** A flow exists but users are dropping off or making errors, and you don't know why.
**Core question:** At each step, can the user figure out what to do next using only what's visible on the screen?

**Four questions per step:**
1. Will the user know they need to take this action?
2. Will the user notice the control that enables the action?
3. Will the user understand that the control will achieve the desired effect?
4. Will the user get appropriate feedback after taking the action?

**Application:** Walk the happy path from `prd.md` step by step. For each step, answer the four questions based on what's visible in the Figma design. Any "no" or "maybe" is a design gap.

---

### 8. RICE Prioritization
**When:** There are more features or fixes than capacity, and prioritization is contested.
**Formula:** (Reach × Impact × Confidence) / Effort

- **Reach:** How many users affected per time period?
- **Impact:** How much does this move the needle? (0.25 = minimal, 0.5 = low, 1 = medium, 2 = high, 3 = massive)
- **Confidence:** How sure are you about reach and impact? (100% = high, 80% = medium, 50% = low)
- **Effort:** Person-weeks of work

**Output:** A ranked list with scores. Use to facilitate — not replace — prioritization conversations.

---

### 9. Kano Model
**When:** Deciding which features to include in a release, especially when there's disagreement about what "good" looks like.

**Categories:**
- **Must-be (Basic):** Users expect this. Its absence causes dissatisfaction; its presence is neutral.
- **Performance (Linear):** More of this = more satisfaction. Users can articulate this.
- **Delighters (Excitement):** Unexpected features that create disproportionate satisfaction. Users can't ask for these because they don't know to.
- **Indifferent:** Users don't care either way.
- **Reverse:** Some users actively dislike this.

**Application:** Map each proposed feature to a Kano category before the design review. Focus design effort on Must-be (first) and Performance (second). Delighters are a bonus, not a strategy.

---

### 10. COM-B Behavior Change Model
**When:** Users have the feature available but aren't using it. Adoption is the problem, not discoverability.

**Three components of behavior:**
- **Capability** — does the user know how to do it? (psychological: knowledge / physical: motor skills)
- **Opportunity** — does the environment allow it? (physical: time, tools / social: norms, expectations)
- **Motivation** — does the user want to do it? (reflective: goals, beliefs / automatic: habits, emotions)

**Application:** For each behavior you want to drive, diagnose which component is blocking it. Design interventions target the right lever — education for capability gaps, friction reduction for opportunity gaps, incentives for motivation gaps.

---

### 11. Outcome-Driven Design (ODT) / Opportunity Scoring
**When:** The product has many features but the core business metric isn't moving. What to build next?

**Process:**
1. Identify the jobs users are trying to do (JTBD)
2. For each job, ask users: How important is this? How satisfied are you today?
3. **Opportunity score = Importance + max(Importance - Satisfaction, 0)**
4. High importance + low satisfaction = highest opportunity

**Application:** Use satisfaction scores from research transcripts + importance implied by business goals. Output is a ranked list of design opportunities sorted by score.

---

## AGENT BEHAVIOR RULES

```
RULE 1: Never apply a framework without proposing it first.
Format:
  "Based on [what I see in the brief/review], the problem type is [diagnosis].
   I'd suggest using [Framework A] because [one-line reason].
   Alternative: [Framework B] if [condition].
   Shall I proceed with [Framework A]?"

RULE 2: SCQR and Vibe-Check are exceptions — apply automatically without asking first.
  SCQR → any client-facing output (stakeholder brief, proposal narrative, presentation rationale).
  Vibe-Check → any inbound stakeholder prototype in insights/prototypes/ (run design vibe-check before Figma work).

RULE 3: Never mix frameworks in one output.
  If JTBD is approved for the PRD, don't introduce Kano in the same document.
  Each output uses one framework, applied consistently.

RULE 4: After framework is approved, show your work.
  Don't just apply it silently. Show the framework structure with the actual content
  so Adonay can verify the reasoning before the output is finalized.

RULE 5: If the problem doesn't fit any framework clearly, say so.
  "The brief is ambiguous about whether this is a motivation problem or a
   discoverability problem. Can you clarify X before I suggest a framework?"
```
