import { CliConfig } from '../models/config.interface';
import { readFile, writeFile } from 'fs/promises';

class ConfigService {
  private CONFIG_FILE_PATH = 'ws-config/config.json';
  async save(config: CliConfig): Promise<void> {
    await writeFile(this.CONFIG_FILE_PATH, JSON.stringify(config, null, '\t'));
  }

  async get(): Promise<CliConfig> {
    const f = await readFile(this.CONFIG_FILE_PATH);
    return JSON.parse(f.toString());
  }
}

export const configService = new ConfigService();
