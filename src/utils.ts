import path from 'path';
import fs from 'fs/promises';
import rimraf from 'rimraf';

export async function createDirectory(filePath: string): Promise<string> {
  var dirname = path.dirname(filePath);
  try {
    await fs.access(dirname);
    return dirname;
  } catch (e) {
    return fs.mkdir(dirname, { recursive: true });
  }
}

export function removeStartingSlash(str: string): string {
  if (str.startsWith('/')) {
    str = str.slice(1);
  }
  return str;
}

export async function removeDir(path: string): Promise<void> {
  return new Promise((resolve, reject) => {
    rimraf(path, e => {
      if (e) {
        reject();
      } else {
        resolve();
      }
    });
  });
}
