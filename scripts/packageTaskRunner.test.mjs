import assert from 'node:assert/strict';
import test from 'node:test';

async function loadPackageTaskRunner() {
  return import(new URL('./runPackageTask.mjs', import.meta.url));
}

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

test('merges task environment overrides without mutating inherited values', async () => {
  const { createTaskEnvironment } = await loadPackageTaskRunner();
  const inheritedEnvironment = { NODE_ENV: 'test', PATH: '/bin' };

  const environment = createTaskEnvironment(
    { NODE_ENV: 'production', DB_ENV: 'privileged' },
    inheritedEnvironment,
  );

  assert.deepEqual(environment, {
    NODE_ENV: 'production',
    PATH: '/bin',
    DB_ENV: 'privileged',
  });
  assert.deepEqual(inheritedEnvironment, { NODE_ENV: 'test', PATH: '/bin' });
});
