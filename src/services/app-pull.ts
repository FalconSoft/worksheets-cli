import axios from 'axios';
import { ContentInfo, AppLink, AppContentInfo } from '../models/app.interfaces';
import { authService } from './auth';
import { createDirectory, removeDir } from '../utils';
import { writeFile } from 'fs/promises';
import { AppService } from './app';

class AppPullservice extends AppService {
  async loadApp(ownerName?: string, appName?: string): Promise<void> {
    this.setAppInfo(ownerName, appName);
    await createDirectory(this.hashFilePath);
    await removeDir(this.appDirPath);
    const appDefUrl = await this.getAppDefUrl();
    const url = `${appDefUrl}/app-links/${this.ownerName}/${this.appName}`;
    try {
      const res = await axios.get<ContentInfo[]>(url, {
        headers: authService.getAuthHeaders()
      });
      const links = res.data;

      const hashes = await Promise.all(links.map(async l => {
        const linkContent = await this.loadFile(l);
        return await this.saveFile(linkContent);
      }));

      await this.saveHashCodes(hashes);
      console.log(`Application ${this.ownerName}.${this.appName} loaded (${this.appDirPath}).`)

    } catch (e) {
      console.log(e.message);
    }
  }

  private async loadFile(c: ContentInfo): Promise<AppLink> {
    const appDefUrl = await this.getAppDefUrl();
    const url = `${appDefUrl}/get-app-content`;
    const data: AppContentInfo = {
      contentType: c.contentType,
      folder: c.folder,
      name: c.name,
      appName: this.appName,
      appOwnerName: this.ownerName
    }
    const res = await axios.post<AppLink>(url, data, {
      headers: authService.getAuthHeaders()
    });
    return res.data;
  }

  private async saveFile(link: AppLink) {
    const path = this.getAbsFilePath(link);
    try {
      await createDirectory(path);
      await writeFile(path, link.content || '');
      console.log(`File loaded: ${path}`);
      return {[this.getFilePath(link)]: {
        hash: this.getHashCode(link.content),
        contentId: link.contentId
      }};
    } catch (e) {
      console.log(e);
    }
  }
}

export const appPullService = new AppPullservice();
