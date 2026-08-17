import { spawnSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync, cpSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import {
  branchName,
  getOptionsPath,
  getPrototypePath,
  getPrototypingConfig,
  isProtoBranchesEnabled,
  getDefaultPort,
} from './prototyping.mjs';
import { findWorkspaceRoot, getPackageRoot, getContextPath, readFile, writeFile } from './files.mjs';
import { writeBrandArtifacts } from './proto-brand.mjs';
import { writePrdArtifacts } from './proto-prd.mjs';

const PROTO_PREFIX = 'proto/';

/** Relative path from workspace root for a prototype tree (force-added on proto branches). */
export function prototypeRelPath(slug, feature) {
  return `projects/${slug}/prototypes/${feature}`;
}

export function git(args, opts = {}) {
  const cwd = opts.cwd || findWorkspaceRoot();
  const result = spawnSync('git', args, { cwd, encoding: 'utf-8' });
  if (result.status !== 0 && !opts.allowFail) {
    throw new Error(result.stderr || result.stdout || `git ${args.join(' ')} failed`);
  }
  return (result.stdout || '').trim();
}

export function isGitRepo(cwd) {
  const result = spawnSync('git', ['rev-parse', '--git-dir'], {
    cwd: cwd || findWorkspaceRoot(),
    encoding: 'utf-8',
  });
  return result.status === 0;
}

export function currentBranch() {
  if (!isGitRepo()) return '(no git repo)';
  return git(['rev-parse', '--abbrev-ref', 'HEAD']);
}

export function isDirty() {
  const status = git(['status', '--porcelain']);
  return status.length > 0;
}

export function assertProtoBranch(name) {
  if (!name.startsWith(PROTO_PREFIX)) {
    throw new Error(`Refusing non-prototype branch: ${name}`);
  }
}

export function parseOptionsMd(content) {
  const rows = [];
  const lines = content.split('\n');
  let inTable = false;
  for (const line of lines) {
    if (line.startsWith('| Option |')) {
      inTable = true;
      continue;
    }
    if (inTable && line.startsWith('|') && !line.includes('---')) {
      const cols = line.split('|').map((c) => c.trim()).filter(Boolean);
      if (cols.length >= 2 && cols[0] !== 'Option') {
        rows.push({
          option: cols[0],
          branch: cols[1],
          status: cols[2] || 'draft',
          port: cols[3] || '—',
          previewUrl: cols[4] || '—',
          hypothesis: cols[5] || '',
          vibeBrief: cols[6] || '—',
        });
      }
    }
    if (inTable && line.trim() === '') break;
  }
  return rows;
}

export function renderOptionsMd(feature, rows) {
  let md = `# Prototype options: ${feature}\n\n`;
  md += `| Option | Branch | Status | Port | Preview URL | Hypothesis | Vibe brief |\n`;
  md += `|--------|--------|--------|------|-------------|------------|------------|\n`;
  for (const r of rows) {
    md += `| ${r.option} | ${r.branch} | ${r.status} | ${r.port} | ${r.previewUrl} | ${r.hypothesis} | ${r.vibeBrief} |\n`;
  }
  md += `\n**Status:** draft | active | review | winner | rejected | archived\n`;
  return md;
}

export function readOptions(slug, feature) {
  const path = getOptionsPath(slug, feature);
  if (!existsSync(path)) return [];
  return parseOptionsMd(readFile(path));
}

export function writeOptions(slug, feature, rows) {
  writeFile(getOptionsPath(slug, feature), renderOptionsMd(feature, rows));
}

export function nextPort(slug, rows) {
  const base = getDefaultPort(slug);
  const used = rows
    .map((r) => parseInt(r.port, 10))
    .filter((n) => Number.isFinite(n));
  let port = base;
  while (used.includes(port)) port += 1;
  return port;
}

function copyDirRecursive(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src)) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    if (statSync(srcPath).isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      cpSync(srcPath, destPath);
    }
  }
}

export function copyPrototypeTemplate(dest) {
  const templateRoot = join(getPackageRoot(), 'templates', 'prototype-app');
  if (!existsSync(templateRoot)) {
    throw new Error(`Prototype template missing: ${templateRoot}`);
  }
  copyDirRecursive(templateRoot, dest);
}

