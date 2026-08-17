/**
 * Doctor command — checks system requirements and MCP connections.
 */

import { existsSync } from 'fs';
import { join } from 'path';
import { findWorkspaceRoot } from '../../../lib/files.mjs';

function check(label, pass, detail) {
  const icon = pass ? '✅' : '❌';
  console.log(`  ${icon}  ${label}${detail ? `  — ${detail}` : ''}`);
  return pass;
}

function warn(label, detail) {
  console.log(`  ⚠️   ${label}${detail ? `  — ${detail}` : ''}`);
}

export async function run() {
  const root = findWorkspaceRoot();
  console.log('\n🩺  Adonay Design OS — Doctor\n');

  let allGreen = true;

  // Node version
  const [major] = process.versions.node.split('.').map(Number);
  allGreen &= check('Node.js 18+', major >= 18, `v${process.versions.node}`);

  // Workspace structure
  allGreen &= check('projects/ folder exists', existsSync(join(root, 'projects')));
  allGreen &= check('context/ folder exists', existsSync(join(root, 'context')));
  allGreen &= check('context/methodology.md exists', existsSync(join(root, 'context', 'methodology.md')));
  allGreen &= check('context/enterprise-b2b-patterns.md exists', existsSync(join(root, 'context', 'enterprise-b2b-patterns.md')));
  allGreen &= check('context/frameworks.md exists', existsSync(join(root, 'context', 'frameworks.md')));
  allGreen &= check('context/mentoring-patterns.md exists', existsSync(join(root, 'context', 'mentoring-patterns.md')));

  // Cursor Rule
  allGreen &= check('.cursor/rules/design-os.mdc exists', existsSync(join(root, '.cursor', 'rules', 'design-os.mdc')));

  // Templates
  const templates = [
    'brief', 'prd', 'research', 'figma', 'analytics',
    'mentoring', 'websites', 'documents', 'artifacts',
    'artifact-review', 'mentoring-notes', 'student-feedback', 'session-log',
    'design-review', 'vibe-brief', 'vibe-check-prompt', 'vibe-check-analysis',
    'prototypes-readme', 'program-knowledge'
  ];
  for (const t of templates) {
    const exists = existsSync(join(root, '.design-os', 'templates', `${t}.template.md`));
    allGreen &= check(`template: ${t}.template.md`, exists);
  }

  // Scripts
  const scripts = ['new', 'review', 'evaluate', 'ingest', 'knowledge', 'vibe-check', 'vibe', 'comment'];
  for (const s of scripts) {
    const exists = existsSync(join(root, '.design-os', 'scripts', `${s}.mjs`));
    allGreen &= check(`script: ${s}.mjs`, exists);
  }

  // MCP connections (informational — can't verify without running, just check .env)
  console.log('\n  MCP Integrations (verify in Cursor settings):');
  warn('Figma MCP', 'Required for design review + Figma comments + push to Figma');
  warn('Browser MCP', 'Required for design evaluate — live website review');
  warn('Atlassian MCP', 'Optional — enables reading Jira tickets directly');
  warn('Recorder MCP', 'Optional — Tella is Adonay\'s; Loom/Granola/Fathom/other also fine for transcripts');

  // .env
  const envExists = existsSync(join(root, '.env'));
  if (!envExists) {
    warn('.env not found', 'Copy .env.example → .env if you need API keys');
  }

  console.log('');
  if (allGreen) {
    console.log('  ✅  All checks passed. Design OS is ready.\n');
    console.log('  Quick start:');
    console.log('    design init "Project Name"');
    console.log('    → fill in context/brief.md');
    console.log('    design knowledge <slug> --agent --synthesize');
    console.log('    → program-knowledge.md + evidence-synthesis.md');
    console.log('    design ingest <slug> --with-knowledge --agent');
    console.log('    → prd.md + research.md generated');
    console.log('    design vibe-check <slug> --agent');
    console.log('    → vibe-check-analysis.md (stakeholder prototype gate)');
    console.log('    design review <slug> --agent');
    console.log('    → design-review.md + comments generated');
    console.log('    design evaluate <slug> --agent');
    console.log('    → artifact-review.md + mentoring-notes.md + student-feedback.md');
    console.log('    design vibe <slug> --agent');
    console.log('    → vibe-brief.md + Claude Code prompt generated');
    console.log('    design comment <slug>');
    console.log('    → comments posted to Figma\n');
  } else {
    console.log('  ❌  Some checks failed. Fix the issues above and run doctor again.\n');
  }
}
