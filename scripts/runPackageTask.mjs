import { spawnSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const packageTasks = Object.freeze({
  test: [{ command: 'node', arguments: ['scripts/runFunctionalTests.cjs'] }],
  'test:types': [
    { command: 'tsc', arguments: ['--noEmit'] },
    {
      command: 'mocha',
      arguments: ['--require', './scripts/testOrder/randomizeTestOrder.cjs', '-r', 'ts-node/register', 'test/types.test.ts'],
    },
  ],
  'test:coverage': [
    { command: 'tsc', arguments: ['--noEmit'] },
    { command: 'nyc', arguments: ['node', 'scripts/runFunctionalTests.cjs'] },
  ],
  'test:All': [
    { command: 'npm', arguments: ['run', 'test'] },
    { command: 'npm', arguments: ['run', 'test:types'] },
  ],
});

export function createTaskEnvironment(overrides = {}, inheritedEnvironment = process.env) {
  return { ...inheritedEnvironment, ...overrides };
}

function getTaskExitCode(result) {
  if (result.error) throw result.error;
  if (typeof result.status === 'number') return result.status;
  if (result.signal === 'SIGINT') return 130;
  if (result.signal === 'SIGTERM') return 143;
  return 1;
}

export function executeTaskStep(taskStep) {
  if (taskStep.removePath) {
    rmSync(taskStep.removePath, { recursive: true, force: true });
    return 0;
  }

  const result = spawnSync(taskStep.command, taskStep.arguments ?? [], {
    env: createTaskEnvironment(taskStep.environment),
    shell: false,
    stdio: 'inherit',
  });
  return getTaskExitCode(result);
}

function shouldRunTaskStep(taskStep, pathExists) {
  return !taskStep.whenMissing || !pathExists(taskStep.whenMissing);
}

export function runPackageTask(taskName, executeTask = executeTaskStep, taskDefinitions = packageTasks, pathExists = existsSync) {
  const taskSteps = taskDefinitions[taskName];
  if (!Array.isArray(taskSteps)) throw new Error('Unknown package task.');

  for (const taskStep of taskSteps) {
    if (!shouldRunTaskStep(taskStep, pathExists)) continue;
    const exitCode = executeTask(taskStep);
    if (exitCode !== 0) return exitCode;
  }
  return 0;
}

function isDirectExecution() {
  if (!process.argv[1]) return false;
  return resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}

function runCommandLineTask() {
  const taskName = process.argv[2];
  if (!taskName || !packageTasks[taskName]) {
    process.stderr.write('[PACKAGE_TASK_CONFIG] Unknown package task.\n');
    process.exitCode = 2;
    return;
  }

  process.exitCode = runPackageTask(taskName);
}

if (isDirectExecution()) runCommandLineTask();
