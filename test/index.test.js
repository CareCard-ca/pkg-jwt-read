'use strict';

const { runIndexedMochaTests } = require('../scripts/testParallel/runIndexedMochaTests.cjs');

const parallelTestFiles = [
  'test/config/errorWarningSuppression.test.js',
  'test/config/repositoryIsolation.test.js',
  'test/config/serverAuthEmailVerificationDocs.test.js',
  'test/config/tddGuidanceDocs.test.js',
  'test/jwtLib.test.js',
  'test/jwtRoles.test.js',
];

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
