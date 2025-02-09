import { existsSync, readdirSync } from 'fs';
import { env } from 'process';
import webpack from 'webpack';
import { camelCase, capitalize } from 'lodash-es';
import { readJsonFromVisual } from './utils.js';

const ngJson = readJsonFromVisual('angular.json');
const projectName = env.VISUAL_NAME!;
const visualRoot = ngJson.projects[projectName].root;
const sourceRoot = ngJson.projects[projectName].sourceRoot;
const pkgJson = readJsonFromVisual(`${visualRoot}/package.json`);
const exposes = {};

const getDirectories = (source: string) =>
  readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

getDirectories(sourceRoot).forEach(dir => {
  const manifestPath = `${sourceRoot}/${dir}/manifest.json`;
  if (existsSync(manifestPath)) {
    const manifestJson = readJsonFromVisual(manifestPath);
    const exposedModule = capitalize(camelCase(manifestJson.name));
    exposes[exposedModule] = `./${sourceRoot}/${dir}`;
  }
});

const ModuleFederationPlugin = webpack.container.ModuleFederationPlugin;

export default {
  devServer: {
    liveReload: false,
  },
  output: {
    scriptType: 'text/javascript',
    publicPath: 'auto',
    uniqueName: pkgJson.name,
  },
  optimization: {
    runtimeChunk: false,
  },
  plugins: [
    new ModuleFederationPlugin({
      name: pkgJson.name,
      library: {
        type: 'var',
        name: pkgJson.name,
      },
      filename: pkgJson.filename,
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
