#!/usr/bin/env node

/**
 * Ingest command — generates PRD + Research from raw inputs.
 * Reads brief.md (pasted brief + Jira text + optional Tella transcript),
 * then writes a Cursor Agent prompt that synthesizes prd.md and research.md.
 *
 * Usage: design ingest [project-slug] [--with-knowledge]
 */

import { join, dirname } from 'path';
import { mkdirSync, existsSync } from 'fs';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import {
  readFile, writeFile,
  listProjectDirs, getContextPath, getInsightsPath,
  projectExists
} from '../lib/files.mjs';
import { selectProject } from '../lib/prompt.mjs';
import { listDocumentMds } from '../lib/knowledge-scan.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const flags = { withKnowledge: false };
  const positional = [];
  for (const arg of argv) {
    if (arg === '--with-knowledge') flags.withKnowledge = true;
    else if (!arg.startsWith('-')) positional.push(arg);
  }
  return { flags, slug: positional[0] || null };
}

function generateProgramKnowledgeSection(slug, docFiles) {
  if (docFiles.length === 0) return '';

  const docPaths = docFiles
    .map((f) => `- projects/${slug}/context/documents/${f}`)
    .join('\n');

  return `## Step 2b — Read program knowledge (reference documents)

Read projects/${slug}/context/program-knowledge.md first — it maps which document answers which design decision.

Then read all indexed reference documents:
${docPaths}

Also read projects/${slug}/insights/evidence-synthesis.md if it exists.

Synthesize quantitative data, program decisions, and design constraints into prd.md and research.md.
Cite source document and section for every new finding.
`;
}

function generateIngestPrompt(slug, briefContent, hasProgramKnowledge, docFiles) {
  const hasTella = briefContent && (
    briefContent.includes('tella.tv') ||
    briefContent.match(/Tella recording ID[^\n]*:\s*\S+/)
  );

  const programKnowledgeBlock = hasProgramKnowledge
    ? generateProgramKnowledgeSection(slug, docFiles)
    : '';

  return `# Ingest: Generate PRD + Research for ${slug}

Read the raw brief and extract structured documents.

## Step 0 — Read permanent context first
- context/methodology.md
- context/enterprise-b2b-patterns.md
- context/frameworks.md

## Step 1 — Read user flows (before anything else)
Check projects/${slug}/context/userflows/ for PNG files.
If PNGs exist: read each one with vision. Extract: steps in the flow, decision points, branching paths, entry and exit points. This is the designer's intended journey — it anchors the entire PRD generation.
If empty: proceed without flow context and note the absence in prd.md open questions.

## Step 2 — Read all transcripts
Check projects/${slug}/context/transcripts/ for meeting notes.
Read all .md files sorted by date (oldest first).
Extract per file: decisions made, open questions, stakeholder requests, verbatim quotes worth keeping.
Synthesize: what has evolved across meetings, what is still unresolved.
${programKnowledgeBlock}
## Step 3 — Read the brief
projects/${slug}/context/brief.md

It has three sections:
- **Brief** — free text from client, email, Slack, PDF
- **Jira Tickets** — pasted ticket content (title, description, acceptance criteria)
- **Feedback Transcript** — pasted text OR a Tella recording ID/URL

${hasTella ? `## Step 4 — Fetch Tella transcript
brief.md appears to contain a Tella recording ID or URL.
Use \`mcp_tella_list_videos\` to find the recording, then \`mcp_tella_get_cut_transcript\` to get the transcript.
Extract: pain points, explicit requests, implicit needs, open questions, verbatim quotes.
` : `## Step 4 — Process transcript
Read the transcript text directly from the brief.md Feedback Transcript section.
Extract: pain points, explicit requests, implicit needs, open questions, verbatim quotes.
`}

## Step 5 — Framework proposal
Before generating prd.md, diagnose the problem type from the inputs:
- If the user motivation is unclear or the team is solving the wrong problem → propose JTBD
- If the problem is well-defined and scoped → proceed directly with structured PRD
- If the problem space is genuinely unknown → propose Design Thinking framing

Propose your recommendation in this format:
"Based on the brief, the core problem here is [diagnosis].
For structuring the PRD, I'd suggest:
→ [Framework A] — [reason]
→ [Framework B] — [condition under which this is better]
Proceed with [A], or would you prefer [B]?"

Wait for Adonay's approval before generating the documents.

## Step 6 — Generate output files

