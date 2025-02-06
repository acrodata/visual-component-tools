#!/usr/bin/env node

"use strict";

import { readJsonFromRoot } from '../lib/utils.js';
import { program, Option } from 'commander';

const npmPackage = readJsonFromRoot('package.json');
const rootPath = process.cwd();

const adviz = program
  .version(npmPackage.version)
  .showHelpAfterError('Run "adviz help" for usage instructions.')
  .addHelpText('beforeAll', `${npmPackage.name} version - ${npmPackage.version}`);

adviz
  .command('info')
  .description('Displays visual info')
  .action(() => {});

program.parse(process.argv);
