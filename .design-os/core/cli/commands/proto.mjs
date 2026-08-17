/**
 * design proto — outbound prototype branch lifecycle.
 */

import { projectExists } from '../../../lib/files.mjs';
import {
  validateDesignSystem,
  validatePrd,
  printRefusal,
  printWarning,
} from '../../../lib/proto-validate.mjs';
import {
  branchName,
  getPrototypePath,
  getDefaultPort,
} from '../../../lib/prototyping.mjs';
import {
  scaffoldPrototype,
  enablePrototypingConfig,
  initPrototypeBranch,
  createBranch,
  checkoutBranch,
  deleteBranch,
  listBranchesForFeature,
  readOptions,
  writeOptions,
  nextPort,
  printShareBlock,
  requireProtoEnabled,
  isGitRepo,
  currentBranch,
} from '../../../lib/proto-git.mjs';

function usage() {
  console.log(`
design proto — outbound prototype branches (DS + PRD → Vite scaffold)

Usage:
  design proto init <slug> --feature <name>
  design proto branch create <slug> --feature <name> --option <name> [--from base]
  design proto branch switch <slug> --feature <name> --option <name>
  design proto branch list <slug> --feature <name>
  design proto branch delete <slug> --feature <name> --option <name> [--force]
  design proto share <slug> --feature <name> --option <name>

Prerequisites (init refuses without these):
  • DS markdown in projects/<slug>/context/documents/
  • Indexed program knowledge: design knowledge <slug>
  • Product rationale in prd.md (warns if missing — run design ingest)

Outbound prototypes live in projects/<slug>/prototypes/<feature>/.
Inbound stakeholder HTML stays in insights/prototypes/ (design vibe-check).

Local run:
  cd projects/<slug>/prototypes/<feature> && npm install && npm run dev

Template: .design-os/templates/prototype-app/
`);
}

/**
 * @param {string[]} args
 * @returns {{ positional: string[], flags: Record<string, string|boolean> }}
 */
function parseArgs(args) {
  const positional = [];
  const flags = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--feature' || arg === '--option' || arg === '--from') {
      flags[arg.slice(2)] = args[++i];
    } else if (arg === '--force') {
      flags.force = true;
    } else if (arg === '--strict-prd') {
      flags.strictPrd = true;
    } else if (!arg.startsWith('-')) {
      positional.push(arg);
    }
  }

  return { positional, flags };
}

function requireFeature(flags) {
  if (!flags.feature) {
    throw new Error('Missing --feature <name>');
  }
  return flags.feature;
}

function requireOption(flags) {
  if (!flags.option) {
    throw new Error('Missing --option <name>');
  }
  return flags.option;
}

async function runInit(slug, flags) {
  if (!projectExists(slug)) {
    throw new Error(`Project "${slug}" not found. Run: design init "Project Name"`);
  }

  const feature = requireFeature(flags);

  const ds = validateDesignSystem(slug);
  if (!ds.ok) {
    printRefusal(ds.reason, ds.steps || []);
    process.exit(1);
  }

  const prd = validatePrd(slug);
  if (!prd.ok) {
    printWarning(prd.reason, prd.steps || []);
  }

  enablePrototypingConfig(slug);
  const dest = scaffoldPrototype(slug, feature);
  const branch = initPrototypeBranch(slug, feature);

  console.log(`✅ Prototype scaffolded: ${dest}`);
  if (branch) {
    console.log(`   Git branch: ${branch}${currentBranch() === branch ? ' (checked out)' : ''}`);
  } else {
    console.log('   Git: not a repo — proto branches skipped (run git init at workspace root)');
  }

  const port = getDefaultPort(slug);
  console.log('');
  console.log('Next steps:');
  console.log(`  cd projects/${slug}/prototypes/${feature}`);
  console.log('  npm install && npm run dev');
  console.log(`  Edit screens using tokens.css + BRAND.md (port ${port})`);
  console.log('');
  console.log('Create another option:');
  console.log(`  design proto branch create ${slug} --feature ${feature} --option alt-a`);
}

