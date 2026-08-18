'use strict';

const { spawn } = require('node:child_process');
const { createRequire } = require('node:module');
const { availableParallelism } = require('node:os');
const { resolve } = require('node:path');

const DEFAULT_MAX_PARALLEL_JOBS = 4;

// Pattern: Configuration Boundary - bounds workers without accepting invalid input.
function resolveParallelJobCount(
  configuredJobCount,
  testFileCount,
  defaultMaximum = DEFAULT_MAX_PARALLEL_JOBS,
  availableJobCount = availableParallelism(),
) {
  const requestedJobCount =
    configuredJobCount === undefined
      ? Math.min(availableJobCount, defaultMaximum)
      : Number.parseInt(configuredJobCount, 10);

  if (!Number.isInteger(requestedJobCount) || requestedJobCount < 1) {
    throw new Error('TEST_PARALLEL_JOBS must be a positive integer.');
  }
  return Math.min(requestedJobCount, testFileCount);
}

// Pattern: Command Builder - keeps Mocha worker details out of package metadata.
function buildMochaArguments(testFiles, jobCount) {
  const requireFromRunner = createRequire(__filename);
  return [
    requireFromRunner.resolve('mocha/bin/mocha.js'),
    '--parallel',
    '--jobs',
    String(jobCount),
    '--require',
    resolve('scripts/testOrder/randomizeTestOrder.cjs'),
    ...testFiles,
  ];
}

// Pattern: Process Adapter - returns the exact test process result to the index.
function runIndexedMochaTests(testFiles) {
  if (testFiles.length === 0) {
    throw new Error('The package test index must select at least one test file.');
  }

  const jobCount = resolveParallelJobCount(process.env.TEST_PARALLEL_JOBS, testFiles.length);
  const child = spawn(process.execPath, buildMochaArguments(testFiles, jobCount), {
    env: {
      ...process.env,
      NODE_ENV: 'test',
    },
    stdio: 'inherit',
  });

  return new Promise((resolveExit, rejectExit) => {
    child.once('error', rejectExit);
    child.once('exit', (code, signal) => {
      if (signal) {
        rejectExit(new Error(`Mocha exited from signal ${signal}.`));
        return;
      }
      resolveExit(code ?? 1);
    });
  });
}

module.exports = {
  buildMochaArguments,
  resolveParallelJobCount,
  runIndexedMochaTests,
};
