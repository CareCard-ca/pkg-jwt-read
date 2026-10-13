'use strict';

const { runIndexedMochaTests } = require('../scripts/testParallel/runIndexedMochaTests.cjs');

const parallelTestFiles = ['test/configuredTokens.test.js', 'test/jwtKeyRotation.test.js'];

if (require.main === module) {
  runIndexedMochaTests(parallelTestFiles)
    .then(exitCode => {
      process.exitCode = exitCode;
    })
    .catch(error => {
      console.error(error);
      process.exitCode = 1;
    });
}

module.exports = { parallelTestFiles };
