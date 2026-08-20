import { ESLint } from 'eslint';

const eslint = new ESLint();

// Pattern: Pure Function - builds one deterministic command without shell interpolation.
const createCommand = (command, filePaths) =>
  `${command} ${filePaths.map(filePath => JSON.stringify(filePath)).join(' ')}`;

// Pattern: Adapter - derives lint-staged input from ESLint's authoritative ignore rules.
const removeEslintIgnoredFiles = async filePaths => {
  const ignoredFileStates = await Promise.all(
    filePaths.map(filePath => eslint.isPathIgnored(filePath)),
  );

  return filePaths.flatMap((filePath, index) => (ignoredFileStates[index] ? [] : [filePath]));
};

// Pattern: Pipeline - preserves ESLint-before-Prettier ordering for staged code.
const createJavaScriptTasks = async filePaths => {
  const lintableFilePaths = await removeEslintIgnoredFiles(filePaths);
  const tasks = [];

  if (lintableFilePaths.length > 0) {
    tasks.push(createCommand('eslint --fix --max-warnings 0', lintableFilePaths));
  }

  tasks.push(createCommand('prettier --write', filePaths));
  return tasks;
};

const lintStagedConfig = {
  '*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}': createJavaScriptTasks,
  '*.{json,jsonc,md,mdx,css,scss,yaml,yml}': ['prettier --write'],
};

export default lintStagedConfig;
