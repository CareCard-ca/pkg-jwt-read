import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative, resolve } from 'node:path';
import test from 'node:test';

const require = createRequire(import.meta.url);
const repositoryRoot = resolve(import.meta.dirname, '../..');
const packageJson = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
);
const packageTaskRunnerSource = readFileSync(
  new URL('../runPackageTask.mjs', import.meta.url),
  'utf8',
);
const testIndexSource = readFileSync(new URL('../../test/index.test.js', import.meta.url), 'utf8');
const { parallelTestFiles } = require('../../test/index.test.js');

function listRuntimeTestFiles(directoryPath) {
  return readdirSync(directoryPath, { withFileTypes: true }).flatMap(entry => {
    const entryPath = join(directoryPath, entry.name);
    if (entry.isDirectory()) {
      return listRuntimeTestFiles(entryPath);
    }
    if (!/\.test\.(?:js|mjs)$/.test(entry.name) || entry.name === 'index.test.js') {
      return [];
    }
    return [relative(repositoryRoot, entryPath)];
  });
}

test('keeps runtime test selection in the index and package scripts short', () => {
  assert.equal(packageJson.scripts.test, 'node scripts/runPackageTask.mjs test');
  assert.equal(
    packageJson.scripts['test:coverage'],
    'node scripts/runPackageTask.mjs test:coverage',
  );
  assert.match(packageTaskRunnerSource, /arguments: \['run', 'test:order'\]/);
  assert.match(packageTaskRunnerSource, /arguments: \['test\/index\.test\.js'\]/);
  assert.match(packageTaskRunnerSource, /command: 'nyc'/);
  assert.match(testIndexSource, /parallelTestFiles/);
  assert.match(testIndexSource, /runIndexedMochaTests/);
  assert.match(testIndexSource, /if \(require\.main === module\)/);
});

test('keeps parallel behavior tests in the test-order gate and static policy checks in the audit gate', () => {
  assert.match(
    packageJson.scripts['test:order'],
    /scripts\/testParallel\/runIndexedMochaTests\.test\.mjs/,
  );
  assert.equal(
    packageJson.scripts['validate:audits'],
    'node scripts/runPackageTask.mjs validate:audits',
  );
});

test('selects every runtime test file exactly once', () => {
  assert.deepEqual(
    [...parallelTestFiles].sort(),
    listRuntimeTestFiles(resolve(repositoryRoot, 'test')).sort(),
  );
});
