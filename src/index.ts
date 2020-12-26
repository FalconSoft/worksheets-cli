require('dotenv').config();
import yargs, { Argv } from 'yargs';
import { authService } from './services/auth';
import { appPullService } from './services/app-pull';
import { appPushService } from './services/app-push';

console.log('Worksheets CLI');

const commands = ['auth', 'pull', 'push'];

async function main() {
  let argv = yargs
    .command('auth', "Authenticate.", (yargs: Argv) => yargs.option('username', {
      alias: 'u',
      describe: "Username in worksheet.systems",
      type: 'string'
    }).option('password', {
      alias: 'p',
      hidden: true,
      type: 'string'
    })).command('pull', "Pull application.", (yargs: Argv) => yargs.option('owner', {
      alias: 'o',
      describe: "Ownername",
      type: 'string'
    }).option('appName', {
      alias: 'a',
      describe: 'Application name',
      type: 'string'
    })).command('push', "Push application.", (yargs: Argv) => yargs.option('owner', {
      alias: 'o',
      describe: "Ownername",
      type: 'string'
    }).option('appName', {
      alias: 'a',
      describe: 'Application name',
      type: 'string'
    })).argv;

  const argComangs = argv._ as string[];
  if (argComangs.length !== 1 || !commands.includes(argComangs[0])) {
    console.log(`Use one of the commands: ${commands.join(', ')}`);
    process.exit();
  }
  switch (argComangs[0]) {
    case 'auth': await authService.login(argv.username as string, argv.password as string); break;
    case 'pull': {
      const isAuth = await authService.authenticate();
      if (isAuth) {
        await appPullService.loadApp(argv.owner, argv.appName);
      } else {
        console.log('Login to be able to pull apps.');
      }
      break;
    };
    case 'push': {
      const isAuth = await authService.authenticate();
      if (isAuth) {
        await appPushService.pushApp(argv.owner, argv.appName);
      } else {
        console.log('Login to be able to push apps.');
      }
      break;
    }
  }
  process.exit()
}

main();
