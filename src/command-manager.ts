import AdmZip from 'adm-zip';
import { spawn } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import { env } from 'process';
import {
  addProjectToAngularJson,
  copyTemplateDir,
  getNextPort,
  getTemplatePath,
  readJsonFromVisual,
} from './utils.js';

function getNgJson() {
  return readJsonFromVisual('angular.json');
}

export default class CommandManager {
  public static start(name: string, options: Record<string, string>, rootPath: string) {
    // Store the visual name in the node environment
    env.VISUAL_NAME = name;

    const ngJson = getNgJson();
    const visualRoot = ngJson.projects[name].root;
    const pkgJson = readJsonFromVisual(`${visualRoot}/package.json`);

    // Get the port from the server field in the package.json
    let port = '';
    try {
      port = pkgJson.server ? new URL(pkgJson.server).port : '';
    } catch (e) {
      console.error(e);
    }

    const opts = Object.assign({ port }, options);

    // --port=4201 => { port: '4201' }  => ['--port=4201']
    // -p=4201     => { port: '=4201' } => ['--port=4201']
    const optsArr = Object.keys(opts).map(key => {
      if (opts[key].startsWith('=')) {
        return `--${key}${opts[key]}`;
      }
      return `--${key}=${opts[key]}`;
    });

    const ng = spawn('ng', ['serve', name, ...optsArr]);

    ng.stdout.on('data', data => {
      console.log(`${data}`);
    });

    ng.stderr.on('data', data => {
      console.error(`${data}`);
    });

    ng.on('close', code => {});
  }

  public static package(name: string, options: Record<string, any>, rootPath: string) {
    // Store the visual name in the node environment
    env.VISUAL_NAME = name;

    const ng = spawn('ng', ['build', name]);

    ng.stdout.on('data', data => {
      console.log(`${data}`);
    });

    ng.stderr.on('data', data => {
      console.error(`${data}`);
    });

    ng.on('close', code => {
      if (code == 0) {
        const ngJson = getNgJson();
        const outputPath = ngJson.projects[name].architect.build.options.outputPath;
        const zip = new AdmZip();
        zip.addLocalFolder(outputPath);
        zip.writeZip(outputPath + '.zip', () => {
          console.log('Package created.');
        });
      }
    });
  }

  public static publish(name: string, options: any, rootPath: string) {}

  public static new(name: string, options: Record<string, any>, rootPath: string) {
    // Validate kebab-case name
    if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(name)) {
      console.error(`Error: "${name}" is not a valid kebab-case name.`);
      return;
    }

    const targetDir = path.join(rootPath, name);

    // Check directory doesn't already exist
    if (fs.existsSync(targetDir)) {
      console.error(`Error: Directory "${name}" already exists at ${targetDir}.`);
      return;
    }

    const className = name
      .split('-')
      .map(s => s.charAt(0).toUpperCase() + s.slice(1))
      .join('');

    const isWorkspace = !!options.workspace;
    const templateName = isWorkspace ? 'workspace' : 'project-new';
    const port = isWorkspace ? '' : '4200';

    const vars: Record<string, string> = {
      packageName: name,
      className,
    };
    if (port) {
      vars.port = port;
    }

    // Copy template
    const templateDir = path.join(getTemplatePath(), templateName);
    copyTemplateDir(templateDir, targetDir, vars);

    if (isWorkspace) {
      console.log(`Workspace "${name}" created successfully.`);
      console.log(`\nRun the following to add a project:`);
      console.log(`  cd ${name}`);
      console.log(`  adviz create <project-name>`);
    } else {
      console.log(`Project "${name}" created successfully.`);
      console.log(`Port: ${port}`);
      console.log(`\nRun the following to get started:`);
      console.log(`  cd ${name}`);
      console.log(`  adviz generate <component-name>`);
    }

