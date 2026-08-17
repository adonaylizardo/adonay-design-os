import { existsSync } from 'fs';
import { join } from 'path';
import { getContextPath, readFile } from './files.mjs';
import { listDocumentMds } from './knowledge-scan.mjs';

const INIT_STUB_MARKERS = [
  '*(añadir con design knowledge)*',
  '*(ninguno)*',
  '| — | — | — | — |',
];

const PRD_PLACEHOLDER_MARKERS = [
  '*One sentence. What problem does this solve for the user?*',
  '*What does the user want to accomplish?*',
  '*What does the business want to achieve?*',
];

/**
 * @param {string} slug
 * @returns {{ ok: boolean, reason?: string, steps?: string[] }}
 */
export function validateDesignSystem(slug) {
  const contextPath = getContextPath(slug);
  const documentsPath = join(contextPath, 'documents');
  const mdFiles = listDocumentMds(documentsPath);

  if (mdFiles.length === 0) {
    return {
      ok: false,
      reason: `No design system markdown in projects/${slug}/context/documents/`,
      steps: [
        `Drop DS docs (e.g. tokens.md, typography.md) in projects/${slug}/context/documents/`,
        `Run: design knowledge ${slug}`,
        `Then: design proto init ${slug} --feature <name>`,
      ],
    };
  }

  const programKnowledgePath = join(contextPath, 'program-knowledge.md');
  if (!existsSync(programKnowledgePath)) {
    return {
      ok: false,
      reason: 'program-knowledge.md is missing',
      steps: [
        `Run: design knowledge ${slug}`,
        `Then: design proto init ${slug} --feature <name>`,
      ],
    };
  }

  const content = readFile(programKnowledgePath);
  if (!content.trim()) {
    return {
      ok: false,
      reason: 'program-knowledge.md is empty',
      steps: [`Run: design knowledge ${slug}`],
    };
  }

  const isStub =
    INIT_STUB_MARKERS.some((marker) => content.includes(marker)) &&
    !content.includes('Last indexed:');

  if (isStub) {
    return {
      ok: false,
      reason: 'program-knowledge.md is still the empty init stub (not indexed)',
      steps: [
        `Run: design knowledge ${slug}`,
        `Then: design proto init ${slug} --feature <name>`,
      ],
    };
  }

  const catalogSection = content.match(
    /## Documentos en context\/documents\/[\s\S]*?\n\|[^\n]+\|\n\|[-| ]+\|\n([\s\S]*?)(?=\n## |\n---|$)/
  );
  const catalogRows = catalogSection
    ? catalogSection[1].split('\n').filter((line) => line.startsWith('|') && !line.includes('---'))
    : [];

  const hasRealDoc = catalogRows.some((row) => {
    const cols = row.split('|').map((c) => c.trim()).filter(Boolean);
    const filename = cols[0] || '';
    return filename && !INIT_STUB_MARKERS.some((m) => row.includes(m.replace(/\|/g, '').trim()));
  });

  if (!hasRealDoc && mdFiles.length > 0) {
    // Files on disk but index not updated — still allow if Last indexed present
    if (!content.includes('Last indexed:')) {
      return {
        ok: false,
        reason: 'Reference docs exist but program knowledge was not indexed',
        steps: [`Run: design knowledge ${slug}`],
      };
    }
  }

  return { ok: true };
}

/**
 * @param {string} slug
 * @returns {{ ok: boolean, warn?: boolean, reason?: string, steps?: string[] }}
 */
export function validatePrd(slug) {
  const prdPath = join(getContextPath(slug), 'prd.md');

  if (!existsSync(prdPath)) {
    return {
      ok: false,
      warn: true,
      reason: 'No prd.md — proto uses project rationale; it does not invent a product',
      steps: [
        `Fill context/brief.md and run: design ingest ${slug}`,
        `Or write projects/${slug}/context/prd.md manually`,
      ],
    };
  }

  const content = readFile(prdPath);
  if (!content.trim()) {
    return {
      ok: false,
      warn: true,
      reason: 'prd.md is empty',
      steps: [`Run: design ingest ${slug}`],
    };
  }

  const problemSection = content.match(/## Problem Statement\s*\n+([\s\S]*?)(?=\n## |\n---|$)/);
  const problemText = problemSection ? problemSection[1].trim() : '';
  const placeholderOnly =
    !problemText ||
    PRD_PLACEHOLDER_MARKERS.some((m) => problemText.includes(m)) ||
    problemText.length < 20;

  if (placeholderOnly) {
    return {
      ok: false,
      warn: true,
      reason: 'prd.md still looks like the init template (no real problem statement)',
      steps: [`Run: design ingest ${slug} --agent`],
    };
  }

  return { ok: true };
}

/**
 * @param {string} slug
 * @param {{ strictPrd?: boolean }} [opts]
 */
export function assertProtoPrerequisites(slug, opts = {}) {
  const ds = validateDesignSystem(slug);
  if (!ds.ok) {
    const err = new Error(ds.reason);
    err.steps = ds.steps;
    err.code = 'NO_DS';
    throw err;
  }

  const prd = validatePrd(slug);
  if (!prd.ok) {
    if (opts.strictPrd) {
      const err = new Error(prd.reason);
      err.steps = prd.steps;
      err.code = 'NO_PRD';
      throw err;
    }
    return { prdWarning: prd };
  }

  return {};
}

export function printRefusal(message, steps = []) {
  console.error(`❌ ${message}`);
  if (steps.length) {
    console.error('');
    console.error('Next steps:');
    for (const step of steps) {
      console.error(`  ${step}`);
    }
  }
  console.error('');
}

export function printWarning(message, steps = []) {
  console.warn(`⚠️  ${message}`);
  if (steps.length) {
    console.warn('');
    console.warn('Recommended:');
    for (const step of steps) {
      console.warn(`  ${step}`);
    }
  }
  console.warn('');
}