### projects/${slug}/context/prd.md
Follow: .design-os/templates/prd.template.md
Apply the approved framework. Must include:
- Problem statement (one crisp sentence — not a feature description)
- User goal + Business goal (separate lines)
- User stories (2–4, grounded in the inputs)
- Happy path (numbered steps)
- Edge cases (from inputs + inferred from context/enterprise-b2b-patterns.md)
- Out of scope
- Success metrics with measurement method
- Business assumptions table (minimum 3 rows)
- Open questions (anything ambiguous from the inputs)

### projects/${slug}/context/research.md
Follow: .design-os/templates/research.template.md
- Key findings (from transcript and brief — what users/stakeholders actually said)
- User pain points (verbatim quotes when available, labeled with source)
- Competitor mentions (if any)
- Quantitative data (if any)
- Recommendations (what the inputs imply for design)
- If no research data: say so explicitly — do not invent findings

## Rules
- Synthesize, don't copy-paste
- Every business assumption must come from something in the inputs or be explicitly flagged as inferred
- Flag ambiguities as open questions in prd.md rather than resolving them silently
- Read .cursor/rules/design-os.mdc for full guidelines
`;
}

async function getTargetSlug(slugArg) {
  if (slugArg) return slugArg;
  const projects = listProjectDirs();
  if (projects.length === 0) {
    console.error('❌ No projects found. Create one with: design init "Project Name"');
    return null;
  }
  if (projects.length === 1) {
    console.log(`📂 Auto-selected: ${projects[0]}`);
    return projects[0];
  }
  return await selectProject(projects);
}

function runKnowledge(slug, agentFlags = []) {
  return new Promise((resolve, reject) => {
    const scriptPath = join(__dirname, 'knowledge.mjs');
    const child = spawn(process.execPath, [scriptPath, slug, ...agentFlags], {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    child.on('error', reject);
    child.on('close', (code) => resolve(code ?? 0));
  });
}

// Main
const { flags, slug: slugArg } = parseArgs(process.argv.slice(2));
console.log('\n📥 Adonay Design OS — Ingest\n');

const slug = await getTargetSlug(slugArg);
if (!slug) process.exit(1);

if (!projectExists(slug)) {
  console.error(`❌ Project "${slug}" not found.`);
  console.error('   Create one first: design init "Project Name"');
  process.exit(1);
}

const contextPath = getContextPath(slug);
const insightsPath = getInsightsPath(slug);
const promptsPath = join(insightsPath, 'prompts');
const documentsPath = join(contextPath, 'documents');

if (!existsSync(promptsPath)) mkdirSync(promptsPath, { recursive: true });

const docFiles = listDocumentMds(documentsPath);
const hasProgramKnowledge = existsSync(join(contextPath, 'program-knowledge.md'));

if (docFiles.length > 0 && !hasProgramKnowledge) {
  console.log(`⚠️  Found ${docFiles.length} reference doc(s) in context/documents/ but no program-knowledge.md.`);
  console.log(`    Run: design knowledge ${slug} --agent --synthesize`);
  console.log(`    Or re-run: design ingest ${slug} --with-knowledge`);
  console.log('');
}

if (flags.withKnowledge && docFiles.length > 0) {
  console.log('🔗 Running design knowledge first...\n');
  const knowledgeCode = await runKnowledge(slug, ['--agent', '--synthesize']);
  if (knowledgeCode !== 0) process.exit(knowledgeCode);
  console.log('');
}

const briefContent = readFile(join(contextPath, 'brief.md'));

if (!briefContent || briefContent.includes('{projectName}')) {
  console.error(`❌ brief.md is empty or still has placeholder text.`);
  console.error(`   Fill in projects/${slug}/context/brief.md first.`);
  process.exit(1);
}

const programKnowledgeNow = existsSync(join(contextPath, 'program-knowledge.md'));
const promptContent = generateIngestPrompt(slug, briefContent, programKnowledgeNow, docFiles);
const promptPath = join(promptsPath, '_ingest_prompt.md');
writeFile(promptPath, promptContent);

console.log(`✅ ${slug}`);
console.log(`   → insights/prompts/_ingest_prompt.md`);
if (programKnowledgeNow) {
  console.log(`   → program knowledge layer active (${docFiles.length} doc(s))`);
}
console.log('');
console.log('📝 Next step:');
console.log(`   Run: design ingest ${slug} --agent`);
if (docFiles.length > 0 && !programKnowledgeNow) {
  console.log(`   Or: design ingest ${slug} --with-knowledge --agent`);
}
console.log('   Or open insights/prompts/_ingest_prompt.md in Cursor → Cmd+I → Agent mode');
console.log('');
