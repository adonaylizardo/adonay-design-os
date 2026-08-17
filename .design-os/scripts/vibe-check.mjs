#!/usr/bin/env node

/**
 * Vibe-Check command — generates analysis prompts for stakeholder vibe-coded prototypes.
 * Usage: design vibe-check [project-slug]
 */

import { join } from 'path';
import { mkdirSync, existsSync, readdirSync } from 'fs';
import {
  readFile, writeFile,
  listProjectDirs, getContextPath, getInsightsPath, getPackageRoot,
  projectExists
} from '../lib/files.mjs';
import { selectProject } from '../lib/prompt.mjs';
import { listDocumentMds } from '../lib/knowledge-scan.mjs';

const PROTOTYPE_EXTENSIONS = ['.html', '.htm'];

function extractProjectName(content) {
  const match = content && content.match(/^Project:\s*(.+)$/m);
  return match ? match[1].trim() : null;
}

function listPrototypeFiles(prototypesPath) {
  if (!existsSync(prototypesPath)) return [];

  return readdirSync(prototypesPath)
    .filter((name) => {
      if (name.startsWith('.') || name === 'README.md') return false;
      const lower = name.toLowerCase();
      return PROTOTYPE_EXTENSIONS.some((ext) => lower.endsWith(ext));
    })
    .sort();
}

