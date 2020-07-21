/**
 * @license
 * Copyright 2020 Dynatrace LLC
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { lint } from 'stylelint';
import { junitFormatter } from './junit-formatter';
import { writeFileSync } from 'fs';
import { options } from 'yargs';

const { BAZEL_NODE_RUNFILES_HELPER, XML_OUTPUT_FILE } = process.env;

if (!BAZEL_NODE_RUNFILES_HELPER || !XML_OUTPUT_FILE) {
  throw new Error('Bazel environment variables are not set!');
}

// bazel run files helper used to resolve paths that are created with `$(location ...)`
const runFilesHelper = require(BAZEL_NODE_RUNFILES_HELPER);

const { files, allowEmpty, config } = options({
  files: { type: 'array', demandOption: true },
  config: { type: 'string', demandOption: true },
  allowEmpty: { type: 'boolean', default: false },
}).argv;

/** Main function that executes the linting */
async function main(): Promise<void> {
  if (!allowEmpty && files.length === 0) {
    throw Error('No files found for linting');
  }

  const lintingOutcome = await lint({
    configFile: runFilesHelper.resolve(config),
    files: files.map((f) => runFilesHelper.resolve(f)),
    formatter: junitFormatter,
  });

  writeFileSync(XML_OUTPUT_FILE as string, lintingOutcome.output);

  if (lintingOutcome.errored) {
    throw new Error('Lint errors found in the listed files.');
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
