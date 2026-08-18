import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const TEST_ORDER_INVARIANCE_RULE =
  "Non-negotiable test order invariance rule: Every test must pass independently of which tests run before or after it, and the suite must pass in every execution order. Each test must establish the state it needs, isolate mutable state, and clean up state it owns; it must never rely on another test's setup, mutations, or cleanup. Default test, CI, and Husky commands must use the test framework's ordinary ordering and must not force randomized ordering. Random-order execution is an explicit diagnostic only, and every failure it exposes must be fixed at the root cause.";

function listRepositoryFiles() {
  return execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
    encoding: 'utf8',
  })
    .trim()
    .split('\n')
    .filter(Boolean);
}

function isRequiredTestGuidance(filePath) {
  return (
    /^readme\.md$/i.test(filePath) ||
    filePath === '.codex/AGENTS.md' ||
    filePath === '.junie/guidelines.md' ||
    filePath === '.agents/skills/carecard-workspace-standards/SKILL.md' ||
    /^\.agents\/skills\/[^/]*(?:test|testing)[^/]*\/(?:SKILL\.md|references\/[^/]*(?:test|testing|coding-principles)[^/]*\.md)$/i.test(
      filePath,
    )
  );
}

test('keeps the non-negotiable test order rule in repository guidance', () => {
  const guidanceFiles = listRepositoryFiles().filter(isRequiredTestGuidance);
  assert.ok(guidanceFiles.length > 0, 'No repository test guidance was found.');

  for (const guidanceFile of guidanceFiles) {
    const normalizedGuidance = readFileSync(guidanceFile, 'utf8').replace(/\s+/g, ' ').trim();
    assert.ok(
      normalizedGuidance.includes(TEST_ORDER_INVARIANCE_RULE),
      `${guidanceFile} must document the non-negotiable test order invariance rule.`,
    );
  }
});

test('keeps default package scripts on the test framework ordinary ordering', () => {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));

  for (const [scriptName, command] of Object.entries(packageJson.scripts ?? {})) {
    assert.equal(typeof command, 'string', `${scriptName} must be a string command.`);
    assert.doesNotMatch(
      command,
      /--test-randomize|--test-random-seed/,
      `${scriptName} must not force randomized test ordering.`,
    );
  }
});
