import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const { buildMochaArguments, resolveParallelJobCount } = require('./runIndexedMochaTests.cjs');

test('uses bounded Mocha file workers without randomized default ordering', () => {
  assert.equal(resolveParallelJobCount(undefined, 8, 4, 12), 4);
  assert.equal(resolveParallelJobCount('2', 8, 4, 12), 2);

  const argumentsList = buildMochaArguments(['test/example.test.js'], 2);

  assert.ok(argumentsList.includes('--parallel'));
  assert.deepEqual(
    argumentsList.slice(argumentsList.indexOf('--jobs'), argumentsList.indexOf('--jobs') + 2),
    ['--jobs', '2'],
  );
  assert.ok(argumentsList.includes('test/example.test.js'));
});

test('rejects invalid worker configuration instead of changing execution silently', () => {
  assert.throws(
    () => resolveParallelJobCount('0', 8, 4, 12),
    /TEST_PARALLEL_JOBS must be a positive integer/,
  );
});
