#!/usr/bin/env node

/**
 * Create a new Design OS project.
 * Usage: design init "Project Name"
 */

import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { slugify } from '../lib/slugify.mjs';
import { copyTemplate, getProjectPath, getContextPath, getInsightsPath, getPackageRoot, readFile, writeFile } from '../lib/files.mjs';

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('❌ Error: Please provide a project name.');
  console.error('');
  console.error('Usage: design init "Project Name"');
  console.error('Example: design init "Checkout Redesign"');
  process.exit(1);
}

const projectName = args.join(' ');
const slug = slugify(projectName);

if (!slug) {
  console.error('❌ Error: Invalid project name. Please use letters and numbers.');
  process.exit(1);
}

const projectPath = getProjectPath(slug);

if (existsSync(projectPath)) {
  console.error(`❌ Error: Project "${slug}" already exists.`);
  console.error(`   Path: ${projectPath}`);
  process.exit(1);
}

// Create directory structure
mkdirSync(projectPath, { recursive: true });

const contextPath = getContextPath(slug);
const insightsPath = getInsightsPath(slug);
const transcriptsPath = join(contextPath, 'transcripts');
const userflowsPath = join(contextPath, 'userflows');
const documentsPath = join(contextPath, 'documents');
const snapshotsPath = join(insightsPath, 'snapshots');
const prototypesPath = join(insightsPath, 'prototypes');

mkdirSync(contextPath, { recursive: true });
mkdirSync(insightsPath, { recursive: true });
mkdirSync(transcriptsPath, { recursive: true });
mkdirSync(userflowsPath, { recursive: true });
mkdirSync(documentsPath, { recursive: true });
mkdirSync(snapshotsPath, { recursive: true });
mkdirSync(prototypesPath, { recursive: true });

const meta = {
  projectName: projectName,
  createdDate: new Date().toISOString()
};

// Core templates
const templates = [
  ['brief.template.md', 'brief.md'],
  ['prd.template.md', 'prd.md'],
  ['research.template.md', 'research.md'],
  ['figma.template.md', 'figma.md'],
  ['analytics.template.md', 'analytics.md'],
  ['mentoring.template.md', 'mentoring.md'],
  ['websites.template.md', 'websites.md'],
  ['documents.template.md', 'documents.md'],
  ['artifacts.template.md', 'artifacts.md'],
  ['program-knowledge.template.md', 'program-knowledge.md']
];

for (const [templateName, outputName] of templates) {
  const destPath = join(contextPath, outputName);
  copyTemplate(templateName, destPath, meta);
}

// Transcripts README — naming convention as the guide
const transcriptsReadme = `# Transcripts

Add one file per meeting. Use this naming convention:

  YYYY-MM-DD [meeting-type].md

Examples:
  2026-05-29 kickoff.md
  2026-06-03 daily-standup.md
  2026-06-10 stakeholder-review.md
  2026-06-15 user-interview.md
  2026-06-20 feedback-session.md

---

## Meeting types reference

| Type | When to use |
|------|-------------|
| kickoff | First meeting with client or team |
| daily-standup | Recurring team sync |
| stakeholder-review | Client presenting or reviewing work |
| feedback-session | Structured feedback on deliverables |
| user-interview | Direct session with end users |
| discovery | Exploratory session to understand the problem |
| planning | Sprint or project planning |
| retrospective | Post-mortem or lessons learned |

---

## Template per file

\`\`\`
# [Date] [Meeting type]

**Attendees:** 
**Duration:** 
**Facilitator:** 

## Key points discussed

- 

## Decisions made

- 

## Action items

- [ ] 

## Open questions surfaced

- 

## Verbatim quotes worth keeping

> "[quote]" — [name]
\`\`\`
`;

// Userflows README — explains how to add PNG exports
const userflowsReadme = `# User Flows

Add user flow images exported from Figma as PNG files.

## How to export from Figma

1. Select the flow frame or group in Figma
2. Right click → Export
3. Format: PNG, 2x resolution
4. Save here with a descriptive name

## Naming convention

  [flow-name].png

Examples:
  onboarding-flow.png
  filter-and-search.png
  settings-permissions.png
  checkout-flow.png

## How the agent uses these

When you run \`design review\` or \`design ingest\`, the agent reads
these images alongside the PRD and research to understand the intended
user journey before evaluating the Figma file.

This means the review is grounded in the flow you designed,
not just the screens in isolation.

## Current flows

(Add your PNG exports here)
`;

const documentsReadme = `# Documents

Drop reference materials here: PDFs, exported slides, screenshots, markdown exports.

## Program knowledge (4-layer pattern)

1. **Raw** — copy reference \`.md\` files here
2. **Index** — run \`design knowledge <slug>\` → updates \`context/program-knowledge.md\`
3. **Synthesis** — run \`design knowledge <slug> --agent --synthesize\` → \`insights/evidence-synthesis.md\`
4. **Ingest** — run \`design ingest <slug> --with-knowledge --agent\` → enriches prd/research

## Naming convention

  [descriptive-name].[pdf|png|md]

Examples:
  gc-pulse-survey.md
  program-compendium-jan-2026.md
  designer-onboarding.md

## How to use linked docs (Google Docs, Notion)

1. Export or copy as markdown and save here, OR
2. Paste excerpts into \`context/documents.md\`

## How the agent uses these

- \`design evaluate\` — reads files here + \`documents.md\` excerpts
- \`design ingest\` / \`design review\` — reads here **only if** \`program-knowledge.md\` exists (opt-in)
`;

