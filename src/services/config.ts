import path from 'path';
import { readFile, writeFile } from 'fs/promises';
import { CONFIG_DIRNAME } from '../constants';
import { createDirectory } from '../utils';
import { CliConfig } from '../models/config.interface';

export const DEFAULT_BASE_URL = "https://api.worksheet.systems";

class ConfigService {
  private CONFIG_FILE_PATH = path.resolve(process.cwd(), `${CONFIG_DIRNAME}/config.json`);
  private _config: CliConfig;

  async save(config: CliConfig): Promise<CliConfig> {
    const prev = await this.get();
    const c = { ...prev, ...config };
    try {
      await writeFile(this.CONFIG_FILE_PATH, JSON.stringify(c, null, '\t'));
      this._config = c;
      return c;
    } catch (e) {
      console.error(e);
    }

  }

  async get(): Promise<CliConfig>;
  async get(prop: string): Promise<string>;
  async get(prop?: string): Promise<string | CliConfig> {
    if (!this._config) {
      try {
        await createDirectory(this.CONFIG_FILE_PATH);
        const f = await readFile(this.CONFIG_FILE_PATH);
        const config = JSON.parse(f.toString()) as CliConfig;
        this._config = config;
      } catch (e) {
        this._config = {};
      }
    }
    if (typeof prop === 'string') {
      let value = this._config[prop];

      if (prop === 'baseUrl' && !value) {
        value = DEFAULT_BASE_URL;
      }
      return value;
    }
    return this._config;
  }
}

export const configService = new ConfigService();
