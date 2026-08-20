import assert from 'node:assert/strict';
import test from 'node:test';

import { runPackageTask } from './runPackageTask.mjs';

test('the complete test command runs each validation category exactly once', () => {
  const executedSteps = [];

  const exitCode = runPackageTask('test', taskStep => {
    executedSteps.push([taskStep.command, ...(taskStep.arguments ?? [])].join(' '));
    return 0;
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(executedSteps, [
    'npm run validate:audits',
    'npm run test:order',
    'tsc --noEmit',
    'mocha --require ./scripts/testOrder/randomizeTestOrder.cjs -r ts-node/register test/types.test.ts',
    'nyc node test/index.test.js',
  ]);
});

test('the legacy aggregate command delegates to the complete test command once', () => {
  const executedSteps = [];

  runPackageTask('test:All', taskStep => {
    executedSteps.push([taskStep.command, ...(taskStep.arguments ?? [])].join(' '));
    return 0;
  });

  assert.deepEqual(executedSteps, ['npm test']);
});
