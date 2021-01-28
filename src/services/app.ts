import path from 'path';
import { writeFile, readFile } from 'fs/promises';
import md5 from 'crypto-js/md5';
import readline from 'readline-sync';
import { AppLink, PathHash } from '../models/app.interfaces';
import { createDirectory } from '../utils';
import { APP_DIRNAME, CONFIG_DIRNAME } from '../constants';
import { configService } from './config';


export abstract class AppService {
  protected readonly APP_DEF_URL = `/api/app-definitions`;
  protected appName: string;
  protected ownerName: string;

  constructor() {
    createDirectory(this.hashFilePath);
  }

  get hashFilePath(): string {
    return `${CONFIG_DIRNAME}/${this.ownerName}-${this.appName}-hash.json`;
  }

  get appDirPath(): string {
    return path.resolve(process.cwd(), this.appDir);
  }

  get appDir(): string {
    return `${APP_DIRNAME}`;
  }

  protected getFilePath(link: AppLink): string {
    const p = `${APP_DIRNAME}/${link.folder ?? ''}/${link.name}.${link.contentType}`;
    return path.relative(process.cwd(), path.resolve(process.cwd(), p).normalize());
  }

  protected getAbsFilePath(link: AppLink): string {
    const p = `${APP_DIRNAME}/${link.folder ?? ''}/${link.name}.${link.contentType}`;
    return path.resolve(process.cwd(), p).normalize();
  }

  protected getHashCode(content: string): string {
    const hash = md5(content);
    return hash.toString();
  }

  protected setAppInfo(ownerName?: string, appName?: string): void {
    this.ownerName = ownerName ?? readline.question('Enter App Owner:');
    this.appName = appName ?? readline.question(`Enter App Name (Owner=${this.ownerName}):`);
  }

  protected async saveHashCodes(hashes: PathHash[]) {
    const res = hashes.reduce((prev, item) => {
      return {...prev, ...item};
    }, {});
    await writeFile(this.hashFilePath, JSON.stringify(res, null, '\t'));
  }

  protected async getHashCodes(): Promise<PathHash> {
    const hashesStr = await readFile(this.hashFilePath);
    return JSON.parse(hashesStr.toString());
  }

  protected async getAppDefUrl(): Promise<string> {
    const baseUrl = await configService.get('baseUrl');
    return `${baseUrl}${this.APP_DEF_URL}`;
  }

}
