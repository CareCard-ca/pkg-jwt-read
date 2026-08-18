'use strict';

const MAX_TEST_ORDER_SEED = 2_147_483_647;

function resolveTestOrderSeed(configuredSeed) {
  if (configuredSeed === undefined) {
    return undefined;
  }
  if (!/^[1-9]\d*$/.test(configuredSeed)) {
    throw new Error('TEST_ORDER_SEED must be a positive 32-bit integer.');
  }
  const seed = Number(configuredSeed);
  if (!Number.isSafeInteger(seed) || seed > MAX_TEST_ORDER_SEED) {
    throw new Error('TEST_ORDER_SEED must be a positive 32-bit integer.');
  }
  return seed;
}
function createSeededRandom(seed) {
  let state = seed;
  return function nextRandomValue() {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}
function shuffleValues(values, random) {
  for (let index = values.length - 1; index > 0; index -= 1) {
    const replacementIndex = Math.floor(random() * (index + 1));
    [values[index], values[replacementIndex]] = [values[replacementIndex], values[index]];
  }
}
function shuffleSuiteTree(suite, random) {
  for (const childSuite of suite.suites) {
    shuffleSuiteTree(childSuite, random);
  }
  shuffleValues(suite.tests, random);
  shuffleValues(suite.suites, random);
}
const mochaHooks = {
  beforeAll() {
    const seed = resolveTestOrderSeed(process.env.TEST_ORDER_SEED);
    if (seed === undefined) {
      return;
    }
    console.log(`Test order seed: ${seed} (reproduce with TEST_ORDER_SEED=${seed})`);
    shuffleSuiteTree(this.test.parent, createSeededRandom(seed));
  },
};
module.exports = { createSeededRandom, mochaHooks, resolveTestOrderSeed, shuffleSuiteTree };
