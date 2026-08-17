import { readdirSync, existsSync, statSync } from 'fs';
import { join } from 'path';

/**
 * List markdown files in context/documents/ (excludes README.md).
 * @param {string} documentsPath - Absolute path to context/documents
 * @returns {string[]} - Filenames sorted alphabetically
 */
export function listDocumentMds(documentsPath) {
  if (!existsSync(documentsPath)) return [];

  return readdirSync(documentsPath)
    .filter((name) => {
      if (!name.endsWith('.md')) return false;
      if (name.toLowerCase() === 'readme.md') return false;
      const fullPath = join(documentsPath, name);
      return statSync(fullPath).isFile();
    })
    .sort();
}

/**
 * Extract structured metadata from a reference markdown document.
 * @param {string} content - File contents
 * @param {string} filename - Basename for fallback title
 * @returns {object}
 */
export function extractDocMetadata(content, filename) {
  const h1Match = content.match(/^#\s+(.+)$/m);
  const title = h1Match ? h1Match[1].trim() : filename.replace(/\.md$/, '');

  const whatIsMatch = content.match(
    /##\s+What This Document Is\s*\n+([\s\S]*?)(?=\n##\s|\n---\s*$|$)/
  );
  const summary = whatIsMatch
    ? whatIsMatch[1].trim().replace(/\n+/g, ' ').slice(0, 280)
    : '';

  const h2Sections = [...content.matchAll(/^##\s+(.+)$/gm)]
    .map((m) => m[1].trim())
    .filter((s) => s !== 'What This Document Is');

  const metaLine = (label) => {
    const m = content.match(new RegExp(`\\*\\*${label}:\\*\\*\\s*(.+)$`, 'm'));
    return m ? m[1].trim() : '';
  };

  return {
    filename,
    title,
    summary,
    h2Sections,
    date: metaLine('Date') || metaLine('Period'),
    source: metaLine('Source'),
    audience: metaLine('Audience')
  };
}

/**
 * Parse existing doc→decisión rows from program-knowledge.md (preserve manual/agent work).
 * @param {string} content - Existing program-knowledge.md
 * @returns {string[]} - Completed table rows (non-stub)
 */
export function parseExistingDecisionRows(content) {
  const rows = [];
  const section = content.match(/## Mapa doc → decisión[\s\S]*?\n\|[^\n]+\|\n\|[-| ]+\|\n([\s\S]*?)(?=\n## |\n---|$)/);
  if (!section) return rows;

  for (const line of section[1].split('\n')) {
    if (!line.startsWith('|')) continue;
    const cols = line.split('|').map((c) => c.trim()).filter(Boolean);
    if (cols.length < 3) continue;
    if (cols[0].includes('Decisión de diseño')) continue;
    if (cols[0].includes('[pendiente')) continue;
    if (cols[0].includes('(doc removed)')) continue;
    rows.push(line);
  }
  return rows;
}

/**
 * Infer document type label from filename and content.
 * @param {object} meta - From extractDocMetadata
 * @returns {string}
 */
function inferDocType(meta) {
  const lower = meta.filename.toLowerCase();
  if (lower.includes('survey') || lower.includes('pulse')) return 'Evidencia cuantitativa';
  if (lower.includes('compendium') || lower.includes('discovery')) return 'Discovery / decisiones de programa';
  if (lower.includes('onboarding') || lower.includes('designer')) return 'Orientación de rol / proceso';
  return 'Referencia de programa';
}

/**
 * Infer authority level from document type.
 * @param {string} docType
 * @returns {string}
 */
function inferAuthority(docType) {
  if (docType === 'Evidencia cuantitativa') return 'Alta — constraints UX';
  if (docType === 'Discovery / decisiones de programa') return 'Alta — scope y flujo';
  if (docType === 'Orientación de rol / proceso') return 'Alta — gates y entregables';
  return 'Media';
}

/**
 * Build default doc→decisión stub rows from H2 sections.
 * @param {object} meta
 * @returns {string[]}
 */
function buildStubDecisionRows(meta) {
  const stubs = [];
  const relevant = meta.h2Sections.filter(
    (s) => !/survey questions reference|key contacts|team structure/i.test(s)
  );

  for (const section of relevant.slice(0, 6)) {
    stubs.push(
      `| [pendiente: completar con --agent o manual] | ${section} | ${meta.filename} | — |`
    );
  }
  return stubs;
}

/**
 * Generate or merge program-knowledge.md from scanned documents.
 * @param {object} options
 * @param {string} options.projectName
 * @param {string} options.slug
 * @param {object[]} options.docs - Scanned metadata objects
 * @param {string} [options.existingContent] - Current program-knowledge.md
 * @param {boolean} [options.refresh] - Regenerate decision stubs from scratch
 * @returns {string}
 */
export function generateProgramKnowledge({ projectName, slug, docs, existingContent = '', refresh = false }) {
  const now = new Date().toISOString();
  const preservedRows = refresh ? [] : parseExistingDecisionRows(existingContent);

  const catalogRows = docs.map((meta) => {
    const docType = inferDocType(meta);
    const authority = inferAuthority(docType);
    const summary = meta.summary || '—';
    return `| ${meta.filename} | ${docType} | ${authority} | ${summary} |`;
  });

  const decisionRows = preservedRows.length > 0
    ? [...preservedRows]
    : docs.flatMap((meta) => buildStubDecisionRows(meta));

  const readingOrder = docs.length
    ? docs.map((d, i) => `${i + 1}. \`context/documents/${d.filename}\` — ${d.title}`).join('\n')
    : '*(No reference documents indexed yet)*';

  return `---
Project: ${projectName}
Created: ${now.split('T')[0]}
Last indexed: ${now}
---

# Program Knowledge — ${projectName}

Índice de autoridad para documentos de referencia en \`context/documents/\`.
Generado por \`design knowledge ${slug}\`. Actualiza con \`design knowledge ${slug} --agent\` para completar el mapa doc→decisión.

---

## Documentos en context/documents/

| Archivo | Tipo | Autoridad | Resumen |
|---------|------|-----------|---------|
${catalogRows.length ? catalogRows.join('\n') : '| *(ninguno)* | — | — | — |'}

---

## Mapa doc → decisión

| Decisión de diseño | Consultar | Documento | Evidencia clave |
|--------------------|-----------|-----------|-----------------|
${decisionRows.length ? decisionRows.join('\n') : '| — | — | — | — |'}

---

## Orden de lectura (antes de diseñar o revisar)

1. \`context/program-knowledge.md\` (este archivo)
2. \`insights/evidence-synthesis.md\` (si existe)
3. Documentos raw según la decisión:
${readingOrder.split('\n').map((l) => `   ${l}`).join('\n')}
4. \`context/prd.md\` + \`context/research.md\`
5. \`context/transcripts/\` (más reciente primero)
6. \`context/userflows/\` + \`context/figma.md\`

---

## Conflictos entre fuentes

| Tema | Fuente que gana | Notas |
|------|-----------------|-------|
| Roadmap / gates de diseño | \`case-wrap-designer-onboarding-jun2026.md\` | Más reciente que brief kickoff (jun 10) |
| Constraints cuantitativos UX | \`gc-pulse-survey-case-wrap.md\` | N=16 GC SMAPs/OVPs |
| Decisiones de proceso unificado | \`case-wrap-compendium-jan-mar-2026.md\` | Working session mar 17 |

---

*Índice generado por Adonay Design OS — design knowledge*
`;
}

/**
 * Generate agent prompt for completing program-knowledge and optional synthesis.
 * @param {object} options
 * @returns {string}
 */
export function generateKnowledgeAgentPrompt({ projectName, slug, docs, synthesize = false }) {
  const docList = docs.map((d) => `- projects/${slug}/context/documents/${d.filename}`).join('\n');

  const synthesisBlock = synthesize
    ? `
## Also generate: projects/${slug}/insights/evidence-synthesis.md

Include:
- **Design constraints** (C1, C2, …) with cited sources (filename §section)
- **UX implications** per constraint
- **Assumption table** (Validated / Unvalidated / Contradicted)
- **Open tensions** between documents
- **Ready-to-use SCQR** for stakeholders at the bottom
`
    : '';

  return `# Knowledge: Complete program-knowledge for ${projectName}

Read reference documents and complete the decision map.

## Step 0 — Read permanent context
- context/methodology.md
- context/enterprise-b2b-patterns.md
- context/frameworks.md

## Step 1 — Read project inputs
- projects/${slug}/context/brief.md
- projects/${slug}/context/transcripts/ (all .md, newest insights first)
- projects/${slug}/context/program-knowledge.md (update the stub rows)

## Step 2 — Read all reference documents
${docList}

## Step 3 — Update program-knowledge.md

Replace all \`[pendiente: completar with --agent or manual]\` rows in the **Mapa doc → decisión** table with real design decisions grounded in the documents.

For each row include:
- A concrete design decision (not a topic label)
- Which document and section to consult
- Key evidence (metric, quote, or decision)

Update **Conflictos entre fuentes** if brief contradicts a newer document.

Write to: projects/${slug}/context/program-knowledge.md
${synthesisBlock}
## Rules
- Cite sources — never invent metrics or quotes
- Read .cursor/rules/design-os.mdc for guidelines
- If projects/${slug}/context/program-knowledge.md has completed rows, preserve them unless contradicted by newer evidence
`;
}

/**
 * Sync documents.md local files table from scanned docs.
 * @param {string} documentsMdContent - Current documents.md
 * @param {object[]} docs - Scanned metadata
 * @returns {string}
 */
export function syncDocumentsMdTable(documentsMdContent, docs) {
  const rows = docs.map(
    (d) => `| ${d.filename} | MD | ${d.title}${d.date ? ` (${d.date})` : ''} |`
  );
  const table = `| File | Type | Review focus |\n|------|------|--------------|\n${rows.join('\n')}`;

  if (documentsMdContent.includes('## Local files in context/documents/')) {
    return documentsMdContent.replace(
      /## Local files in context\/documents\/[\s\S]*?(?=\n## |\n---\s*$|$)/,
      `## Local files in context/documents/\n\n${table}\n`
    );
  }

  return `${documentsMdContent}\n\n## Local files in context/documents/\n\n${table}\n`;
}
