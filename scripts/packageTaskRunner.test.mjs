import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const composedCommandPattern = /&&|\|\||\bsh -c\b|\bnode -e\b/u;
const runnerCommandPattern = /^node scripts\/runPackageTask\.mjs ([A-Za-z0-9:_-]+)$/u;

async function loadPackageTaskRunner() {
  return import(new URL('./runPackageTask.mjs', import.meta.url));
}

test('delegates composed package tasks to the repository runner', async () => {
  const runnerCommands = Object.entries(packageJson.scripts ?? {}).filter(([, command]) => runnerCommandPattern.test(command));

  for (const [scriptName, command] of Object.entries(packageJson.scripts ?? {})) {
    assert.doesNotMatch(command, composedCommandPattern, `${scriptName} must delegate composition to runPackageTask.mjs`);
  }

  assert.ok(runnerCommands.length > 0, 'at least one package task must use the runner');
  const { packageTasks } = await loadPackageTaskRunner();
  for (const [scriptName] of runnerCommands) {
    assert.ok(packageTasks[scriptName], `${scriptName} must have a runner task`);
  }
});

test('runs task steps in order and stops at the first failure', async () => {
  const { runPackageTask } = await loadPackageTaskRunner();
  const executedCommands = [];
  const fixtureTasks = {
    fixture: [{ command: 'first' }, { command: 'second' }, { command: 'third' }],
  };

  const exitCode = runPackageTask(
    'fixture',
    step => {
      executedCommands.push(step.command);
      return step.command === 'second' ? 7 : 0;
    },
    fixtureTasks,
  );

  assert.equal(exitCode, 7);
  assert.deepEqual(executedCommands, ['first', 'second']);
});

test('runs conditional steps only when their required output is missing', async () => {
  const { runPackageTask } = await loadPackageTaskRunner();
  const executedCommands = [];
  const fixtureTasks = {
    fixture: [{ command: 'build', whenMissing: 'dist/runtime.js' }, { command: 'execute' }],
  };

  const exitCode = runPackageTask(
    'fixture',
    step => {
      executedCommands.push(step.command);
      return 0;
    },
    fixtureTasks,
    () => true,
  );

  assert.equal(exitCode, 0);
  assert.deepEqual(executedCommands, ['execute']);
});

test('does not suppress command execution errors at the CLI boundary', () => {
  const runnerSource = readFileSync(new URL('./runPackageTask.mjs', import.meta.url), 'utf8');

  assert.doesNotMatch(runnerSource, /catch\s*\{/u);
});

test('merges task environment overrides without mutating inherited values', async () => {
  const { createTaskEnvironment } = await loadPackageTaskRunner();
  const inheritedEnvironment = { NODE_ENV: 'test', PATH: '/bin' };

  const environment = createTaskEnvironment({ NODE_ENV: 'production', DB_ENV: 'privileged' }, inheritedEnvironment);

  assert.deepEqual(environment, {
    NODE_ENV: 'production',
    PATH: '/bin',
    DB_ENV: 'privileged',
  });
  assert.deepEqual(inheritedEnvironment, { NODE_ENV: 'test', PATH: '/bin' });
});