export function enablePrototypingConfig(slug) {
  const contextPath = getContextPath(slug);
  const configPath = join(contextPath, 'prototyping.md');
  const port = getDefaultPort(slug);

  if (existsSync(configPath)) {
    let content = readFile(configPath);
    if (!content.includes('proto_branches:')) {
      content += `\nproto_branches: enabled\n`;
    } else {
      content = content.replace(/proto_branches:\s*.+/i, 'proto_branches: enabled');
    }
    if (!content.includes('default_port:')) {
      content += `default_port: ${port}\n`;
    }
    writeFile(configPath, content);
    return configPath;
  }

  const templatePath = join(getPackageRoot(), 'templates', 'prototyping.template.md');
  let content = readFile(templatePath);
  content = content.replace('__PORT__', String(port));
  writeFile(configPath, content);
  return configPath;
}

export function scaffoldPrototype(slug, feature) {
  const dest = getPrototypePath(slug, feature);
  if (existsSync(dest) && existsSync(join(dest, 'package.json'))) {
    throw new Error(`Prototype already exists: ${dest}`);
  }
  mkdirSync(dest, { recursive: true });
  copyPrototypeTemplate(dest);

  const port = getDefaultPort(slug);

  const replaceInFile = (filePath, replacements) => {
    if (!existsSync(filePath)) return;
    let content = readFile(filePath);
    for (const [key, val] of Object.entries(replacements)) {
      content = content.split(key).join(val);
    }
    writeFileSync(filePath, content);
  };

  const replacements = {
    __SLUG__: slug,
    __FEATURE__: feature,
    __PORT__: String(port),
  };

  for (const name of [
    'package.json',
    'vite.config.ts',
    'index.html',
    'README.md',
    'CLAUDE.md',
    'OPTIONS.md',
    'BRAND.md',
  ]) {
    replaceInFile(join(dest, name), replacements);
  }

  for (const rel of ['src/App.tsx']) {
    replaceInFile(join(dest, rel), replacements);
  }

  const pkgPath = join(dest, 'package.json');
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    pkg.name = `prototype-${slug}-${feature}`;
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  }

  mkdirSync(join(dest, 'v0-export'), { recursive: true });

  writeBrandArtifacts(slug, dest);
  writePrdArtifacts(slug, feature, dest);

  return dest;
}

/**
 * Force-add and commit the prototype tree on the current branch.
 * Scoped to projects/<slug>/prototypes/<feature>/ so other projects stay gitignored.
 * @param {string} slug
 * @param {string} feature
 * @param {string} message
 */
export function commitPrototypeTree(slug, feature, message) {
  if (!isGitRepo()) return null;

  const rel = prototypeRelPath(slug, feature);
  const abs = getPrototypePath(slug, feature);
  if (!existsSync(abs)) {
    throw new Error(`Prototype path missing: ${abs}`);
  }

  git(['add', '-f', rel]);
  const status = git(['status', '--porcelain', rel]);
  if (!status.trim()) {
    return null;
  }

  git(['commit', '-m', message]);
  return git(['rev-parse', '--short', 'HEAD']);
}

export function branchExists(name) {
  const result = spawnSync('git', ['rev-parse', '--verify', name], {
    cwd: findWorkspaceRoot(),
    encoding: 'utf-8',
  });
  return result.status === 0;
}

export function initPrototypeBranch(slug, feature) {
  if (!isGitRepo()) {
    return null;
  }

  const name = branchName(slug, feature, 'base');
  assertProtoBranch(name);
  const previous = currentBranch();

  if (branchExists(name)) {
    git(['checkout', name]);
  } else {
    git(['checkout', '-b', name]);
  }

  const sha = commitPrototypeTree(
    slug,
    feature,
    `proto(${slug}/${feature}): scaffold base option`
  );

  if (sha) {
    console.log(`   Committed prototype files on ${name} (${sha})`);
  }

  return { name, previous };
}

export function requireProtoEnabled(slug) {
  if (!isProtoBranchesEnabled(slug)) {
    throw new Error(
      `proto_branches not enabled. Add proto_branches: enabled to projects/${slug}/context/prototyping.md`
    );
  }
}

export function isDirtyOutsidePrototype(slug, feature) {
  const rel = prototypeRelPath(slug, feature);
  const lines = git(['status', '--porcelain']).split('\n').filter(Boolean);
  return lines.some((line) => {
    const path = line.slice(3).trim();
    return path && !path.startsWith(rel);
  });
}

