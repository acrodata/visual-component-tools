import webpack from 'webpack';

import { readdirSync } from 'fs';
import { env } from 'process';

import { camelCase, capitalize } from 'lodash-es';
import { readJsonFromVisual } from './utils.js';

const ngJson = readJsonFromVisual('angular.json');
const projectName = env.VISUAL_NAME!;
const visualRoot = ngJson.projects[projectName].root;
const sourceRoot = ngJson.projects[projectName].sourceRoot;
const pkg = readJsonFromVisual(visualRoot + '/package.json');
const exposes = {};

const getDirectories = (source: string) =>
  readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

getDirectories(sourceRoot).forEach(dir => {
  const exposedModule = capitalize(camelCase(dir));
  exposes[exposedModule] = `./${sourceRoot}/${dir}/${dir}.component.ts`;
});

const ModuleFederationPlugin = webpack.container.ModuleFederationPlugin;

export default {
  devServer: {
    liveReload: false,
  },
  output: {
    scriptType: 'text/javascript',
    publicPath: 'auto',
    uniqueName: pkg.name,
  },
  optimization: {
    runtimeChunk: false,
  },
  plugins: [
    new ModuleFederationPlugin({
      name: pkg.name,
      library: {
        type: 'var',
        name: pkg.name,
      },
      filename: pkg.filename,
      exposes,
      shared: {
        '@angular/core': {
          singleton: true,
          eager: true,
          requiredVersion: '^18.0.0',
        },
        '@angular/common': {
          singleton: true,
          eager: true,
          requiredVersion: '^18.0.0',
        },
        '@angular/forms': {
          singleton: true,
          eager: true,
          requiredVersion: '^18.0.0',
        },
        'rxjs': {
          singleton: true,
          eager: true,
          requiredVersion: '^7.8.0',
        },
      },
    }),
  ],
};
