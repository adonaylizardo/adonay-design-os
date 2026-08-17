import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { getContextPath, readFile, writeFile } from './files.mjs';
import { listDocumentMds } from './knowledge-scan.mjs';

const TOKEN_VAR_MAP = {
  primary: '--color-primary',
  'primary-hover': '--color-primary-hover',
  accent: '--color-primary',
  background: '--color-surface',
  surface: '--color-surface',
  text: '--color-text',
  'text-muted': '--color-text-muted',
  border: '--color-border',
};

const NON_COLOR_PREFIXES = /^(text|space|radius|font|shadow)-/;

/**
 * Map a parsed token name to a CSS custom property.
 * @param {string} name
 * @param {string} value
 * @returns {string}
 */
function toCssVar(name, value) {
  if (TOKEN_VAR_MAP[name]) return TOKEN_VAR_MAP[name];
  if (name.startsWith('color-')) return `--${name}`;
  if (NON_COLOR_PREFIXES.test(name)) return `--${name}`;
  if (name.startsWith('font-')) return `--${name}`;

  const isColorValue =
    value.startsWith('#') ||
    value.startsWith('rgb') ||
    value.startsWith('hsl') ||
    /^[a-z]+$/i.test(value);

  if (isColorValue) {
    return `--color-${name.replace(/^color-/, '')}`;
  }

  if (value.includes('rem') || value.includes('em') || value.includes('px')) {
    return `--${name}`;
  }

  return `--color-${name.replace(/^color-/, '')}`;
}

/**
 * @param {string} line
 * @returns {{ name: string, value: string }|null}
 */
function parseTokenLine(line) {
  const mdMatch = line.match(/^[-*]\s*`?(--?[a-z0-9-]+)`?\s*[:=]\s*(.+)$/i);
  if (mdMatch) {
    const rawName = mdMatch[1].replace(/^--/, '').toLowerCase();
    return { name: rawName, value: mdMatch[2].trim().replace(/`/g, '') };
  }

  const cssVarMatch = line.match(/^--([a-z0-9-]+)\s*:\s*(.+);?\s*$/i);
  if (cssVarMatch) {
    return { name: cssVarMatch[1].toLowerCase(), value: cssVarMatch[2].trim() };
  }

  const hexMatch = line.match(/^[-*]\s*([a-z0-9- ]+)\s*[:#]\s*(#[0-9a-fA-F]{3,8})\b/);
  if (hexMatch) {
    return { name: hexMatch[1].trim().toLowerCase().replace(/\s+/g, '-'), value: hexMatch[2] };
  }

  return null;
}

/**
 * @param {string} content
 * @returns {Map<string, string>}
 */
export function extractTokensFromMarkdown(content) {
  const tokens = new Map();

  for (const line of content.split('\n')) {
    const parsed = parseTokenLine(line.trim());
    if (!parsed) continue;

    const cssVar = toCssVar(parsed.name, parsed.value);
    tokens.set(cssVar, parsed.value);
  }

  const tableRows = [...content.matchAll(/^\|\s*([^|]+)\|\s*([^|]+)\|/gm)];
  for (const row of tableRows) {
    const key = row[1].trim().toLowerCase().replace(/^--/, '');
    const val = row[2].trim();
    if (key.includes('token') || key.includes('name') || key.includes('---')) continue;

    if (val.match(/^#[0-9a-fA-F]{3,8}$/)) {
      const cssVar = toCssVar(key.replace(/\s+/g, '-'), val);
      tokens.set(cssVar, val);
    } else if (val.match(/^\d+(\.\d+)?(rem|em|px)$/)) {
      const cssVar = toCssVar(key.replace(/\s+/g, '-'), val);
      tokens.set(cssVar, val);
    }
  }

  const fontMatch = content.match(/\*\*Font(?: family)?:\*\*\s*(.+)$/im);
  if (fontMatch) {
    tokens.set('--font-body', fontMatch[1].trim());
    tokens.set('--font-display', fontMatch[1].trim());
  }

  const displayFont = content.match(/\*\*Display(?: font)?:\*\*\s*(.+)$/im);
  if (displayFont) {
    tokens.set('--font-display', displayFont[1].trim());
  }

  return tokens;
}

/**
 * @param {string} slug
 * @returns {{ tokens: Map<string, string>, excerpts: string[] }}
 */
export function collectBrandFromProject(slug) {
  const contextPath = getContextPath(slug);
  const documentsPath = join(contextPath, 'documents');
  const files = listDocumentMds(documentsPath);

  const tokens = new Map();
  const excerpts = [];

  const priority = files.filter((f) => /token|color|type|typography|brand|spacing|radius/i.test(f));
  const ordered = [...new Set([...priority, ...files])];

  for (const filename of ordered) {
    const content = readFile(join(documentsPath, filename));
    if (!content.trim()) continue;

    for (const [k, v] of extractTokensFromMarkdown(content)) {
      if (!tokens.has(k)) tokens.set(k, v);
    }

    const sections = [...content.matchAll(/^##\s+(.+)$/gm)]
      .map((m) => m[1].trim())
      .filter((s) => /color|typography|type|token|spacing|brand|component|radius/i.test(s));

    if (sections.length) {
      excerpts.push(`### ${filename}\n`);
      for (const section of sections.slice(0, 4)) {
        const block = content.match(
          new RegExp(`##\\s+${section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\n+([\\s\\S]*?)(?=\\n## |\\n---|$)`)
        );
        if (block) {
          const snippet = block[1].trim().split('\n').slice(0, 12).join('\n');
          excerpts.push(`#### ${section}\n\n${snippet}\n`);
        }
      }
    }
  }

  const programKnowledge = readFile(join(contextPath, 'program-knowledge.md'));
  if (programKnowledge.includes('## Documentos en context/documents/')) {
    excerpts.unshift(
      '### program-knowledge.md (index)\n\nUse the catalog and doc→decisión map as authority before styling.\n'
    );
  }

  return { tokens, excerpts };
}

/**
 * @param {string} tokensCssContent
 * @param {Map<string, string>} parsed
 * @returns {string}
 */
export function mergeTokensIntoCss(tokensCssContent, parsed) {
  let output = tokensCssContent;
  for (const [varName, value] of parsed) {
    const regex = new RegExp(`(${varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:\\s*)[^;]+(;)`);
    if (regex.test(output)) {
      output = output.replace(regex, `$1${value}$2`);
    }
  }
  return output;
}

/**
 * @param {string} brandMdContent
 * @param {string[]} excerpts
 * @returns {string}
 */
export function mergeBrandExcerpts(brandMdContent, excerpts) {
  const body = excerpts.length ? excerpts.join('\n') : '*No token/type sections detected — add headings like ## Colors in your DS markdown.*\n';
  return brandMdContent.replace('<!-- BRAND_EXCERPTS -->', body);
}

/**
 * @param {string} slug
 * @param {string} prototypePath
 */
export function writeBrandArtifacts(slug, prototypePath) {
  const { tokens, excerpts } = collectBrandFromProject(slug);

  const tokensPath = join(prototypePath, 'src', 'tokens.css');
  const brandPath = join(prototypePath, 'BRAND.md');

  if (existsSync(tokensPath)) {
    const css = readFileSync(tokensPath, 'utf-8');
    writeFile(tokensPath, mergeTokensIntoCss(css, tokens));
  }

  if (existsSync(brandPath)) {
    const brand = readFile(brandPath);
    writeFile(brandPath, mergeBrandExcerpts(brand, excerpts));
  }
}
