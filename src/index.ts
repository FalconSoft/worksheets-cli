require('dotenv').config();
import yargs, { Argv } from 'yargs';
import { authService } from './services/auth';
import { appPullService } from './services/app-pull';
import { appPushService } from './services/app-push';
import { configService } from './services/config';
import { CliConfig } from './models/config.interface';

console.log('Worksheets CLI');

const commands = ['auth', 'pull', 'push', 'config'];

async function main() {
  let argv = getArgv();

  const argComangs = argv._ as string[];
  const useMessage = `Use one of the commands: ${commands.join(', ')}`;
  if (argComangs.length !== 1 || !commands.includes(argComangs[0])) {
    console.log(useMessage);
    process.exit();
  }
  switch (argComangs[0]) {
    case 'auth': await authService.login(argv.username as string, argv.password as string); break;
    case 'pull': await pull(argv); break;
    case 'push': await push(argv); break;
    case 'config': await config(argv); break;
    default: console.log(`Incorrect command ${argComangs[0]}. ${useMessage}`);
  }
  process.exit()
}

async function getConfig(argv: any): Promise<[string, string]> {
  if (!argv.app) {
    const config = await configService.get();
    if (config.owner && config.app) {
      console.log(`Application: ${config.owner}/${config.app}`);
    }
    return [config.owner, config.app];
  } else {
    const [owner, app] = argv.app.split('/');
    await configService.save({ owner, app });
    return [owner, app]
  }
}

async function pull(argv: any): Promise<void> {
  const isAuth = await authService.authenticate();
  if (isAuth) {
    const config = await getConfig(argv);
    await appPullService.loadApp(...config);
  } else {
    console.log('Login to be able to pull apps.');
  }
}

async function push(argv: any): Promise<void> {
  const isAuth = await authService.authenticate();
  if (isAuth) {
    const config = await getConfig(argv);
    await appPushService.pushApp(...config);
  } else {
    console.log('Login to be able to push apps.');
  }
}

function getArgv() {
  return yargs
    .command('auth', "Authenticate.", (yargs: Argv) => yargs.option('username', {
      alias: 'u',
      describe: "Username in worksheet.systems",
      type: 'string'
    }).option('password', {
      alias: 'p',
      hidden: true,
      type: 'string'
    })).command('pull', "Pull application.", (yargs: Argv) => yargs.option('app', {
      alias: 'a',
      describe: 'Application name (Owner/AppName)',
      type: 'string'
    })).command('push', "Push application.", (yargs: Argv) => yargs.option('app', {
      alias: 'a',
      describe: 'Application name (Owner/AppName)',
      type: 'string'
    })).command('config', "Set configurations.", (yargs: Argv) => yargs.option('baseUrl', {
      describe: 'Worksheets API url.',
      type: 'string'
    }).option('app', {
      alias: 'a',
      describe: 'Application name (Owner/AppName)',
      type: 'string'
    })).argv;
}

async function config(argv: any): Promise<void> {
  const config: CliConfig = {};
  if (argv.baseUrl) {
    config.baseUrl = argv.baseUrl;
  }
  if (argv.app) {
    const [owner, app] = argv.app.split('/');
    config.app = app;
    config.owner = owner;
  }
  await configService.save(config);
  console.log('Configurations updated.');
}

main();
