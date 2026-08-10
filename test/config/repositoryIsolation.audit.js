'use strict';

const assert = require('assert');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { describe, it } = require('mocha');

const REPOSITORY_ISOLATION_GUIDANCE =
  'Non-negotiable repository isolation rule: Every repository must run its Husky hooks and tests using only files, code, fixtures, dependencies, and services contained within that repository. Tests and Husky scripts must not import, require, read, execute, or otherwise depend on sibling repositories or paths outside the repository root. app-e2e-tests is the only exception because cross-repository end-to-end testing is its explicit responsibility.';
const repositoryRoot = process.cwd();
const huskyDirectory = path.join(repositoryRoot, '.husky');
const validationDirectories = ['test', 'tests']
  .map(directoryName => path.join(repositoryRoot, directoryName))
  .filter(directoryPath => fs.existsSync(directoryPath));
const validationFileExtensions = new Set(['.cjs', '.js', '.mjs', '.mts', '.ts', '.tsx']);

// Pattern: Composite - recursively collects the files that form the local validation tree.
function listValidationFiles(directoryPath) {
  return fs.readdirSync(directoryPath, { withFileTypes: true }).flatMap(directoryEntry => {
    const entryPath = path.join(directoryPath, directoryEntry.name);
    if (directoryEntry.isDirectory()) return listValidationFiles(entryPath);
    return directoryEntry.isFile() && validationFileExtensions.has(path.extname(directoryEntry.name)) ? [entryPath] : [];
  });
}

// Pattern: Pure Function - extracts static relative module imports for repository-boundary validation.
function extractRelativeModuleSpecifiers(source) {
  const moduleSpecifiers = [];
  const modulePatterns = [
    /\brequire\s*\(\s*['"](\.{1,2}\/[^'"]+)['"]\s*\)/g,
    /\bimport\s*\(\s*['"](\.{1,2}\/[^'"]+)['"]\s*\)/g,
    /\bfrom\s*['"](\.{1,2}\/[^'"]+)['"]/g,
    /\bimport\s*['"](\.{1,2}\/[^'"]+)['"]/g,
  ];

  for (const modulePattern of modulePatterns) {
    for (const match of source.matchAll(modulePattern)) moduleSpecifiers.push(match[1]);
  }

  return moduleSpecifiers;
}

// Pattern: Guard Clause - rejects paths that escape the current repository.
function isInsideRepository(candidatePath) {
  const relativePath = path.relative(repositoryRoot, candidatePath);
  return relativePath === '' || (!relativePath.startsWith(`..${path.sep}`) && relativePath !== '..' && !path.isAbsolute(relativePath));
}

// Pattern: Query Object - lists only local tracked or pending Markdown documentation.
function listTrackedMarkdownFiles() {
  const output = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '*.md'], {
    cwd: repositoryRoot,
    encoding: 'utf8',
  });

  return output
    .split('\n')
    .filter(Boolean)
    .filter(filePath => fs.existsSync(path.join(repositoryRoot, filePath)))
    .sort();
}

// Pattern: Pure Function - normalizes prose without weakening the exact canonical contract.
function normalizeWhitespace(value) {
  return value.replace(/\s+/g, ' ').trim();
}

describe('Repository-isolated Husky validation', function () {
  it('anchors every direct Husky script to its own repository root', function () {
    const hookPaths = fs
      .readdirSync(huskyDirectory, { withFileTypes: true })
      .filter(directoryEntry => directoryEntry.isFile())
      .map(directoryEntry => path.join(huskyDirectory, directoryEntry.name));

    assert.ok(hookPaths.length > 0, 'expected at least one direct Husky script');

    for (const hookPath of hookPaths) {
      const hookSource = fs.readFileSync(hookPath, 'utf8');
      assert.match(
        hookSource,
        /repository_root="\$\(CDPATH= cd -- "\$\(dirname -- "\$0"\)\/\.\." && pwd\)"/,
        `${path.relative(repositoryRoot, hookPath)} must derive the repository root from its own path`,
      );
      assert.match(
        hookSource,
        /cd "\$repository_root"/,
        `${path.relative(repositoryRoot, hookPath)} must run commands from its own repository root`,
      );
    }
  });

  it('keeps static relative validation imports inside the current repository', function () {
    const outsideImports = [];

    for (const validationDirectory of validationDirectories) {
      for (const validationFilePath of listValidationFiles(validationDirectory)) {
        const validationSource = fs.readFileSync(validationFilePath, 'utf8');
        for (const moduleSpecifier of extractRelativeModuleSpecifiers(validationSource)) {
          const resolvedPath = path.resolve(path.dirname(validationFilePath), moduleSpecifier);
          if (!isInsideRepository(resolvedPath)) {
            outsideImports.push(`${path.relative(repositoryRoot, validationFilePath)} -> ${moduleSpecifier}`);
          }
        }
      }
    }

    assert.deepStrictEqual(outsideImports, []);
  });

  it('documents the non-negotiable repository isolation rule in every tracked Markdown file', function () {
    const expectedGuidance = normalizeWhitespace(REPOSITORY_ISOLATION_GUIDANCE);
    const missingGuidance = listTrackedMarkdownFiles().filter(filePath => {
      const fileContent = fs.readFileSync(path.join(repositoryRoot, filePath), 'utf8');
      return !normalizeWhitespace(fileContent).includes(expectedGuidance);
    });

    assert.deepStrictEqual(missingGuidance, []);
  });
});