function extractBriefPrototypeHint(briefContent) {
  if (!briefContent) return null;

  const sectionMatch = briefContent.match(/## Stakeholder Prototype[\s\S]*?(?=##|$)/i);
  if (!sectionMatch) return null;

  const pathMatch = sectionMatch[0].match(/(?:path|file|prototype)[:\s]+[`"]?([^\s`"\n]+)/i);
  return pathMatch ? pathMatch[1].trim() : null;
}

function listTranscriptFiles(transcriptsPath) {
  if (!existsSync(transcriptsPath)) return [];

  return readdirSync(transcriptsPath)
    .filter((f) => f.endsWith('.md') && f !== 'README.md')
    .sort()
    .reverse();
}

function generateProgramKnowledgeBlock(slug, docFiles) {
  if (docFiles.length === 0) return '';

  const docPaths = docFiles
    .map((f) => `- projects/${slug}/context/documents/${f}`)
    .join('\n');

  return `
### Program knowledge (read before PRD)

- projects/${slug}/context/program-knowledge.md
- projects/${slug}/insights/evidence-synthesis.md (if exists)
${docPaths}

Use evidence-synthesis constraints when tagging requirements.
`;
}

function formatPrototypePaths(slug, prototypeFiles, briefHint) {
  const lines = prototypeFiles.map(
    (f) => `- projects/${slug}/insights/prototypes/${f}`
  );

  if (briefHint && !prototypeFiles.some((f) => briefHint.includes(f))) {
    lines.push(`- ${briefHint} (from brief.md)`);
  }

  if (lines.length === 0) {
    return '*No prototype files found — add HTML to insights/prototypes/ or path in brief.md § Stakeholder Prototype*';
  }

  return lines.join('\n');
}

function formatStakeholderNotesPaths(slug, transcriptFiles) {
  if (transcriptFiles.length === 0) {
    return `- projects/${slug}/context/transcripts/ (read all .md files, newest first)`;
  }

  return transcriptFiles
    .map((f) => `- projects/${slug}/context/transcripts/${f}`)
    .join('\n');
}

function renderPromptTemplate(template, vars) {
  let out = template;
  for (const [key, value] of Object.entries(vars)) {
    out = out.replaceAll(`{${key}}`, value);
  }
  return out;
}

function generateContext(artifacts, projectName, slug, prototypeFiles, transcriptFiles) {
  const { prd, research, brief } = artifacts;
  const date = new Date().toISOString();

  return `# Vibe-Check Context: ${projectName}

Generated: ${date}
Slug: ${slug}

---

## Prototypes detected

${prototypeFiles.length
    ? prototypeFiles.map((f) => `- insights/prototypes/${f}`).join('\n')
    : '*None — add HTML to insights/prototypes/*'}

---

## Transcripts (newest first)

${transcriptFiles.length
    ? transcriptFiles.map((f) => `- context/transcripts/${f}`).join('\n')
    : '*No transcript files found*'}

---

## Brief excerpt (Stakeholder Prototype section)

${brief && brief.includes('## Stakeholder Prototype')
    ? brief.match(/## Stakeholder Prototype[\s\S]*?(?=##|$)/i)?.[0]?.slice(0, 1500) || '*Section empty*'
    : '*No Stakeholder Prototype section in brief.md*'}

---

## PRD Summary

${prd ? prd.slice(0, 2500) : '*No prd.md found or empty*'}

---

## Research Summary

${research ? research.slice(0, 1500) : '*No research.md found*'}
`;
}

function vibeCheckProject(slug) {
  if (!projectExists(slug)) {
    console.error(`❌ Error: Project "${slug}" not found.`);
    console.error('');
    console.error('Available projects:');
    listProjectDirs().forEach((p) => console.error(`   - ${p}`));
    return false;
  }

  const contextPath = getContextPath(slug);
  const insightsPath = getInsightsPath(slug);
  const prototypesPath = join(insightsPath, 'prototypes');
  const transcriptsPath = join(contextPath, 'transcripts');
  const promptsPath = join(insightsPath, 'prompts');
  const documentsPath = join(contextPath, 'documents');

  if (!existsSync(prototypesPath)) {
    mkdirSync(prototypesPath, { recursive: true });
  }
  if (!existsSync(promptsPath)) {
    mkdirSync(promptsPath, { recursive: true });
  }

  const brief = readFile(join(contextPath, 'brief.md'));
  const prototypeFiles = listPrototypeFiles(prototypesPath);
  const briefHint = extractBriefPrototypeHint(brief);

  if (prototypeFiles.length === 0 && !briefHint) {
    console.error(`❌ No stakeholder prototype found for "${slug}".`);
    console.error('');
    console.error('Add one of:');
    console.error(`   - HTML file to projects/${slug}/insights/prototypes/`);
    console.error(`   - Path in context/brief.md § Stakeholder Prototype`);
    console.error('');
    return false;
  }

  const artifacts = {
    prd: readFile(join(contextPath, 'prd.md')),
    research: readFile(join(contextPath, 'research.md')),
    brief
  };

  const projectName =
    extractProjectName(artifacts.prd) ||
    extractProjectName(brief) ||
    slug;

  const transcriptFiles = listTranscriptFiles(transcriptsPath);
  const docFiles = existsSync(join(contextPath, 'program-knowledge.md'))
    ? listDocumentMds(documentsPath)
    : [];

  const templatePath = join(getPackageRoot(), 'templates', 'vibe-check-prompt.template.md');
  const templateContent = readFile(templatePath);

  if (!templateContent) {
    console.error('❌ Missing template: .design-os/templates/vibe-check-prompt.template.md');
    return false;
  }

  const promptContent = renderPromptTemplate(templateContent, {
    project_name: projectName,
    slug,
    program_knowledge_block: generateProgramKnowledgeBlock(slug, docFiles),
    prototype_paths: formatPrototypePaths(slug, prototypeFiles, briefHint),
    stakeholder_notes_paths: formatStakeholderNotesPaths(slug, transcriptFiles)
  });

  const contextContent = generateContext(
    artifacts, projectName, slug, prototypeFiles, transcriptFiles
  );

  writeFile(join(promptsPath, '_vibe-check_prompt.md'), promptContent);
  writeFile(join(promptsPath, '_vibe-check_context.md'), contextContent);

  console.log(`✅ ${slug}`);
  console.log('   → insights/prompts/_vibe-check_prompt.md');
  console.log('   → insights/prompts/_vibe-check_context.md');

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
console.log('🔬 Design OS — Vibe-Check');

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
    if (vibeCheckProject(slug)) successCount++;
  }

  console.log('');
  console.log(`✅ Completed: ${successCount}/${projects.length} projects`);
} else {
  const success = vibeCheckProject(target);
  if (!success) process.exit(1);
}

console.log('');
