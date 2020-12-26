import { readFile, writeFile } from 'fs/promises';
import readline from 'readline-sync';
import path from 'path';
import axios from 'axios';
import { Credentials, LoginResponse, User } from '../models/auth.interfaces';
import { createDirectory } from '../utils';

class AuthService {
  private readonly SECURITY_URL = `${process.env.BASE_URL}/api/security`;
  private readonly TOKEN_PATH = path.resolve('./ws-config/token.txt');
  private token: string;
  async authenticate(): Promise<boolean> {
    const isAuth = await this.isAuth();
    if (isAuth) {
      return true;
    }

    return this.login();
  }


  getAuthHeaders(): {[key: string]: string} {
    return {
      Authorization: `Bearer ${this.token}`
    }
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
      console.log('Local token token does not exist. Please login.');
    }
  }

  private getCredentials(username?: string, password?: string): Credentials {
    username = username ?? readline.question('Enter Username:');
    password = password ?? readline.question('Enter Password:', {
      hideEchoBack: true
    });
    return { username, password };
  }

  async login(username?: string, password?: string): Promise<boolean> {
    const cred = this.getCredentials(username, password);
    try {
      const res = await axios.post<LoginResponse>(`${this.SECURITY_URL}/authenticate`, cred);
      if (res.data.token) {
        this.printUser(res.data.user);
        await createDirectory(this.TOKEN_PATH);
        await writeFile(this.TOKEN_PATH, res.data.token);
        this.token = res.data.token;
        return true;
      }
      return false;
    } catch (e) {
      console.log(e.message);
      return false;
    }
  }

  private async isTokenValid(): Promise<boolean> {
    try {
      const res = await axios.get<User>(`${this.SECURITY_URL}/user`, {
        headers: this.getAuthHeaders()
      });
      this.printUser(res.data);
      return true;
    } catch (e) {
      console.log('Local token token is invalid. Please login');
      return false;
    }
  }

  private printUser(user: User): void {
    const { firstName, lastName, email } = user;
    console.log(`You authorized as ${firstName} ${lastName} (${email})`);
  }
}

export const authService = new AuthService();