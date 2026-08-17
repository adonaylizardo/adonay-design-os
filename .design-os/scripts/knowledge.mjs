#!/usr/bin/env node

/**
 * Knowledge command — index reference docs and generate program-knowledge.md
 *
 * Usage:
 *   design knowledge [project-slug]
 *   design knowledge [project-slug] --agent
 *   design knowledge [project-slug] --agent --synthesize
 *   design knowledge [project-slug] --refresh
 */

import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';
import {
  readFile, writeFile,
  listProjectDirs, getContextPath, getInsightsPath,
  projectExists
} from '../lib/files.mjs';
import { selectProject } from '../lib/prompt.mjs';
import {
  listDocumentMds,
  extractDocMetadata,
  generateProgramKnowledge,
  generateKnowledgeAgentPrompt,
  syncDocumentsMdTable
} from '../lib/knowledge-scan.mjs';

function parseArgs(argv) {
  const flags = {
    agent: false,
    synthesize: false,
    refresh: false
  };
  const positional = [];

  for (const arg of argv) {
    if (arg === '--agent') flags.agent = true;
    else if (arg === '--synthesize') flags.synthesize = true;
    else if (arg === '--refresh') flags.refresh = true;
    else if (!arg.startsWith('-')) positional.push(arg);
  }

  return { flags, slug: positional[0] || null };
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

function extractProjectName(briefContent, slug) {
  const match = briefContent.match(/^Project:\s*(.+)$/m);
  return match ? match[1].trim() : slug;
}

// Main
const { flags, slug: slugArg } = parseArgs(process.argv.slice(2));

console.log('\n📚 Adonay Design OS — Knowledge\n');

const slug = await getTargetSlug(slugArg);
if (!slug) process.exit(1);

if (!projectExists(slug)) {
  console.error(`❌ Project "${slug}" not found.`);
  process.exit(1);
}

const contextPath = getContextPath(slug);
const insightsPath = getInsightsPath(slug);
const documentsPath = join(contextPath, 'documents');
const promptsPath = join(insightsPath, 'prompts');

if (!existsSync(promptsPath)) mkdirSync(promptsPath, { recursive: true });

const mdFiles = listDocumentMds(documentsPath);

if (mdFiles.length === 0) {
  console.error(`❌ No reference .md files in projects/${slug}/context/documents/`);
  console.error('   Copy reference documents there first (exclude README.md).');
  process.exit(1);
}

const docs = mdFiles.map((filename) => {
  const content = readFile(join(documentsPath, filename));
  return extractDocMetadata(content, filename);
});

const briefContent = readFile(join(contextPath, 'brief.md'));
const projectName = extractProjectName(briefContent, slug);
const programKnowledgePath = join(contextPath, 'program-knowledge.md');
const existingContent = flags.refresh ? '' : readFile(programKnowledgePath);

const programKnowledge = generateProgramKnowledge({
  projectName,
  slug,
  docs,
  existingContent,
  refresh: flags.refresh
});

writeFile(programKnowledgePath, programKnowledge);

const documentsMdPath = join(contextPath, 'documents.md');
const documentsMd = readFile(documentsMdPath);
if (documentsMd) {
  writeFile(documentsMdPath, syncDocumentsMdTable(documentsMd, docs));
}

console.log(`✅ ${slug}`);
console.log(`   → context/program-knowledge.md (${docs.length} doc(s) indexed)`);
if (documentsMd) {
  console.log(`   → context/documents.md (table synced)`);
}

if (flags.agent) {
  const prompt = generateKnowledgeAgentPrompt({
    projectName,
    slug,
    docs,
    synthesize: flags.synthesize
  });
  const promptPath = join(promptsPath, '_knowledge_prompt.md');
  writeFile(promptPath, prompt);
  console.log(`   → insights/prompts/_knowledge_prompt.md`);
  console.log('');
  console.log('📝 Next step:');
  console.log(`   Run: design knowledge ${slug} --agent`);
  console.log('   Or open insights/prompts/_knowledge_prompt.md in Cursor → Agent mode');
} else {
  console.log('');
  console.log('📝 Next step:');
  console.log(`   Run: design knowledge ${slug} --agent --synthesize`);
  console.log(`   Then: design ingest ${slug} --with-knowledge`);
}

console.log('');
