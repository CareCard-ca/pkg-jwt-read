'use strict';

const assert = require('assert');
const { execFileSync } = require('child_process');
const { readFileSync } = require('fs');
const { describe, it } = require('mocha');

const TDD_GUIDANCE =
  'Non-negotiable TDD rule: Always write the failing test first, run it to confirm it fails for the intended reason, then implement the code and rerun the test until it passes. Test Driven Development is required for all coding work and must not be skipped. For documentation- or skill-only edits, add or update the relevant validation check before changing the prose.';

const CODE_ORGANIZATION_GUIDANCE =
  "Non-negotiable code organization rule: Functions with the same or equivalent behavior must use the same or clearly corresponding descriptive names across CareCard repositories, and equivalent functionality must live in files with the same names within each repository's established architecture. No backward compatibility names, aliases, or duplicate locations are allowed.";

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function listTrackedGuidanceFiles() {
  const output = execFileSync('git', ['ls-files', 'README.md', 'readme.md', '*/README.md', '*/readme.md', '.agents/skills/*/SKILL.md'], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  return output
    .split('\n')
    .filter(Boolean)
    .filter(filePath => !filePath.includes('/node_modules/'))
    .filter(filePath => !filePath.includes('/.next/'))
    .filter(filePath => !filePath.includes('/dist/'))
    .filter(filePath => !filePath.includes('/coverage/'))
    .filter(filePath => !filePath.includes('/logs/'))
    .sort();
}

function listTrackedMarkdownFiles() {
  const output = execFileSync('git', ['ls-files', '*.md'], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  return output
    .split('\n')
    .filter(Boolean)
    .filter(filePath => !filePath.includes('/node_modules/'))
    .filter(filePath => !filePath.includes('/.next/'))
    .filter(filePath => !filePath.includes('/dist/'))
    .filter(filePath => !filePath.includes('/coverage/'))
    .filter(filePath => !filePath.includes('/logs/'))
    .sort();
}

describe('TDD guidance documentation', function () {
  it('documents the non-negotiable TDD rule in every tracked README and skill', function () {
    const expectedGuidance = normalizeWhitespace(TDD_GUIDANCE);
    const missingGuidance = listTrackedGuidanceFiles().filter(filePath => {
      const fileContent = readFileSync(filePath, 'utf8');
      return !normalizeWhitespace(fileContent).includes(expectedGuidance);
    });

    assert.deepStrictEqual(missingGuidance, []);
  });

  it('documents the non-negotiable cross-repository code organization rule in every tracked Markdown file', function () {
    const expectedGuidance = normalizeWhitespace(CODE_ORGANIZATION_GUIDANCE);
    const missingGuidance = listTrackedMarkdownFiles().filter(filePath => {
      const fileContent = readFileSync(filePath, 'utf8');
      return !normalizeWhitespace(fileContent).includes(expectedGuidance);
    });

    assert.deepStrictEqual(missingGuidance, []);
  });
});