export function hasUnsavedPrototypeChanges(slug, feature) {
  const rel = prototypeRelPath(slug, feature);
  const lines = git(['status', '--porcelain']).split('\n').filter(Boolean);
  return lines.some((line) => {
    const path = line.slice(3).trim();
    return path.startsWith(rel);
  });
}

export function savePrototypeChanges(slug, feature, message) {
  const sha = commitPrototypeTree(slug, feature, message);
  if (!sha) {
    console.log('   No prototype changes to save.');
    return null;
  }
  console.log(`✅ Saved prototype on ${currentBranch()} (${sha})`);
  return sha;
}

export function checkoutBranch(name, slug, feature) {
  assertProtoBranch(name);

  if (slug && feature && hasUnsavedPrototypeChanges(slug, feature)) {
    throw new Error(
      `Unsaved changes in prototypes/${feature}/. Run: design proto branch save ${slug} --feature ${feature}`
    );
  }

  if (isDirtyOutsidePrototype(slug || '', feature || '')) {
    throw new Error('Working tree has uncommitted changes outside the prototype. Commit or stash before switching.');
  }

  git(['checkout', name]);
}

export function createBranch(slug, feature, option, fromOption = 'base') {
  if (!isGitRepo()) {
    throw new Error('Not a git repository. Run `git init` in Design OS root to use proto branches.');
  }
  const name = branchName(slug, feature, option);
  assertProtoBranch(name);
  const from = branchName(slug, feature, fromOption);

  try {
    git(['rev-parse', '--verify', from]);
  } catch {
    throw new Error(`Source branch ${from} does not exist. Run: design proto init ${slug} --feature ${feature}`);
  }

  if (hasUnsavedPrototypeChanges(slug, feature)) {
    throw new Error(
      `Unsaved changes in prototypes/${feature}/. Run: design proto branch save ${slug} --feature ${feature}`
    );
  }

  if (isDirtyOutsidePrototype(slug, feature)) {
    throw new Error('Commit or stash changes outside the prototype before creating a branch.');
  }

  try {
    git(['rev-parse', '--verify', name]);
    throw new Error(`Branch already exists: ${name}`);
  } catch (e) {
    if (e.message.includes('already exists')) throw e;
  }

  git(['checkout', '-b', name, from]);
  const sha = commitPrototypeTree(
    slug,
    feature,
    `proto(${slug}/${feature}): create option ${option} from ${fromOption}`
  );
  if (sha) {
    console.log(`   Seeded ${name} from ${from} (${sha})`);
  }
  return name;
}

export function deleteBranch(slug, feature, option, force = false) {
  const name = branchName(slug, feature, option);
  assertProtoBranch(name);
  if (option === 'base') throw new Error('Cannot delete base branch');

  const args = ['branch', force ? '-D' : '-d', name];
  git(args);

  const rows = readOptions(slug, feature);
  const updated = rows.map((r) =>
    r.option === option ? { ...r, status: 'rejected', previewUrl: '—' } : r
  );
  writeOptions(slug, feature, updated);
}

export function listBranchesForFeature(slug, feature) {
  if (!isGitRepo()) return [];
  const prefix = `proto/${slug}/${feature}/`;
  const out = git(['branch', '-a']);
  return out
    .split('\n')
    .map((b) => b.replace(/^\*?\s+/, '').replace(/^remotes\/origin\//, ''))
    .filter((b) => b.startsWith(prefix));
}

export function printShareBlock(slug, feature, option) {
  const rows = readOptions(slug, feature);
  const row = rows.find((r) => r.option === option);
  const branch = branchName(slug, feature, option);
  const cfg = getPrototypingConfig(slug);

  console.log('');
  console.log('📤 Share block — paste into Slack');
  console.log('─'.repeat(50));
  console.log(`Prototype: ${slug} / ${feature} — ${option}`);
  if (row?.previewUrl && row.previewUrl !== '—') {
    console.log(`URL: ${row.previewUrl}`);
    console.log(`Password: set PROTOTYPE_PASSWORD in Vercel (or ask Adonay)`);
  } else {
    console.log(`URL: (deploy branch to Vercel — see prototypes/${feature}/README.md)`);
  }
  console.log(`Branch: ${branch}`);
  console.log(`Local: cd projects/${slug}/prototypes/${feature} && npm run dev`);
  if (cfg?.vercel_preview === 'optional') {
    console.log('Note: vercel_preview is optional — configure when stakeholder needs a link.');
  }
  console.log('─'.repeat(50));
  console.log('');
}
