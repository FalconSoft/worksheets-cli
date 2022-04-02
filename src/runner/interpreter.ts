import { Interpreter, jsPython, ModuleLoader, PackageLoader } from 'jspython-interpreter';
import * as dataPipe from 'datapipe-js';
import * as dpString from 'datapipe-js/string';
import * as dpUtils from 'datapipe-js/utils';
import * as dpArray from 'datapipe-js/array';
// import * as sqlDataApi from 'sql-data-api';
const sqlDataApi = require('sql-data-api');
import * as rxjs from 'rxjs';
import * as axios from 'axios';
import { DEFAULT_BASE_URL } from '../services/config';

sqlDataApi.setBaseUrl(DEFAULT_BASE_URL);

const AVAILABLE_PACKAGES: Record<string, any> = {
  'datapipe-js': dataPipe,
  'datapipe-js/utils': dpUtils,
  'datapipe-js/array': dpArray,
  'datapipe-js/string': dpString,
  'sql-data-api': sqlDataApi,
  rxjs,
  axios,
  'rxjs/factory': {
    createSubject: () => new rxjs.Subject(),
    createAsyncSubject: () => new rxjs.AsyncSubject(),
    createBehaviorSubject: (v: any) => new rxjs.BehaviorSubject(v),
    createReplaySubject: (v: any) => new rxjs.ReplaySubject(v)
  }
};

export const mapFunction = new Map<string, (...args: any[]) => any>([
  ['typeof', val => typeof val],

  [
    'httpGet',
    (url: string, headers?: Record<string, string>) => sqlDataApi.httpGet(url, { ...headers })
  ],

  [
    'httpGetText',
    (url: string, headers?: Record<string, string>) => sqlDataApi.httpGetText(url, headers)
  ],

  [
    'httpRequest',
    (method: string, url: string, body, headers?: Record<string, string>) =>
      sqlDataApi.httpRequest(method, url, body, headers)
  ],

  [
    'httpPost',
    (url: string, body, headers?: Record<string, string>) =>
      sqlDataApi.httpPost(url, body, { ...headers })
  ],

  [
    'httpPut',
    (url: string, body, headers?: Record<string, string>) =>
      sqlDataApi.httpPut(url, body, { ...headers })
  ],

  [
    'httpDelete',
    (url: string, headers?: Record<string, string>) =>
      sqlDataApi.httpDelete(url, undefined, { ...headers })
  ],

  ['parseInt', parseInt],

  ['parseFloat', parseFloat],

  // ['fetch', fetch],

  // [
  //   'dateTime',
  //   str => (str && str.length ? dpUtils.parseDatetimeOrNull(str) || new Date() : new Date())
  // ],
  [
    'setQueryParameters',
    (search: string) => {
      const url = location.pathname + (search.startsWith('?') ? search : `?${search}`);
      window.history.pushState({}, '', url);
    }
  ]
]);

export function getAvailableJspyPackagesList(): string[] {
  return Object.keys(AVAILABLE_PACKAGES);
}

export function getJspyPackagePartsList(name: string): string[] {
  return Object.keys(AVAILABLE_PACKAGES[name]);
}

export function getAvailableJspyPackage(name: string): any {
  return AVAILABLE_PACKAGES[name];
}

export function registerFunction(name: string, func: (...args: any[]) => any): void {
  if (name && typeof func === 'function') {
    mapFunction.set(name, func);
  } else {
    throw Error(`registerFunction: incorrect parameters: ${name}, ${func}`);
  }
}

export function getInterpreter(
  jspyModuleLoader: ModuleLoader = _ => Promise.resolve('')
): Interpreter {
  const interpreter = jsPython()
    .registerPackagesLoader(packageLoader as PackageLoader)
    .registerModuleLoader(jspyModuleLoader);

  addFunctions(interpreter);
  return interpreter;
}

function addFunctions(interpreter: Interpreter): void {
  mapFunction.forEach((func: any, name) => {
    func['interpreter'] = interpreter;
    interpreter.addFunction(name, func);
  });
}

function packageLoader(packageName: string): any {
  if (!AVAILABLE_PACKAGES.hasOwnProperty(packageName)) {
    throw Error(`Package '${packageName}' is not available.`);
  }
  return AVAILABLE_PACKAGES[packageName];
}
