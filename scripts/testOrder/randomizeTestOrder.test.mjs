import assert from 'node:assert/strict';
import { test } from 'node:test';

import testOrderRandomizer from './randomizeTestOrder.cjs';

const { createSeededRandom, resolveTestOrderSeed, shuffleSuiteTree } = testOrderRandomizer;

function createSuiteTree() {
  return {
    suites: [
      { title: 'alpha', suites: [], tests: [{ title: 'one' }, { title: 'two' }] },
      { title: 'beta', suites: [], tests: [{ title: 'three' }, { title: 'four' }] },
      { title: 'gamma', suites: [], tests: [{ title: 'five' }, { title: 'six' }] },
    ],
    tests: [{ title: 'root one' }, { title: 'root two' }, { title: 'root three' }],
  };
}

test('uses ordinary ordering unless TEST_ORDER_SEED is explicitly supplied', () => {
  assert.strictEqual(resolveTestOrderSeed(undefined), undefined);
  assert.strictEqual(resolveTestOrderSeed('314159'), 314159);
  for (const invalidSeed of ['', '0', '-1', '1.5', 'seed', '2147483648']) {
    assert.throws(() => resolveTestOrderSeed(invalidSeed), /TEST_ORDER_SEED/);
  }
});

test('shuffles nested suites and tests reproducibly', () => {
  const firstTree = createSuiteTree();
  const secondTree = createSuiteTree();

  shuffleSuiteTree(firstTree, createSeededRandom(314159));
  shuffleSuiteTree(secondTree, createSeededRandom(314159));

  assert.deepStrictEqual(firstTree, secondTree);
  assert.notDeepStrictEqual(firstTree, createSuiteTree());
});
