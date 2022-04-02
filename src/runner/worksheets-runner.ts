import axios, { AxiosResponse } from "axios";
import { setBearerToken, setBaseUrl } from "sql-data-api";
import { AppContentInfo, AppLink } from "../models/app.interfaces";
import { authService } from "../services/auth";
import { DEFAULT_BASE_URL } from "../services/config";
import { getInterpreter } from "./interpreter";
import { RunnerConfig } from "./types";
import { toContentPath } from "./utils";

setBaseUrl(DEFAULT_BASE_URL);

export class WorksheetsRunner {
  private auth: Promise<boolean>;
  private appOwner: string;
  private appName: string;

  constructor(private config: RunnerConfig) {}

  async login(): Promise<void> {
    this.auth = await authService
      .simpleLogin(this.config.userName, this.config.password)
      .then((token) => {
        if (!token) {
          throw new Error("Failed to login");
        }
        setBearerToken(token);
        return token;
      })
      .catch((e) => {
        console.log(`AUTH ERROR: ${e.message}`);
        return e;
      });
  }

  async run(
    appPath: string,
    filePath: string,
    functionName?: string
  ): Promise<any> {
    
    this.setAppPath(appPath);
    const file = (await this.loadFileContent(filePath)).data.content;

    const interpreter = getInterpreter(async (link) => this.moduleLoader(link));
    const context = { appName: this.appName, appOwner: this.appOwner };

    return interpreter.evaluate(file, context, functionName);
  }

  async getScheduledTasks(days?: string, time?: string) {
    const isAuth = await this.auth;
    if (!isAuth) {
      console.log("Not authorized");
      return;
    }

    let url = `${DEFAULT_BASE_URL}/api/scheduled-tasks`;

    const qp = [];
    if (days?.length > 0) {
      qp.push("$days=" + days);
    }

    if (time?.length > 0) {
      qp.push("$time=" + time);
    }

    if (qp.length > 0) {
      url = url + "?" + qp.join("&");
    }

    return (
      await axios
        .get<AppLink>(url, {
          headers: authService.getAuthHeaders(),
        })
        .catch((e) => {
          console.log(e.message);
          return null;
        })
    )?.data;
  }

  async startScheduledTask(
    taskId: number,
    agentName: string = "agent1"
  ): Promise<number> {
    const url = `${DEFAULT_BASE_URL}/api/scheduled-tasks/start/${taskId}/${agentName}`;
    return (
      await axios.post<number>(url, null, {
        headers: authService.getAuthHeaders(),
      })
    ).data;
  }

  async endScheduledTask(
    taskStatusId: number,
    status: number,
    result: string
  ): Promise<void> {
    const url = `${DEFAULT_BASE_URL}/api/scheduled-tasks/end`;
    await axios.put<unknown>(
      url,
      { taskStatusId, status, result },
      {
        headers: authService.getAuthHeaders(),
      }
    );
  }

  private async moduleLoader(link: string): Promise<string> {
    if (link.startsWith("./")) {
      link = link.substring(2);
    }

    if (link.startsWith("/")) {
      link = link.substring(1);
    }
    const res = await this.loadFileContent(link);
    return res.data.content || "";
  }

  private setAppPath(appPath: string): void {
    const [appOwner, appName] = appPath.split("/");

    if (!appOwner) {
      throw new Error("App owner is not initialized");
    }

    this.appOwner = appOwner;

    if (!appName) {
      throw new Error("App name is not initialized");
    }

    this.appName = appName;
  }

  private async loadFileContent(link: string): Promise<AxiosResponse<AppLink>> {
    const c = toContentPath(link);

    const data: AppContentInfo = {
      contentType: c.contentType,
      folder: c.folder,
      name: c.name,
      appName: this.appName,
      appOwnerName: this.appOwner,
    };

    const url = `${DEFAULT_BASE_URL}/api/app-definitions/get-app-content`;

    return await axios.post<AppLink>(url, data, {
      headers: authService.getAuthHeaders(),
    });
  }
}