async function runBranchCreate(slug, flags) {
  requireProtoEnabled(slug);
  const feature = requireFeature(flags);
  const option = requireOption(flags);
  const fromOption = flags.from || 'base';

  if (option === 'base') {
    throw new Error('Option "base" already exists from init. Choose a different --option name.');
  }

  const name = createBranch(slug, feature, option, fromOption);
  const rows = readOptions(slug, feature);
  const port = nextPort(slug, rows);

  rows.push({
    option,
    branch: name,
    status: 'draft',
    port: String(port),
    previewUrl: '—',
    hypothesis: '',
    vibeBrief: '—',
  });
  writeOptions(slug, feature, rows);

  console.log(`✅ Created branch: ${name} (port ${port})`);
  console.log(`   Update hypothesis in prototypes/${feature}/OPTIONS.md`);
}

async function runBranchSwitch(slug, flags) {
  requireProtoEnabled(slug);
  const feature = requireFeature(flags);
  const option = requireOption(flags);
  const name = branchName(slug, feature, option);
  checkoutBranch(name);
  console.log(`✅ Switched to ${name}`);
}

async function runBranchList(slug, flags) {
  requireProtoEnabled(slug);
  const feature = requireFeature(flags);
  const branches = listBranchesForFeature(slug, feature);
  const rows = readOptions(slug, feature);
  const protoPath = getPrototypePath(slug, feature);

  console.log(`\nPrototype: ${slug} / ${feature}`);
  console.log(`Path: ${protoPath}`);
  console.log(`Current branch: ${isGitRepo() ? currentBranch() : '(no git)'}`);
  console.log('');

  if (rows.length) {
    console.log('OPTIONS.md:');
    for (const r of rows) {
      console.log(`  • ${r.option} — ${r.branch} [${r.status}] port ${r.port}`);
    }
  }

  if (branches.length) {
    console.log('');
    console.log('Git branches:');
    for (const b of branches) {
      console.log(`  • ${b}`);
    }
  } else if (isGitRepo()) {
    console.log('\nNo proto branches yet. Run design proto init first.');
  }
  console.log('');
}

async function runBranchDelete(slug, flags) {
  requireProtoEnabled(slug);
  const feature = requireFeature(flags);
  const option = requireOption(flags);
  deleteBranch(slug, feature, option, Boolean(flags.force));
  console.log(`✅ Deleted branch proto/${slug}/${feature}/${option}`);
}

async function runShare(slug, flags) {
  requireProtoEnabled(slug);
  const feature = requireFeature(flags);
  const option = requireOption(flags);
  printShareBlock(slug, feature, option);
}

export async function run(args) {
  console.log('\n🔀 design proto\n');

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    usage();
    return;
  }

  const { positional, flags } = parseArgs(args);
  const sub = positional[0];

  if (sub === 'init') {
    const slug = positional[1];
    if (!slug) throw new Error('Usage: design proto init <slug> --feature <name>');
    await runInit(slug, flags);
    return;
  }

  if (sub === 'branch') {
    const action = positional[1];
    const slug = positional[2];
    if (!slug) {
      throw new Error('Usage: design proto branch <create|switch|list|delete> <slug> --feature <name> ...');
    }

    switch (action) {
      case 'create':
        await runBranchCreate(slug, flags);
        break;
      case 'switch':
        await runBranchSwitch(slug, flags);
        break;
      case 'list':
        await runBranchList(slug, flags);
        break;
      case 'delete':
        await runBranchDelete(slug, flags);
        break;
      default:
        throw new Error(`Unknown branch action: ${action}. Use create, switch, list, or delete.`);
    }
    return;
  }

  if (sub === 'share') {
    const slug = positional[1];
    if (!slug) throw new Error('Usage: design proto share <slug> --feature <name> --option <name>');
    await runShare(slug, flags);
    return;
  }

  throw new Error(`Unknown subcommand: ${sub}. Run design proto --help`);
}
