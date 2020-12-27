require('dotenv').config();
import yargs, { Argv } from 'yargs';
import { authService } from './services/auth';
import { appPullService } from './services/app-pull';
import { appPushService } from './services/app-push';
import { configService } from './services/config';

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
    })).command('pull', "Pull application.", (yargs: Argv) => yargs.option('app', {
      alias: 'a',
      describe: 'Application name (Owner/AppName)',
      type: 'string'
    })).command('push', "Push application.", (yargs: Argv) => yargs.option('app', {
      alias: 'a',
      describe: 'Application name (Owner/AppName)',
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
        const config = await getConfig(argv);
        await appPullService.loadApp(...config);
      } else {
        console.log('Login to be able to pull apps.');
      }
      break;
    };
    case 'push': {
      const isAuth = await authService.authenticate();
      if (isAuth) {
        const config = await getConfig(argv);
        await appPushService.pushApp(...config);
      } else {
        console.log('Login to be able to push apps.');
      }
      break;
    }
  }
  process.exit()
}

async function getConfig(argv: any): Promise<[string, string]> {
  if (!argv.app) {
    const config = await configService.get();
    console.log(`Application: ${config.owner}/${config.app}`);
    return [config.owner, config.app];
  } else {
    const [owner, app] = argv.app.split('/');
    await configService.save({owner, app});
    return [owner, app]
  }
}

main();
