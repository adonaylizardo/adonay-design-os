import { execSync, spawnSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync, cpSync, rmSync } from 'fs';
import { join } from 'path';
import {
  branchName,
  getOptionsPath,
  getPrototypePath,
  getPrototypingConfig,
  isProtoBranchesEnabled,
  getDefaultPort,
} from './prototyping.mjs';
import { findWorkspaceRoot, getPackageRoot, readFile, writeFile } from './files.mjs';

const PROTO_PREFIX = 'proto/';

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

export function copyPrototypeTemplate(dest) {
  throw new Error(
    'Prototype scaffolding is not included in this starter. Use `design vibe <slug>` for a generic HTML + Tailwind brief.'
  );
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

  for (const name of ['package.json', 'vite.config.ts', 'README.md', 'CLAUDE.md', 'OPTIONS.md']) {
    replaceInFile(join(dest, name), replacements);
  }

  const pkgPath = join(dest, 'package.json');
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    pkg.name = `prototype-${slug}-${feature}`;
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  }

  mkdirSync(join(dest, 'v0-export'), { recursive: true });

  return dest;
}

export function requireProtoEnabled(slug) {
  if (!isProtoBranchesEnabled(slug)) {
    throw new Error(
      `proto_branches not enabled. Add proto_branches: enabled to projects/${slug}/context/prototyping.md`
    );
  }
}

export function checkoutBranch(name) {
  assertProtoBranch(name);
  if (isDirty()) {
    throw new Error('Working tree has uncommitted changes. Commit or stash before switching branches.');
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
    throw new Error(`Source branch ${from} does not exist. Run: design proto init ${slug} ${feature}`);
  }

  if (isDirty()) {
    throw new Error('Commit or stash changes before creating a branch.');
  }

  try {
    git(['rev-parse', '--verify', name]);
    throw new Error(`Branch already exists: ${name}`);
  } catch (e) {
    if (e.message.includes('already exists')) throw e;
  }

  git(['checkout', '-b', name, from]);
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
