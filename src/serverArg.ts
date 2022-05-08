import yargs from 'yargs';
import chalk from 'chalk';
import {Server} from './server';

/**
 * Manejo de la línea de comandos para el servidor mediante yargs.
 */
yargs
    .usage('$0 <command> [args]')
    /**
     * Comando para inicializar el servidor con un timeout.
     */
    .command({
      command: 'timeout',
      describe: 'Timeout for the server',
      builder: {
        timeout: {
          describe: 'The timeout',
          alias: 't',
          demandOption: true,
          type: 'number',
        },
        port: {
          describe: 'The port',
          alias: 'p',
          demandOption: false,
          type: 'number',
          default: 3000,
        },
      },
      handler: (argv: any) => {
        console.log(chalk.yellow(`Server timeout set to ${argv.timeout}`));
        console.log(chalk.green.inverse('Server started'));
        const server = new Server(argv.port);
        setTimeout(() => {
          server.stop();
          console.log(chalk.green.inverse('Server stopped'));
        }, argv.timeout);
      },
    })
    /**
     * Comando para inicializar el servidor sin timeout.
     */
    .command({
      command: 'start',
      describe: 'Start the server',
      builder: {
        port: {
          describe: 'The port',
          alias: 'p',
          demandOption: false,
          type: 'number',
          default: 3000,
        },
      },
      handler: (argv: any) => {
        console.log(chalk.green.inverse('Server started (press Ctrl+C to stop)'));
        new Server(argv.port);
      },
    })
    .help();

yargs.parse();