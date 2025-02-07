import { spawn } from 'child_process';
import { env } from 'process';
import AdmZip from 'adm-zip';

export default class CommandManager {
  public static start(name: string, options: Record<string, string>, rootPath: string) {
    // Store the visual name in the node environment
    env.VISUAL_NAME = name;

    // --port=4201 => { port: '4201' }  => ['--port=4201']
    // -p=4201     => { port: '=4201' } => ['--port=4201']
    const optsArr = Object.keys(options).map(key => {
      if (options[key].startsWith('=')) {
        return `--${key}${options[key]}`;
      }
      return `--${key}=${options[key]}`;
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
  }

  public static publish(name: string, options: any, rootPath: string) {}
}