writeFile(join(transcriptsPath, 'README.md'), transcriptsReadme);
writeFile(join(userflowsPath, 'README.md'), userflowsReadme);
writeFile(join(documentsPath, 'README.md'), documentsReadme);

const prototypesReadmeTemplate = readFile(join(getPackageRoot(), 'templates', 'prototypes-readme.template.md'));
writeFile(
  join(prototypesPath, 'README.md'),
  prototypesReadmeTemplate.replaceAll('{slug}', slug)
);

// Project README
const projectReadme = `# ${projectName}

## Quick start (stakeholder vibe-coded prototype)

1. Save the PM's HTML prototype in \`insights/prototypes/\`
2. Add scoping notes in \`context/transcripts/\` and fill \`context/brief.md\` § Stakeholder Prototype
3. Run: \`design vibe-check ${slug} --agent\`
4. Review \`insights/vibe-check-analysis.md\` — align on 5 questions before Figma work
5. Then: \`design review ${slug} --agent\`

## Quick start (client / Figma work)

1. Fill in \`context/brief.md\` with the project brief and Jira tickets
2. Add your Figma link in \`context/figma.md\`
3. Add user flow PNGs in \`context/userflows/\`
4. Run: \`design ingest ${slug} --agent\`
5. Run: \`design review ${slug} --agent\`

## Quick start (program knowledge — reference documents)

1. Copy reference \`.md\` files to \`context/documents/\`
2. Run: \`design knowledge ${slug} --agent --synthesize\`
3. Run: \`design ingest ${slug} --with-knowledge --agent\`
4. Run: \`design review ${slug} --agent\`

## Quick start (mentoring — websites & documents)

1. Fill in \`context/mentoring.md\` with session goals and student context
2. Add URLs in \`context/websites.md\` and/or excerpts in \`context/documents.md\`
3. Drop PDFs or exports in \`context/documents/\`
4. Run: \`design evaluate ${slug} --agent\`
5. Read \`insights/mentoring-notes.md\` for the session; send \`insights/student-feedback.md\`

## Folder structure

\`\`\`
context/
  brief.md          ← raw inputs (brief + Jira tickets + Tella ID)
  mentoring.md      ← session goals, student level, focus areas
  websites.md       ← live URLs to review
  documents.md      ← pasted doc excerpts + file index
  documents/        ← PDFs, exports, reference MDs
  program-knowledge.md ← doc index (auto via design knowledge)
  artifacts.md      ← optional session checklist
  prd.md            ← generated by ingest (optional for mentoring)
  research.md       ← generated by ingest (optional for mentoring)
  figma.md          ← Figma file link
  analytics.md      ← analytics requirements
  userflows/        ← PNG exports from Figma
  transcripts/      ← meeting notes (YYYY-MM-DD meeting-type.md)
insights/
  prototypes/       ← stakeholder vibe-coded HTML (analyze before design)
  vibe-check-analysis.md
  artifact-review.md
  mentoring-notes.md
  student-feedback.md
  session-log.md
  snapshots/        ← website screenshots from evaluate
  design-review.md
  design-comments.preview.md
  vibe-brief.md
  evidence-synthesis.md  ← constraints + SCQR (via design knowledge --synthesize)
\`\`\`
`;

writeFile(join(projectPath, 'README.md'), projectReadme);

// Success output
console.log('');
console.log(`✅ Created: ${projectName}`);
console.log(`   projects/${slug}/`);
console.log('');
console.log('📁 Structure:');
console.log('   context/');
console.log('     brief.md          ← paste brief + Jira tickets here');
console.log('     mentoring.md      ← session goals (mentoring evaluate)');
console.log('     websites.md       ← live URLs to review');
console.log('     documents.md      ← pasted excerpts + file index');
console.log('     documents/        ← PDFs and reference MDs');
console.log('     program-knowledge.md ← auto-index via design knowledge');
console.log('     figma.md          ← paste Figma link here');
console.log('     userflows/        ← drop PNG exports from Figma here');
console.log('     transcripts/      ← add meetings as YYYY-MM-DD type.md');
console.log('   insights/');
console.log('     prototypes/       ← stakeholder vibe-coded HTML');
console.log('     ← generated outputs');
console.log('');
console.log('📝 Next steps:');
console.log(`   Stakeholder prototype: drop HTML in insights/prototypes/ → design vibe-check ${slug} --agent`);
console.log(`   Client work: fill brief.md → design ingest ${slug} --agent → design review ${slug} --agent`);
console.log(`   Mentoring: fill mentoring.md + websites/documents → design evaluate ${slug} --agent`);
console.log('');
