#!/usr/bin/env node

'use strict';

import AdmZip from 'adm-zip';
import { spawn } from 'child_process';
import { program } from 'commander';
import { readJsonFromRoot } from '../lib/utils.js';

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
  .action((name, options) => {
    const ng = spawn('ng', ['serve', name]);
    ng.stdout.on('data', data => {
      console.log(`${data}`);
    });
    ng.stderr.on('data', data => {
      console.error(`${data}`);
    });
    ng.on('close', code => {});
  });

adviz
  .command('package')
  .usage('<argument> [options]')
  .argument('<name>', 'The name of the project to package.')
  .action((name, options) => {
    const ng = spawn('ng', ['build', name]);
    ng.stdout.on('data', data => {
      console.log(`${data}`);
    });
    ng.stderr.on('data', data => {
      console.error(`${data}`);
    });
    ng.on('close', code => {
      if (code == 0) {
        const zip = new AdmZip();
        zip.addLocalFolder(rootPath + `/dist/${name}`);
        zip.writeZip(rootPath + `/dist/${name}.zip`, () => {
          console.log('Package created.');
        });
      }
    });
  });

adviz
  .command('publish')
  .usage('<argument> [options]')
  .argument('<name>', 'The name of the project to publish.')
  .action((name, options) => {});

program.parse(process.argv);
