/**
 * Vibe-Check command — analyze stakeholder vibe-coded prototypes before design work.
 * Delegates to scripts/vibe-check.mjs via spawn.
 * Optionally runs Cursor Agent with --agent flag.
 */

import { spawn } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { findWorkspaceRoot } from '../../../lib/files.mjs';
import { track, getCommonProps } from '../../../lib/telemetry.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = join(__dirname, '../../../scripts/vibe-check.mjs');
const PACKAGE_ROOT = join(__dirname, '../../../..');

function getVersion() {
  try {
    const pkgPath = join(PACKAGE_ROOT, 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    return pkg.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

function parseArgs(args) {
  let useAgent = false;
  let agentTimeout = 10;
  const scriptArgs = [];
  let slug = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--agent') {
      useAgent = true;
    } else if (arg === '--agent-timeout') {
      const nextArg = args[i + 1];
      if (nextArg && !nextArg.startsWith('-')) {
        agentTimeout = parseInt(nextArg, 10) || 10;
        i++;
      }
    } else if (arg === '--no-telemetry') {
      continue;
    } else if (!arg.startsWith('--agent')) {
      scriptArgs.push(arg);
      if (!slug && !arg.startsWith('-')) {
        slug = arg;
      }
    }
  }

  return { slug, useAgent, agentTimeout, scriptArgs };
}

function runVibeCheckScript(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [SCRIPT_PATH, ...args], {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    child.on('error', reject);
    child.on('close', resolve);
  });
}

export async function run(args) {
  const { slug, useAgent, agentTimeout, scriptArgs } = parseArgs(args);

  const version = getVersion();
  const commonProps = getCommonProps(version);

  if (useAgent) {
    track('cmd_vibe_check_agent', { ...commonProps, agent: true }, { args });
  } else {
    track('cmd_vibe_check', { ...commonProps, agent: false }, { args });
  }

  const exitCode = await runVibeCheckScript(scriptArgs);

  if (exitCode !== 0) {
    process.exit(exitCode);
  }

  if (!useAgent) {
    console.log('📝 Next step:');
    if (slug && slug !== 'all') {
      console.log(`   Run: design vibe-check ${slug} --agent`);
    } else {
      console.log('   Run: design vibe-check <project> --agent');
    }
    console.log('');
    console.log('   Or manually: open _vibe-check_prompt.md in Cursor → Cmd+I → Agent mode');
    console.log('');
    return;
  }

  if (!slug || slug === 'all') {
    console.log('');
    console.log('⚠️  --agent requires a single project slug, not "all".');
    console.log('   Example: design vibe-check my-project --agent');
    console.log('');
    process.exit(1);
  }

  const workspaceRoot = findWorkspaceRoot();
  const projectPath = join(workspaceRoot, 'projects', slug);
  const insightsPath = join(projectPath, 'insights');
  const promptPath = join(insightsPath, 'prompts', '_vibe-check_prompt.md');
  const analysisPath = join(insightsPath, 'vibe-check-analysis.md');

  if (!existsSync(promptPath)) {
    console.error('');
    console.error(`❌ Prompt file not found: ${promptPath}`);
    console.error('   The vibe-check script may have failed.');
    console.error('');
    process.exit(1);
  }

  const { runCursorAgent, isCursorAgentAvailable, printMissingAgentInstructions, printAuthInstructions } =
    await import('../../integrations/cursor-agent.mjs');

  const available = await isCursorAgentAvailable();
  if (!available) {
    printMissingAgentInstructions();
    console.log('📄 Prompt file ready at:');
    console.log(`   ${promptPath}`);
    console.log('');
    return;
  }

  const result = await runCursorAgent({
    promptPath,
    workingDir: projectPath,
    timeoutMinutes: agentTimeout
  });

  if (!result.success) {
    if (result.error && result.error.includes('code 1')) {
      printAuthInstructions();
      console.log('📄 Prompt file ready at:');
      console.log(`   ${promptPath}`);
      console.log('');
      console.log('After logging in, run again:');
      console.log(`   design vibe-check ${slug} --agent`);
      console.log('');
    } else {
      console.error('');
      console.error(`❌ Agent failed: ${result.error}`);
      console.error('');
    }
    process.exit(1);
  }

  console.log('');
  if (existsSync(analysisPath)) {
    console.log('✅ Vibe-check complete!');
    console.log('');
    console.log('📝 Next steps:');
    console.log(`   1. Review insights/vibe-check-analysis.md`);
    console.log(`   2. Align with stakeholder on the 5 questions`);
    console.log(`   3. Then proceed to Figma / design review`);
    console.log('');
  } else {
    console.log('⚠️  Agent completed but vibe-check-analysis.md was not found.');
    console.log('   Try running again or check the prompt file manually.');
  }
  console.log('');
}
