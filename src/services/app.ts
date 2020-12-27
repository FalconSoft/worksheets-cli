import path from 'path';
import { writeFile, readFile } from 'fs/promises';
import md5 from 'crypto-js/md5';
import readline from 'readline-sync';
import { AppLink, PathHash } from '../models/app.interfaces';
import { createDirectory } from '../utils';

export abstract class AppService {
  protected readonly APP_DEF_URL = `${process.env.BASE_URL}/api/app-definitions`;
  protected appName: string;
  protected ownerName: string;

  constructor() {
    createDirectory(this.hashFilePath);
  }

  get hashFilePath(): string {
    return `ws-config/${this.ownerName}-${this.appName}-hash.json`;
  }

  get appDirPath(): string {
    return path.resolve(this.appDir);
  }

  get appDir(): string {
    return `ws-apps/${this.ownerName}/${this.appName}`;
  }

  protected getFilePath(link: AppLink): string {
    const p = `ws-apps/${this.ownerName}/${this.appName}/${link.folder ?? ''}/${link.name}.${link.contentType}`;
    const rootPath = path.resolve(require.main.path, '../');
    return path.relative(rootPath, p).normalize();
  }

  protected getHashCode(content: string): string {
    const hash = md5(content);
    return hash.toString();
  }

  protected setAppInfo(ownerName?: string, appName?: string): void {
    this.ownerName = ownerName ?? readline.question('Enter App Owner:');
    this.appName = appName ?? readline.question('Enter App Name:');
  }

  protected async saveHashCodes(hashes: PathHash[]) {
    const res = hashes.reduce((prev, item) => {
      return {...prev, ...item};
    }, {});
    await writeFile(this.hashFilePath, JSON.stringify(res));
  }

  protected async getHashCodes(): Promise<PathHash> {
    const hashesStr = await readFile(this.hashFilePath);
    return JSON.parse(hashesStr.toString());
  }

}
