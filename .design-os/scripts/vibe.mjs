#!/usr/bin/env node

/**
 * Vibe command — generates a vibe brief + Claude Code prompt from a completed review.
 * Usage: design vibe [project-slug] [--feature <name>] [--option <name>]
 */

import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';
import {
  readFile, writeFile,
  listProjectDirs, getInsightsPath, getPackageRoot,
  projectExists
} from '../lib/files.mjs';
import { selectProject } from '../lib/prompt.mjs';

function parseArgs(args) {
  const flags = { feature: null, option: null, agent: false };
  const rest = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--feature' && args[i + 1]) {
      flags.feature = args[++i];
    } else if (args[i] === '--option' && args[i + 1]) {
      flags.option = args[++i];
    } else if (args[i] === '--agent') {
      flags.agent = true;
    } else if (!args[i].startsWith('--')) {
      rest.push(args[i]);
    }
  }
  return { flags, slug: rest[0] };
}

function generateVibePrompt(slug, reviewSummary, flags) {
  const template = '.design-os/templates/vibe-brief.template.md';

  const outputFile = flags.feature && flags.option
    ? `projects/${slug}/insights/vibe-brief-${flags.feature}-${flags.option}.md`
    : `projects/${slug}/insights/vibe-brief.md`;

  const stackNote = `- Stack: HTML + Tailwind as default unless React is clearly necessary`;

  return `# Vibe Brief Generator: ${slug}

Read the design review and generate a vibe brief for prototyping.

## Files to read
- projects/${slug}/insights/design-review.md
- projects/${slug}/context/prd.md
- context/methodology.md
${flags.feature ? '- projects/' + slug + '/prototypes/' + flags.feature + '/OPTIONS.md' : ''}

## Template
Follow: ${template}

## Output file
${outputFile}

${stackNote}

## Rules
- Only prototype what tests an assumption or validates an interaction
- Self-contained prompts — no "see review for context"
- Fixture data must be fake B2B SaaS data

## Context from review (partial):
${reviewSummary || '(read the full review file directly)'}

Read .cursor/rules/design-os.mdc and standard vibe rules.
`;
}

async function getTargetSlug(argSlug) {
  if (argSlug) return argSlug;
  const projects = listProjectDirs();
  if (projects.length === 0) {
    console.error('❌ No projects found.');
    return null;
  }
  if (projects.length === 1) {
    console.log(`📂 Auto-selected: ${projects[0]}`);
    return projects[0];
  }
  return await selectProject(projects);
}

const rawArgs = process.argv.slice(2);
console.log('\n⚡ Adonay Design OS — Vibe\n');

const { flags, slug: argSlug } = parseArgs(rawArgs);
const slug = await getTargetSlug(argSlug);
if (!slug) process.exit(1);

if (!projectExists(slug)) {
  console.error(`❌ Project "${slug}" not found.`);
  process.exit(1);
}

const insightsPath = getInsightsPath(slug);
const reviewPath = join(insightsPath, 'design-review.md');
const promptsPath = join(insightsPath, 'prompts');

if (!existsSync(reviewPath)) {
  console.error(`❌ No design-review.md found. Run: design review ${slug} --agent first.`);
  process.exit(1);
}

if (!existsSync(promptsPath)) mkdirSync(promptsPath, { recursive: true });

const reviewContent = readFile(reviewPath);
const reviewSummary = reviewContent ? reviewContent.slice(0, 800) : null;

const promptContent = generateVibePrompt(slug, reviewSummary, flags);
const promptPath = join(promptsPath, '_vibe_prompt.md');
writeFile(promptPath, promptContent);

console.log(`✅ ${slug}`);
if (flags.feature) console.log(`   Feature: ${flags.feature}`);
if (flags.option) console.log(`   Option: ${flags.option}`);
console.log(`   → insights/prompts/_vibe_prompt.md`);
console.log('');
console.log('📝 Next step:');
console.log(`   design vibe ${slug}${flags.feature ? ' --feature ' + flags.feature : ''}${flags.option ? ' --option ' + flags.option : ''} --agent`);
console.log('   Cursor: paste the Claude Code Prompt block from the generated vibe-brief');
console.log('');