    // Optionally run npm install
    if (!options.skipInstall) {
      console.log(`\nInstalling dependencies...`);
      const npm = spawn('npm', ['install', '--force'], { cwd: targetDir, stdio: 'inherit' });
      npm.on('close', code => {
        if (code === 0) {
          console.log(`\nDone. Happy coding!`);
        } else {
          console.error(`npm install exited with code ${code}.`);
        }
      });
    }
  }

  public static create(name: string, options: Record<string, any>, rootPath: string) {
    // Validate kebab-case name
    if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(name)) {
      console.error(`Error: "${name}" is not a valid kebab-case name.`);
      return;
    }

    const projectDir = path.join(rootPath, 'projects', name);

    // Check project doesn't already exist
    if (fs.existsSync(projectDir)) {
      console.error(`Error: Project "${name}" already exists at ${projectDir}.`);
      return;
    }

    // Ensure projects/ directory exists
    fs.ensureDirSync(path.join(rootPath, 'projects'));

    const port = getNextPort(rootPath);
    const className = name
      .split('-')
      .map(s => s.charAt(0).toUpperCase() + s.slice(1))
      .join('');

    const vars = {
      packageName: name,
      className,
      port: String(port),
    };

    // Copy project template
    const templateDir = path.join(getTemplatePath(), 'application');
    copyTemplateDir(templateDir, projectDir, vars);

    // Add project entry to angular.json
    const projectConfig = {
      projectType: 'application',
      root: `projects/${name}`,
      sourceRoot: `projects/${name}/src`,
      prefix: 'app',
      architect: {
        build: {
          builder: '@angular-builders/custom-webpack:browser',
          options: {
            outputPath: `dist/${name}`,
            index: `projects/${name}/src/index.html`,
            main: `projects/${name}/src/main.ts`,
            tsConfig: `projects/${name}/tsconfig.app.json`,
            inlineStyleLanguage: 'scss',
            assets: [
              { glob: 'package.json', input: `projects/${name}` },
              {
                glob: '**/*',
                ignore: ['**/*.html', '**/*.scss', '**/*.ts'],
                input: `projects/${name}/src`,
              },
            ],
            scripts: [],
            customWebpackConfig: {
              path: 'node_modules/@acrodata/visual-component-tools/lib/webpack.config.js',
            },
          },
          configurations: {
            production: {
              budgets: [
                { type: 'initial', maximumWarning: '3MB' },
                { type: 'anyComponentStyle', maximumWarning: '6kB' },
              ],
              outputHashing: 'all',
            },
            development: {
              buildOptimizer: false,
              optimization: false,
              vendorChunk: true,
              extractLicenses: false,
              sourceMap: true,
              namedChunks: true,
            },
          },
          defaultConfiguration: 'production',
        },
        serve: {
          builder: '@angular-builders/custom-webpack:dev-server',
          configurations: {
            production: { buildTarget: `${name}:build:production` },
            development: { buildTarget: `${name}:build:development` },
          },
          defaultConfiguration: 'development',
        },
      },
    };

    addProjectToAngularJson(rootPath, name, projectConfig);

    console.log(`Project "${name}" created successfully at projects/${name}/`);
    console.log(`Port: ${port}`);
    console.log(`\nRun the following to generate a component:`);
    console.log(`  adviz generate <component-name> --project=${name}`);
  }

  public static generate(name: string, options: Record<string, any>, rootPath: string) {
    // Validate kebab-case name
    if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(name)) {
      console.error(`Error: "${name}" is not a valid kebab-case component name.`);
      return;
    }

    const ngJson = getNgJson();
    const projects = Object.keys(ngJson.projects);

    let projectName = options.project;
    if (!projectName) {
      // Auto-detect for single-project setup
      if (projects.length === 1) {
        projectName = projects[0];
      } else {
        console.error('Error: --project option is required when multiple projects exist.');
        console.error(`Available projects: ${projects.join(', ')}`);
        return;
      }
    }

    if (!ngJson.projects[projectName]) {
      console.error(`Error: Project "${projectName}" does not exist in angular.json.`);
      return;
    }

    const projectConfig = ngJson.projects[projectName];
    const projectRoot = projectConfig.root || '';
    const projectDir = projectRoot ? path.join(rootPath, projectRoot) : rootPath;

    const componentDir = path.join(projectDir, 'src', name);
    if (fs.existsSync(componentDir)) {
      console.error(`Error: Component "${name}" already exists in project "${projectName}".`);
      return;
    }

    const componentClass = name
      .split('-')
      .map(s => s.charAt(0).toUpperCase() + s.slice(1))
      .join('');

    const vars = {
      componentName: name,
      componentClass,
    };

    // Copy component template
    const templateDir = path.join(getTemplatePath(), 'component');
    copyTemplateDir(templateDir, componentDir, vars);

    const relativePath = projectRoot ? `${projectRoot}/src/${name}/` : `src/${name}/`;
    console.log(`Component "${name}" generated in ${relativePath}`);
  }
}
