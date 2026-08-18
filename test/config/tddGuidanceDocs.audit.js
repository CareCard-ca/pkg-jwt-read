'use strict';

const assert = require('assert');
const { execFileSync } = require('child_process');
const { existsSync, readFileSync } = require('fs');
const { describe, it } = require('mocha');

const TDD_GUIDANCE =
  'Non-negotiable TDD rule: Always write the failing test first, run it to confirm it fails for the intended reason, then implement the code and rerun the test until it passes. Test Driven Development is required for all coding work and must not be skipped. For documentation- or skill-only edits, run the relevant focused non-test validation before changing the prose; do not add automated tests that inspect prose, files, or repository structure.';

const CODE_ORGANIZATION_GUIDANCE =
  "Non-negotiable code organization rule: Functions with the same or equivalent behavior must use the same or clearly corresponding descriptive names across CareCard repositories, and equivalent functionality must live in files with the same names within each repository's established architecture. No backward compatibility names, aliases, or duplicate locations are allowed.";

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function containsGuidanceOrReference(filePath, expectedGuidance, visitedPaths = new Set()) {
  if (visitedPaths.has(filePath)) {
    return false;
  }

  const fileContent = readFileSync(filePath, 'utf8');
  if (normalizeWhitespace(fileContent).includes(expectedGuidance)) {
    return true;
  }

  const nextVisitedPaths = new Set(visitedPaths).add(filePath);
  return [...fileContent.matchAll(/\$([a-z0-9-]+)/g)].some(([, skillName]) => {
    const referencedSkillPath = `.agents/skills/${skillName}/SKILL.md`;
    return (
      existsSync(referencedSkillPath) &&
      containsGuidanceOrReference(referencedSkillPath, expectedGuidance, nextVisitedPaths)
    );
  });
}

function listTrackedGuidanceFiles() {
  const output = execFileSync(
    'git',
    [
      'ls-files',
      '--cached',
      '--others',
      '--exclude-standard',
      '--',
      'README.md',
      'readme.md',
      '*/README.md',
      '*/readme.md',
      '.agents/skills/*/SKILL.md',
    ],
    {
      cwd: process.cwd(),
      encoding: 'utf8',
    },
  );

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
  const output = execFileSync(
    'git',
    ['ls-files', '--cached', '--others', '--exclude-standard', '--', '*.md'],
    {
      cwd: process.cwd(),
      encoding: 'utf8',
    },
  );

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
  it('documents or references the non-negotiable TDD rule in every README and skill', function () {
    const expectedGuidance = normalizeWhitespace(TDD_GUIDANCE);
    const missingGuidance = listTrackedGuidanceFiles().filter(
      filePath => !containsGuidanceOrReference(filePath, expectedGuidance),
    );

    assert.deepStrictEqual(missingGuidance, []);
  });

  it('documents or references the code organization rule in every Markdown file', function () {
    const expectedGuidance = normalizeWhitespace(CODE_ORGANIZATION_GUIDANCE);
    const missingGuidance = listTrackedMarkdownFiles().filter(
      filePath => !containsGuidanceOrReference(filePath, expectedGuidance),
    );

    assert.deepStrictEqual(missingGuidance, []);
  });
});
