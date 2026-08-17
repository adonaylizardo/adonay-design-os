import { existsSync } from 'fs';
import { join } from 'path';
import { getContextPath, readFile, writeFile } from './files.mjs';

const PLACEHOLDER_MARKERS = [
  '*One sentence. What problem does this solve for the user?*',
  '*What does the user want to accomplish?*',
  '*What does the business want to achieve?*',
  '*The ideal user journey, step by step:*',
  '*What could go wrong or deviate from the happy path?*',
  '*What are we NOT building in this version?*',
  '*Decisions still to be made:*',
];

/**
 * @param {string} heading
 * @returns {string}
 */
function escapeRegExp(heading) {
  return heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extract a markdown section by heading (## or ###).
 * @param {string} content
 * @param {string[]} headingVariants
 * @returns {string}
 */
function extractSection(content, headingVariants) {
  for (const heading of headingVariants) {
    const re = new RegExp(
      `^#{2,3}\\s+${escapeRegExp(heading)}\\s*$\\n+([\\s\\S]*?)(?=\\n#{2,3}\\s+|\\n---\\s*$|$)`,
      'im'
    );
    const match = content.match(re);
    if (match) {
      return cleanSectionText(match[1]);
    }
  }
  return '';
}

/**
 * @param {string} raw
 * @returns {string}
 */
function cleanSectionText(raw) {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !PLACEHOLDER_MARKERS.includes(line))
    .filter((line) => !/^As a \[user type\]/i.test(line))
    .filter((line) => !/^\|\s*$/.test(line))
    .join('\n')
    .trim();
}

/**
 * @param {string} text
 * @returns {boolean}
 */
function isUsableText(text) {
  if (!text || text.length < 12) return false;
  if (PLACEHOLDER_MARKERS.some((m) => text.includes(m))) return false;
  return true;
}

/**
 * First sentence or line, capped for UI.
 * @param {string} text
 * @param {number} maxLen
 * @returns {string}
 */
function firstSentence(text, maxLen = 160) {
  if (!text) return '';
  const oneLine = text.replace(/\s+/g, ' ').trim();
  const sentence = oneLine.match(/^[^.!?]+[.!?]?/)?.[0]?.trim() || oneLine;
  if (sentence.length <= maxLen) return sentence;
  return `${sentence.slice(0, maxLen - 1).trim()}…`;
}

/**
 * @param {string} slug
 * @returns {{ problem: string, userGoal: string, businessGoal: string, constraints: string, users: string, source: 'prd'|'none' }}
 */
export function extractPrdBrief(slug) {
  const prdPath = join(getContextPath(slug), 'prd.md');
  if (!existsSync(prdPath)) {
    return {
      problem: '',
      userGoal: '',
      businessGoal: '',
      constraints: '',
      users: '',
      source: 'none',
    };
  }

  const content = readFile(prdPath);
  const problem = extractSection(content, [
    'Problem Statement',
    'Problem',
    'The Problem',
  ]);
  const userGoal = extractSection(content, ['User Goal', 'Users', 'Target Users']);
  const businessGoal = extractSection(content, ['Business Goal', 'Business Goals']);
  const edgeCases = extractSection(content, ['Edge Cases', 'Constraints', 'Non-Goals']);
  const outOfScope = extractSection(content, ['Out of Scope', 'Out-of-Scope']);
  const assumptions = extractSection(content, ['Business Assumptions', 'Assumptions']);

  const constraintsParts = [edgeCases, outOfScope, assumptions].filter(isUsableText);
  const constraints = constraintsParts.join('\n\n');

  const userStories = extractSection(content, ['User Stories', 'Personas']);
  const users = isUsableText(userStories) ? firstSentence(userStories, 200) : '';

  return {
    problem: isUsableText(problem) ? problem : '',
    userGoal: isUsableText(userGoal) ? userGoal : '',
    businessGoal: isUsableText(businessGoal) ? businessGoal : '',
    constraints: isUsableText(constraints) ? constraints : '',
    users,
    source: 'prd',
  };
}

/**
 * @param {{ problem: string, userGoal: string, businessGoal: string, constraints: string, users: string, source: string }} brief
 * @param {string} slug
 * @param {string} feature
 * @returns {string}
 */
export function renderRationaleMd(brief, slug, feature) {
  const lines = [
    `# Prototype rationale — ${feature}`,
    '',
    'Handoff from `context/prd.md`. Edit the PRD and re-run `design proto init` on a new feature to refresh.',
    '',
  ];

  if (brief.problem) {
    lines.push('## Problem', '', brief.problem, '');
  } else {
    lines.push('## Problem', '', '_No problem statement found in prd.md — run `design ingest`._', '');
  }

  if (brief.userGoal || brief.businessGoal) {
    lines.push('## Goals', '');
    if (brief.userGoal) lines.push('### User goal', '', brief.userGoal, '');
    if (brief.businessGoal) lines.push('### Business goal', '', brief.businessGoal, '');
  }

  if (brief.users) {
    lines.push('## Users', '', brief.users, '');
  }

  if (brief.constraints) {
    lines.push('## Constraints & assumptions', '', brief.constraints, '');
  }

  lines.push('---', '', `Project: \`${slug}\` · Feature: \`${feature}\``);
  return lines.join('\n');
}

/**
 * UI strings for App.tsx placeholders.
 * @param {{ problem: string, userGoal: string, businessGoal: string }} brief
 * @param {string} feature
 */
export function appCopyFromBrief(brief, feature) {
  const headline = brief.problem
    ? firstSentence(brief.problem, 120)
    : `Prototype ${feature}`;

  const goalParts = [brief.userGoal, brief.businessGoal].filter(isUsableText);
  const lede = goalParts.length
    ? firstSentence(goalParts.join(' '), 220)
    : 'Connect a real PRD via design ingest so this screen names the problem and goal.';

  const focus = brief.problem
    ? firstSentence(brief.problem, 200)
    : 'Define the problem in prd.md, then rebuild or edit RATIONALE.md.';

  return {
    __PRD_HEADLINE__: headline,
    __PRD_LEDE__: lede,
    __PRD_FOCUS__: focus,
  };
}

/**
 * @param {string} slug
 * @param {string} feature
 * @param {string} prototypePath
 */
export function writePrdArtifacts(slug, feature, prototypePath) {
  const brief = extractPrdBrief(slug);
  const rationalePath = join(prototypePath, 'RATIONALE.md');
  writeFile(rationalePath, renderRationaleMd(brief, slug, feature));

  const appPath = join(prototypePath, 'src', 'App.tsx');
  if (existsSync(appPath)) {
    const copy = appCopyFromBrief(brief, feature);
    let content = readFile(appPath);
    for (const [key, val] of Object.entries(copy)) {
      content = content.split(key).join(val);
    }
    writeFile(appPath, content);
  }

  return brief;
}
