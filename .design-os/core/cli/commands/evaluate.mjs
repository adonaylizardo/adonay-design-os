/**
 * Evaluate command — generates artifact review prompts for mentoring.
 * Delegates to scripts/evaluate.mjs via spawn.
 * Optionally runs Cursor Agent with --agent flag.
 */

import { spawn } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { findWorkspaceRoot } from '../../../lib/files.mjs';
import { track, getCommonProps } from '../../../lib/telemetry.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = join(__dirname, '../../../scripts/evaluate.mjs');
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

function runEvaluateScript(args) {
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
    track('cmd_evaluate_agent', { ...commonProps, agent: true }, { args });
  } else {
    track('cmd_evaluate', { ...commonProps, agent: false }, { args });
  }

  const exitCode = await runEvaluateScript(scriptArgs);

  if (exitCode !== 0) {
    process.exit(exitCode);
  }

  if (!useAgent) {
    console.log('📝 Next step:');
    if (slug && slug !== 'all') {
      console.log(`   Run: design evaluate ${slug} --agent`);
    } else {
      console.log('   Run: design evaluate <project> --agent');
    }
    console.log('');
    console.log('   Or manually: open _evaluate_prompt.md in Cursor → Cmd+I → Agent mode');
    console.log('');
    return;
  }

  if (!slug || slug === 'all') {
    console.log('');
    console.log('⚠️  --agent requires a single project slug, not "all".');
    console.log('   Example: design evaluate my-project --agent');
    console.log('');
    process.exit(1);
  }

  const workspaceRoot = findWorkspaceRoot();
  const projectPath = join(workspaceRoot, 'projects', slug);
  const insightsPath = join(projectPath, 'insights');
  const promptPath = join(insightsPath, 'prompts', '_evaluate_prompt.md');
  const studentFeedbackPath = join(insightsPath, 'student-feedback.md');
  const mentoringNotesPath = join(insightsPath, 'mentoring-notes.md');

  if (!existsSync(promptPath)) {
    console.error('');
    console.error(`❌ Prompt file not found: ${promptPath}`);
    console.error('');
    process.exit(1);
  }

  const {
    runCursorAgent,
    isCursorAgentAvailable,
    printMissingAgentInstructions,
    printAuthInstructions
  } = await import('../../integrations/cursor-agent.mjs');

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
      console.log(`   design evaluate ${slug} --agent`);
      console.log('');
    } else {
      console.error('');
      console.error(`❌ Agent failed: ${result.error}`);
      console.error('');
    }
    process.exit(1);
  }

  console.log('');
  const hasStudentFeedback = existsSync(studentFeedbackPath);
  const hasMentoringNotes = existsSync(mentoringNotesPath);

  if (hasStudentFeedback && hasMentoringNotes) {
    console.log('✅ Evaluate complete!');
    console.log('');
    console.log('📝 Next steps:');
    console.log(`   1. Read mentoring-notes.md for session prep`);
    console.log(`   2. Send student-feedback.md to the mentee`);
    console.log(`   3. session-log.md updated with this session`);
    console.log('');
  } else {
    console.log('⚠️  Agent completed but expected outputs were not found.');
    console.log('   Expected: student-feedback.md and mentoring-notes.md');
    console.log('   Try running again or check the prompt file manually.');
  }
  console.log('');
}
