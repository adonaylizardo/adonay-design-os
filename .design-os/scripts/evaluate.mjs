#!/usr/bin/env node

/**
 * Generate artifact evaluation prompts for Cursor Agent (mentoring workflow).
 * Usage: design evaluate [project-slug]
 *        design evaluate all
 */

import { join } from 'path';
import { mkdirSync, existsSync, readdirSync } from 'fs';
import {
  readFile, writeFile, listProjectDirs, getContextPath, getInsightsPath,
  projectExists
} from '../lib/files.mjs';
import { selectProject } from '../lib/prompt.mjs';

function extractProjectName(content) {
  const match = content && content.match(/^Project:\s*(.+)$/m);
  return match ? match[1].trim() : null;
}

function listDocumentFiles(documentsPath) {
  if (!existsSync(documentsPath)) return [];
  return readdirSync(documentsPath).filter(
    (f) => f !== 'README.md' && !f.startsWith('.')
  );
}

function hasRealFigmaUrls(figmaContent) {
  if (!figmaContent) return false;
  return figmaContent.includes('figma.com/design/') &&
    !figmaContent.match(/\(paste|\(optional\)|FILE_KEY|XXX-YYY/i);
}

function generatePrompt(projectName, slug, options) {
  const { hasFigma, documentFiles } = options;

  const figmaSection = hasFigma ? `
## Optional Figma Analysis

If \`projects/${slug}/context/figma.md\` contains valid Figma URLs:
1. Use Figma MCP \`get_metadata\` and \`get_design_context\` on key screens
2. Include Figma findings in artifact-review.md where relevant
` : '';

  const documentList = documentFiles.length
    ? documentFiles.map((f) => `- context/documents/${f}`).join('\n')
    : '*No local files in context/documents/*';

  return `# Evaluate: ${projectName}

Review websites, documents, and other artifacts for a mentoring session.

## Permanent context (read first)

- context/methodology.md
- context/mentoring-patterns.md
- context/frameworks.md

## Project context (read in priority order)

1. projects/${slug}/context/mentoring.md — session goals, student level, focus
2. projects/${slug}/context/brief.md — additional background if filled
3. projects/${slug}/context/artifacts.md — optional session checklist
4. projects/${slug}/context/websites.md — live URLs to review
5. projects/${slug}/context/documents.md — pasted excerpts + file index
6. Local files in projects/${slug}/context/documents/:
${documentList}
7. projects/${slug}/context/transcripts/ — prior session notes (all .md files, sorted by date)
8. projects/${slug}/context/prd.md — **if present and not empty template**
9. projects/${slug}/context/research.md — **if present and not empty template**
10. projects/${slug}/context/figma.md — **if present with real URLs**

**Ingest is optional.** Do not require prd.md or research.md for mentoring evaluate.

## Website Analysis (when websites.md has valid URLs)

**You MUST use Browser MCP for each valid URL:**

1. Read \`projects/${slug}/context/websites.md\` for URLs, viewport, and review focus
2. Skip placeholder or empty URLs
3. For each page: \`browser_navigate\` → \`browser_snapshot\` → \`browser_take_screenshot\`
4. Save screenshots to \`projects/${slug}/insights/snapshots/YYYY-MM-DD-[page-slug].png\`
5. Reference screenshot paths in outputs

## Document Analysis

1. Read pasted excerpts in \`documents.md\` — **never invent content** from source links that weren't pasted
2. Read all files listed in the documents table and files in \`context/documents/\`
3. Use vision for PDFs and images
${figmaSection}
## Output (write to these files)

1. **projects/${slug}/insights/artifact-review.md** — Follow:
   \`.design-os/templates/artifact-review.template.md\`

2. **projects/${slug}/insights/mentoring-notes.md** — Follow:
   \`.design-os/templates/mentoring-notes.template.md\`
   Internal only — probing questions, what to hold back, skill tags.

3. **projects/${slug}/insights/student-feedback.md** — Follow:
   \`.design-os/templates/student-feedback.template.md\`
   Student-ready tone — send as-is via email/Slack/Loom.

4. **projects/${slug}/insights/session-log.md** — Append a new dated entry at the top (below the header).
   If the file does not exist, create it from \`.design-os/templates/session-log.template.md\` first.
   Format:
   \`\`\`
   ## YYYY-MM-DD — [session title from mentoring.md]
   **Artifacts:** [what was reviewed]
   **Top themes:** [2-3 skill areas]
   **Follow-ups for next session:** [bullets]
   **Link:** student-feedback.md
   \`\`\`

## Rules

Read \`.cursor/rules/design-os.mdc\` for full guidelines (STEP 1b — EVALUATE).

Key requirements:
1. Diagnosis before prescription — growth-oriented, evidence-based mentoring tone
2. Write only to the insights folder (and snapshots subfolder)
3. Every observation traces to a specific artifact, page, or excerpt
4. Produce both mentor depth (artifact-review + mentoring-notes) and student-ready feedback
5. Do not require Figma unless figma.md has real URLs
`;
}

function generateContext(artifacts, projectName, slug, documentFiles) {
  const {
    mentoring, brief, artifactsMd, websites, documents, figma,
    prd, research
  } = artifacts;
  const date = new Date().toISOString();

  return `# Evaluate Context: ${projectName}

Generated: ${date}
Slug: ${slug}

---

## Mentoring Session

${mentoring ? mentoring.slice(0, 2000) : '*No mentoring.md found — read brief.md for context*'}

---

## Brief (excerpt)

${brief ? brief.slice(0, 1500) : '*No brief.md found*'}

---

## Artifacts Index

${artifactsMd || '*No artifacts.md — review all filled context files*'}

---

## Websites

${websites || '*No websites.md found*'}

---

## Documents

${documents ? documents.slice(0, 3000) : '*No documents.md found*'}

---

## Local files (context/documents/)

${documentFiles.length ? documentFiles.map((f) => `- ${f}`).join('\n') : '*No files in documents/*'}

---

## PRD (optional)

${prd ? prd.slice(0, 1500) : '*Not used — ingest optional for evaluate*'}

---

## Research (optional)

${research ? research.slice(0, 1000) : '*Not used — ingest optional for evaluate*'}

---

## Figma (optional)

${figma || '*No figma.md or not used for this evaluate run*'}
`;
}

function evaluateProject(slug) {
  if (!projectExists(slug)) {
    console.error(`❌ Error: Project "${slug}" not found.`);
    console.error('');
    console.error('Available projects:');
    listProjectDirs().forEach((p) => console.error(`   - ${p}`));
    return false;
  }

  const contextPath = getContextPath(slug);
  const insightsPath = getInsightsPath(slug);
  const promptsPath = join(insightsPath, 'prompts');
  const documentsPath = join(contextPath, 'documents');
  const snapshotsPath = join(insightsPath, 'snapshots');

  if (!existsSync(promptsPath)) {
    mkdirSync(promptsPath, { recursive: true });
  }
  if (!existsSync(snapshotsPath)) {
    mkdirSync(snapshotsPath, { recursive: true });
  }

  const artifacts = {
    mentoring: readFile(join(contextPath, 'mentoring.md')),
    brief: readFile(join(contextPath, 'brief.md')),
    artifactsMd: readFile(join(contextPath, 'artifacts.md')),
    websites: readFile(join(contextPath, 'websites.md')),
    documents: readFile(join(contextPath, 'documents.md')),
    figma: readFile(join(contextPath, 'figma.md')),
    prd: readFile(join(contextPath, 'prd.md')),
    research: readFile(join(contextPath, 'research.md'))
  };

  const documentFiles = listDocumentFiles(documentsPath);
  const projectName =
    extractProjectName(artifacts.mentoring) ||
    extractProjectName(artifacts.prd) ||
    extractProjectName(artifacts.brief) ||
    slug;

  const promptContent = generatePrompt(projectName, slug, {
    hasFigma: hasRealFigmaUrls(artifacts.figma),
    documentFiles
  });
  const contextContent = generateContext(artifacts, projectName, slug, documentFiles);

  writeFile(join(promptsPath, '_evaluate_prompt.md'), promptContent);
  writeFile(join(promptsPath, '_evaluate_context.md'), contextContent);

  console.log(`✅ ${slug}`);
  console.log('   → insights/prompts/_evaluate_prompt.md');
  console.log('   → insights/prompts/_evaluate_context.md');

  return true;
}

async function getTargetSlug(args) {
  if (args.length > 0) return args[0];

  const projects = listProjectDirs();
  if (projects.length === 0) {
    console.error('❌ No projects found.');
    console.error('   Create one with: design init "Project Name"');
    return null;
  }
  if (projects.length === 1) {
    console.log(`📂 Auto-selected: ${projects[0]}`);
    return projects[0];
  }
  return await selectProject(projects);
}

const args = process.argv.slice(2);

console.log('');
console.log('🔍 Design OS Evaluate');

const target = await getTargetSlug(args);

if (!target) {
  process.exit(1);
}

console.log('');

if (target === 'all') {
  const projects = listProjectDirs();
  if (projects.length === 0) {
    console.error('❌ No projects found.');
    process.exit(1);
  }

  console.log(`Preparing ${projects.length} project(s)...`);
  console.log('');

  let successCount = 0;
  for (const slug of projects) {
    if (evaluateProject(slug)) successCount++;
  }

  console.log('');
  console.log(`✅ Completed: ${successCount}/${projects.length} projects`);
} else {
  const success = evaluateProject(target);
  if (!success) process.exit(1);
}

console.log('');
