import { existsSync, readdirSync } from 'fs';
import { camelCase, upperFirst } from 'lodash-es';
import { env } from 'process';
import webpack from 'webpack';
import { readJsonFromVisual } from './utils.js';

const ModuleFederationPlugin = webpack.container.ModuleFederationPlugin;

const ngJson = readJsonFromVisual('angular.json');
const projectName = env.VISUAL_NAME!;
const visualRoot = ngJson.projects[projectName].root;
const sourceRoot = ngJson.projects[projectName].sourceRoot;
const pkgJson = readJsonFromVisual(`${visualRoot}/package.json`);
const exposes: Record<string, string> = {};

const getDirectories = (source: string) =>
  readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

getDirectories(sourceRoot).forEach(dir => {
  const manifestPath = `${sourceRoot}/${dir}/manifest.json`;
  if (existsSync(manifestPath)) {
    const manifestJson = readJsonFromVisual(manifestPath);
    const exposedModule = upperFirst(camelCase(manifestJson.name));
    exposes[exposedModule] = `./${sourceRoot}/${dir}`;
  }
});

const ngCorePkgJson = readJsonFromVisual('node_modules/@angular/core/package.json');
const ngVersion = ngCorePkgJson.version;
const ngMajorVersion = ngVersion.split('.')[0];

export default {
  devServer: {
    allowedHosts: 'all',
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
        type: 'window',
        name: ['__VISAPP_VISUAL_PLUGINS__', pkgJson.name],
      },
      filename: pkgJson.filename,
      exposes,
      shared: {
        '@angular/core': {
          singleton: true,
          eager: true,
          requiredVersion: `^${ngMajorVersion}.0.0`,
        },
        '@angular/common': {
          singleton: true,
          eager: true,
          requiredVersion: `^${ngMajorVersion}.0.0`,
        },
        '@angular/forms': {
          singleton: true,
          eager: true,
          requiredVersion: `^${ngMajorVersion}.0.0`,
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
