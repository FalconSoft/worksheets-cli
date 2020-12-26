import path from 'path';
import axios from 'axios';
import { AppLink, PathHash, SaveAppLink } from '../models/app.interfaces';
import { authService } from './auth';
import { createDirectory, removeStartingSlash } from '../utils';
import fs from 'fs/promises';
import { AppService } from './app';


class AppPushservice extends AppService {
  constructor() {
    super();
    createDirectory(this.hashFilePath);
  }

  async pushApp(ownerName?: string, appName?: string): Promise<void> {
    this.setAppInfo(ownerName, appName);
    try {
      const files = (await this.getLocalAppFiles()).flat(Infinity) as AppLink[];
      const hashes = await this.getHashCodes();

      await this.deleteFiles(files, hashes);

      const filesToPush = files.filter(f => {
        const p = this.getFilePath(f);
        return hashes[p]?.hash !== this.getHashCode(f.content);
      });

      await Promise.all(filesToPush.map(async fP => {
        const pathHash = await this.saveFile(fP);
        const filePath = this.getFilePath(fP);
        const f = files.find(f => filePath === this.getFilePath(f));
        f.contentId = pathHash[filePath].contentId;
      }));

      await this.saveHashCodes(files.map(f => ({[this.getFilePath(f)]: {
        hash: this.getHashCode(f.content),
        contentId: f.contentId
      }})));

      console.log(`Application ${this.ownerName}.${this.appName} loaded (${this.APP_DEF_URL}).`)

    } catch (e) {
      console.log(e.message);
    }
  }

  private async deleteFiles(files: AppLink[], hashes: PathHash): Promise<void> {
    const filesMap = new Map<string, AppLink>(files.map(f => ([this.getFilePath(f), f])));

    await Promise.all(Object.keys(hashes)
      .filter(fPath => !filesMap.has(fPath))
      .map(fPath => this.deleteFile(this.getAppLink(fPath))));
  }

  private async deleteFile(link: AppLink): Promise<number> {
    const url = `${this.APP_DEF_URL}/delete-app-content`;
    const res = await axios.post<number>(url, {
      ...link,
      appOwnerName: this.ownerName,
      appName: this.appName
    }, {
      headers: authService.getAuthHeaders()
    });
    console.log(`${this.getFilePath(link)} - deleted`, res.status);
    return res.data;
  }

  private async getLocalAppFiles(dir = this.appDirPath): Promise<any> {
    const hashes = await this.getHashCodes();
    const list = await fs.readdir(dir);
    return await Promise.all(list.map(async file => {
      file = path.resolve(dir, file);
      const stat = await fs.stat(file);
      if (stat && stat.isDirectory()) {
        return this.getLocalAppFiles(file);
      } else {
        return this.getAppLinkWithContent(dir, file, hashes);
      }
    }));
  }

  private async getAppLinkWithContent(dir:string, path: string, hashes: PathHash): Promise<AppLink> {
    let folder = removeStartingSlash(dir.replace(this.appDirPath, ''));
    let [name, ...extention] = path.replace(dir, '').split('.');
    const content = (await fs.readFile(path)).toString();
    const appLink: AppLink = {
      name: removeStartingSlash(name),
      folder,
      contentType: extention.join('.'),
      content
    };
    if (hashes[this.getFilePath(appLink)]) {
      appLink.contentId = hashes[this.getFilePath(appLink)].contentId
    }
    return appLink;
  }

  private getAppLink(filePath: string): AppLink {
    const fPath = filePath.replace(this.appDir, '');
    const src = fPath.split('/');
    const file = src.pop();
    const dotIndex = file.indexOf('.');
    const contentType = file.substring(dotIndex + 1);
    const name = file.substring(0, dotIndex);
    const folder = src.join('/');
    const appLink: AppLink = {
      name,
      folder,
      contentType
    };
    return appLink;
  }

  private async saveFile(link: AppLink): Promise<PathHash> {
    const url = `${this.APP_DEF_URL}/save-app-content`;
    const appLink = this.getSaveAppLink(link);
    try {
      const res = await axios.post<number>(url, appLink, {
        headers: authService.getAuthHeaders()
      });
      const path = this.getFilePath(link);
      const status = link.contentId ? 'saved' : 'created';
      console.log(`${path} - ${status}`, res.status);
      return { [path]: {
        hash: this.getHashCode(link.content),
        contentId: res.data
      }};
    } catch (e) {
      console.log(e.message);
    }
  }

  private getSaveAppLink(link: AppLink): SaveAppLink {
    const saveLink: SaveAppLink = {
      appOwnerName: this.ownerName,
      appName: this.appName,
      appContent: {
        contentType: link.contentType,
        folder: link.folder,
        name: link.name
      }
    };
    if (link.content) {
      saveLink.appContent.content = link.content;
    }
    if (link.contentId) {
      saveLink.appContent.contentId = link.contentId;
    }
    return saveLink;
  }
}

export const appPushService = new AppPushservice();
