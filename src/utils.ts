import fs from 'fs-extra';
import https from 'https';
import { fileURLToPath } from 'node:url';
import path from 'path';

export function download(url: string, pathToFile: string) {
  return new Promise((resolve, reject) => {
    const fileStream = fs.createWriteStream(pathToFile);
    https
      .get(url, res => {
        res.pipe(fileStream);
        fileStream.on('close', () => resolve(fileStream));
        res.on('error', error => reject(error));
      })
      .on('error', error => reject(error));
  });
}

export function createFolder(folderName: string) {
  const folder = path.join('./', folderName);
  fs.ensureDirSync(folder);
  return folder;
}

export function getRootPath(): string {
  const pathToDirectory = fileURLToPath(import.meta.url);
  return path.join(pathToDirectory, '..', '..');
}

export function getTemplatePath(): string {
  return path.join(getRootPath(), 'templates');
}

function readFileFromRoot(filePath: string) {
  return fs.readFileSync(path.join(getRootPath(), filePath), 'utf8');
}

export function readJsonFromRoot(filePath: string) {
  return JSON.parse(readFileFromRoot(filePath));
}

export function readJsonFromVisual(filePath: string, visualPath?: string) {
  return JSON.parse(fs.readFileSync(path.join(visualPath ?? process.cwd(), filePath), 'utf8'));
}

function replacePlaceholders(content: string, vars: Record<string, string>): string {
  return Object.keys(vars).reduce((acc, key) => {
    return acc.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), vars[key]);
  }, content);
}

/**
 * Copy a template directory recursively to a destination, replacing {{placeholders}} in each file.
 */
export function copyTemplateDir(
  templateDir: string,
  destDir: string,
  vars: Record<string, string>
): void {
  fs.ensureDirSync(destDir);
  const entries = fs.readdirSync(templateDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(templateDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyTemplateDir(srcPath, destPath, vars);
    } else {
      const content = fs.readFileSync(srcPath, 'utf8');
      const replaced = replacePlaceholders(content, vars);
      fs.writeFileSync(destPath, replaced);
    }
  }
}

/**
 * Read angular.json, add a project entry, write it back.
 */
export function addProjectToAngularJson(
  rootPath: string,
  projectName: string,
  projectConfig: object
): void {
  const angularJsonPath = path.join(rootPath, 'angular.json');
  const angularJson = JSON.parse(fs.readFileSync(angularJsonPath, 'utf8'));
  angularJson.projects[projectName] = projectConfig;
  fs.writeFileSync(angularJsonPath, JSON.stringify(angularJson, null, 2) + '\n');
}

/**
 * Auto-detect the next available port by scanning existing projects' package.json server fields.
 */
export function getNextPort(rootPath: string): number {
  const angularJsonPath = path.join(rootPath, 'angular.json');
  const angularJson = JSON.parse(fs.readFileSync(angularJsonPath, 'utf8'));
  const projects = angularJson.projects || {};
  let maxPort = 4200;

  for (const name of Object.keys(projects)) {
    const pkgPath = path.join(rootPath, projects[name].root, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        if (pkg.server) {
          const port = parseInt(new URL(pkg.server).port, 10);
          if (!isNaN(port) && port > maxPort) {
            maxPort = port;
          }
        }
      } catch {
        // ignore invalid package.json
      }
    }
  }

  return maxPort + 1;
}
