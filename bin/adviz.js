#!/usr/bin/env node

'use strict';

import { program } from 'commander';
import { readJsonFromRoot } from '../lib/utils.js';
import CommandManager from '../lib/command-manager.js';

const npmPackage = readJsonFromRoot('package.json');
const rootPath = process.cwd();

const adviz = program
  .version(npmPackage.version)
  .showHelpAfterError('Run "adviz help" for usage instructions.')
  .addHelpText('beforeAll', `${npmPackage.name} version - ${npmPackage.version}`);

adviz
  .command('start')
  .usage('<argument> [options]')
  .argument('<name>', 'The name of the project to build.')
  .option('-p, --port [port]', 'Set the port listening on')
  .action((name, options) => {
    CommandManager.start(name, options, rootPath);
  });

adviz
  .command('package')
  .usage('<argument> [options]')
  .argument('<name>', 'The name of the project to package.')
  .action((name, options) => {
    CommandManager.package(name, options, rootPath);
  });

adviz
  .command('publish')
  .usage('<argument> [options]')
  .argument('<name>', 'The name of the project to publish.')
  .action((name, options) => {
    CommandManager.publish(name, options, rootPath);
  });

program.parse(process.argv);
