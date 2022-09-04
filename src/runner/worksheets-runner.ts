import axios, { AxiosResponse } from "axios";
import { Interpreter } from "jspython-interpreter";
import { setBearerToken, setBaseUrl } from "sql-data-api";
import { AppContentInfo, AppLink } from "../models/app.interfaces";
import { authService } from "../services/auth";
import { DEFAULT_BASE_URL } from "../services/config";
import { Assert } from "./assert";
import { getInterpreter } from "./interpreter";
import { RunnerConfig } from "./types";
import { toContentPath } from "./utils";

setBaseUrl(DEFAULT_BASE_URL);

type AssertInfo = { success: boolean; name: string; description?: string };
type LogInfo = {
  level: "info" | "fail" | "success";
  message: string;
  time: Date;
  logId?: string;
};

export class WorksheetsRunner {
  private auth: Promise<boolean>;
  private appOwner: string;
  private appName: string;
  private asserts: AssertInfo[] = [];
  private logLines: string[] = [];
  private previousLogMessage = "";

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

  private assert(name: string, dataContext?: boolean | any): Assert | void {
    // an original case when
    if (typeof dataContext === "boolean") {
      this.logFn({
        level: dataContext ? "success" : "fail",
        message: name || "",
        time: new Date(),
      });
      this.asserts.push({ success: !!dataContext, name });
      return;
    }

    const assertCallback = (success: boolean, message: string) => {
      this.logFn({
        logId: name,
        level: success ? "success" : "fail",
        message: `${name} ${message ? ":" : ""} ${message || ""}`,
        time: new Date(),
      });

      const existingAssert = this.asserts?.find(
        (a: AssertInfo) => a.name === name
      );
      if (existingAssert) {
        // only if condition it is not fail yet
        if (!!existingAssert.success) {
          existingAssert.success = !!success;
          existingAssert.description = message;
        }
      } else {
        this.asserts.push({
          success: !!success,
          name: name,
          description: message,
        });
      }
    };

    return new Assert(name, dataContext, assertCallback);
  }

  private logFn(msg: LogInfo): void {
    const level = msg.level === "success" ? msg.level : msg.level + "   ";
    const message = `${level} | ${msg.message}`;

    if (message !== this.previousLogMessage) {
      this.logLines.push(
        `| ${msg.time.toTimeString().slice(0, 8)} | ${message}`
      );
      this.previousLogMessage = message;
    }
  }

  private assignFunctions(interpreter: Interpreter): void {
    interpreter.addFunction("print", (...args: any[]) => {
      console.log(...args);
      const message = args
        .map((v) => (typeof v === "object" ? JSON.stringify(v) : String(v)))
        .join(", ");
      this.logFn({
        level: "info",
        message,
        time: new Date(),
      });

      return args.length > 0 ? args[0] : null;
    });

    interpreter.addFunction("assert", (name: string, dataContext: any) =>
      this.assert(name, dataContext)
    );

    interpreter.addFunction("showAsserts", () =>
      this.asserts.forEach((r) =>
        this.logFn({
          time: new Date(),
          level: "info",
          message: `${r.success ? "success" : "fail   "} | ${r.name}${
            !!r.description ? ": " : ""
          }${r.description || ""}`.trim(),
        })
      )
    );
  }
  async run(
    appPath: string,
    filePath: string,
    functionName?: string
  ): Promise<{ log: string; result?: any; error?: string }> {
    this.logLines = [];
    this.setAppPath(appPath);
    const file = (await this.loadFileContent(filePath)).data.content;
    const interpreter = getInterpreter(async (link) => this.moduleLoader(link));

    this.assignFunctions(interpreter);
    const context = {
      __env: {
        args: {},
        entryModule: filePath,
        entryFunction: functionName || "",
        runsAt: "task-scheduller",
      },
    };

    try {
      this.logLines.push(interpreter.jsPythonInfo());
      this.logLines.push(`> ${filePath}`);

      const result = await interpreter.evaluate(
        file,
        context,
        functionName,
        filePath
      );

      if (this.asserts?.length) {
        this.logLines.push(
          `  > assert success : ${this.asserts.filter((a) => a.success).length}`
        );
        this.logLines.push(
          `  > assert failed  : ${
            this.asserts.filter((a) => !a.success).length
          }`
        );
      }

      return {
        log: this.logLines.join("\n"),
        result,
      };
    } catch (ex) {
      return { error: (ex as any).message, log: this.logLines.join("\n") };
    }
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
