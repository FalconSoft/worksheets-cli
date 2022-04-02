import { readFile, writeFile } from "fs/promises";
import readline from "readline-sync";
import path, { basename } from "path";
import axios from "axios";
import { Credentials, LoginResponse, User } from "../models/auth.interfaces";
import { createDirectory } from "../utils";
import { CONFIG_DIRNAME } from "../constants";
import { configService, DEFAULT_BASE_URL } from "./config";

class AuthService {
  private readonly SECURITY_URL = `/authentication`;
  private readonly TOKEN_PATH = path.resolve(`./${CONFIG_DIRNAME}/token.txt`);
  private token: string;
  async authenticate(): Promise<boolean> {
    const isAuth = await this.isAuth();
    if (isAuth) {
      return true;
    }

    return this.login();
  }

  getAuthHeaders(): { [key: string]: string } {
    return {
      Authorization: `Bearer ${this.token}`,
    };
  }

  getCurrentToken(): string {
    return this.token;
  }

  private async isAuth(): Promise<boolean> {
    const token = await this.getToken();
    if (token) {
      try {
        return this.isTokenValid();
      } catch (e) {
        return false;
      }
    } else {
      return false;
    }
  }

  private async getToken(): Promise<string> {
    try {
      const token = await readFile(this.TOKEN_PATH);
      this.token = token.toString();
      return this.token;
    } catch (e) {
      console.log("Local token token does not exist. Please login.");
    }
  }

  private getCredentials(username?: string, password?: string): Credentials {
    username = username ?? readline.question("Enter Username:");
    password =
      password ??
      readline.question("Enter Password:", {
        hideEchoBack: true,
      });
    return { username, password };
  }

  async login(username?: string, password?: string): Promise<boolean> {
    try {
      const baseUrl = await configService.get("baseUrl");
      if (!baseUrl) {
        throw new Error("Set baseUrl to work with worksheets-cli!");
      }
      const cred = this.getCredentials(username, password);
      const res = await axios.post<LoginResponse>(
        `${baseUrl}${this.SECURITY_URL}/authenticate`,
        cred
      );
      if (res.data.token) {
        this.printUser(res.data.user);
        await createDirectory(this.TOKEN_PATH);
        await writeFile(this.TOKEN_PATH, res.data.token);
        this.token = res.data.token;
        return true;
      }
      return false;
    } catch (e) {
      console.warn((e as any).message);
      return false;
    }
  }

  async simpleLogin(
    username?: string,
    password?: string
  ): Promise<string | null> {
    try {
      const baseUrl = DEFAULT_BASE_URL;
      const res = await axios.post<LoginResponse>(
        `${baseUrl}${this.SECURITY_URL}/authenticate`,
        { username, password }
      );
      if (res.data.token) {
        this.token = res.data.token;
        return res.data.token;
      }
      return null;
    } catch (e) {
      console.warn((e as any).message);
      return null;
    }
  }

  private async isTokenValid(): Promise<boolean> {
    try {
      const baseUrl = await configService.get("baseUrl");
      const res = await axios.get<User>(`${baseUrl}${this.SECURITY_URL}/user`, {
        headers: this.getAuthHeaders(),
      });
      this.printUser(res.data);
      return true;
    } catch (e) {
      console.log("Local token token is invalid. Please login");
      return false;
    }
  }

  private printUser(user: User): void {
    const { firstName, lastName, email } = user;
    console.log(`You authorized as ${firstName} ${lastName} (${email})`);
  }
}

export const authService = new AuthService();
