'use strict';

const assert = require('assert');
const { execFileSync } = require('child_process');
const { readFileSync } = require('fs');
const { describe, it } = require('mocha');

const SUPPRESSION_DIRECTIVES = [
  ['istanbul', 'ignore'].join(' '),
  ['nyc', 'ignore'].join(' '),
  ['c8', 'ignore'].join(' '),
  ['eslint', 'disable'].join('-'),
  ['@ts', 'ignore'].join('-'),
  ['@ts', 'expect-error'].join('-'),
];

// Pattern: Repository Query - limits validation to tracked code in this package.
function listTrackedCodeFiles() {
  return execFileSync('git', ['ls-files', '*.js', '*.jsx', '*.ts', '*.tsx', '*.mjs', '*.cjs'], {
    cwd: process.cwd(),
    encoding: 'utf8',
  })
    .split('\n')
    .filter(Boolean)
    .filter(filePath => !filePath.includes('/node_modules/'))
    .filter(filePath => !filePath.includes('/coverage/'))
    .sort();
}

// Pattern: Pure Function - reports every forbidden directive with its source location.
function findSuppressionDirectives(filePath) {
  return readFileSync(filePath, 'utf8')
    .split('\n')
    .flatMap((line, index) =>
      SUPPRESSION_DIRECTIVES.filter(directive => line.includes(directive)).map(directive => `${filePath}:${index + 1}: ${directive}`),
    );
}

describe('Error and warning suppression guard', function () {
  // Pattern: Policy Test - prevents coverage, compiler, and linter suppression from returning.
  it('keeps tracked code free of suppression directives', function () {
    const violations = listTrackedCodeFiles().flatMap(findSuppressionDirectives);

    assert.deepStrictEqual(violations, []);
  });
});
