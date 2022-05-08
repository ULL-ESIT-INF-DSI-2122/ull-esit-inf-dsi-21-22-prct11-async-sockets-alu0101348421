import yargs from 'yargs';
import chalk from 'chalk';
import {Client} from './client';
import {Note} from './note';

/**
 * Manejo de la línea de comandos para el cliente mediante yargs.
 */
yargs
    .usage('$0 <command> [args]')
    /**
     * Comando para crear una nota.
     */
    .command({
      command: 'add',
      describe: 'Add a note',
      builder: {
        user: {
          describe: 'The user',
          alias: 'u',
          demandOption: true,
          type: 'string',
        },
        title: {
          describe: 'The title',
          alias: 't',
          demandOption: true,
          type: 'string',
        },
        body: {
          describe: 'The body',
          alias: 'b',
          demandOption: true,
          type: 'string',
        },
        color: {
          describe: 'The color',
          alias: 'c',
          demandOption: true,
          type: 'string',
        },
      },
      handler: (argv: any) => {
        if (argv.color !== 'red' && argv.color !== 'green' && argv.color !== 'blue' && argv.color !== 'yellow') {
          console.log(chalk.red('Invalid color'));
          return;
        }
        const client = new Client();
        const note = new Note(argv.user, argv.title, argv.body, argv.color);
        client.addNote(note, (err) => {
          if (err) {
            console.log(chalk.red(err.message));
          } else {
            const color = note.color === 'red' ? chalk.red :
            note.color === 'green' ? chalk.green :
            note.color === 'blue' ? chalk.blue :
            note.color === 'yellow' ? chalk.yellow :
            chalk.white.inverse;
            console.log(`Note added: ${color(note.title)}`);
          }
        });
      },
    })
    /**
     * Comando para actualizar una nota.
     */
    .command({
      command: 'update',
      describe: 'Update a note',
      builder: {
        user: {
          describe: 'The user',
          alias: 'u',
          demandOption: true,
          type: 'string',
        },
        title: {
          describe: 'The title',
          alias: 't',
          demandOption: true,
          type: 'string',
        },
        body: {
          describe: 'The body',
          alias: 'b',
          demandOption: true,
          type: 'string',
        },
        color: {
          describe: 'The color',
          alias: 'c',
          demandOption: true,
          type: 'string',
        },
      },
      handler: (argv: any) => {
        if (argv.color !== 'red' && argv.color !== 'green' && argv.color !== 'blue' && argv.color !== 'yellow') {
          console.log(chalk.red('Invalid color'));
          return;
        }
        const client = new Client();
        const note = new Note(argv.user, argv.title, argv.body, argv.color);
        client.updateNote(note, (err) => {
          if (err) {
            console.log(chalk.red(err.message));
          } else {
            const color = note.color === 'red' ? chalk.red :
            note.color === 'green' ? chalk.green :
            note.color === 'blue' ? chalk.blue :
            note.color === 'yellow' ? chalk.yellow :
            chalk.white.inverse;
            console.log(`Note updated: ${color(note.title)}`);
          }
        });
      },
    })
    /**
     * Comando para eliminar una nota.
     */
    .command({
      command: 'remove',
      describe: 'Remove a note',
      builder: {
        user: {
          describe: 'The user',
          alias: 'u',
          demandOption: true,
          type: 'string',
        },
        title: {
          describe: 'The title',
          alias: 't',
          demandOption: true,
          type: 'string',
        },
      },
      handler: (argv: any) => {
        const client = new Client();
        client.removeNote(argv.user, argv.title, (err) => {
          if (err) {
            console.log(chalk.red(err.message));
          } else {
            console.log(`Note removed: ${argv.title}`);
          }
        });
      },
    })
    /**
     * Comando para leer una nota.
     */
    .command({
      command: 'read',
      describe: 'Read a note',
      builder: {
        user: {
          describe: 'The user',
          alias: 'u',
          demandOption: true,
          type: 'string',
        },
        title: {
          describe: 'The title',
          alias: 't',
          demandOption: true,
          type: 'string',
        },
      },
      handler: (argv: any) => {
        const client = new Client();
        client.readNote(argv.user, argv.title, (err, note) => {
          if (err) {
            console.log(chalk.red(err.message));
          } else {
            if (note) {
              const color = note.color === 'red' ? chalk.red :
              note.color === 'green' ? chalk.green :
              note.color === 'blue' ? chalk.blue :
              note.color === 'yellow' ? chalk.yellow :
              chalk.white.inverse;
              console.log(`User: ${note.user}`);
              console.log(`Title: ${color(note.title)}`);
              console.log(`Body: ${note.body}`);
              console.log(`Color: ${note.color}`);
            } else {
              console.log(chalk.red('Note not found'));
            }
          }
        });
      },
    })
    /**
     * Comando para listar las notas.
     */
    .command({
      command: 'list',
      describe: 'List notes',
      builder: {
        user: {
          describe: 'The user',
          alias: 'u',
          demandOption: true,
          type: 'string',
        },
      },
      handler: (argv: any) => {
        const client = new Client();
        client.listNotes(argv.user, (err, notes) => {
          if (err) {
            console.log(chalk.red(err.message));
          } else {
            if (notes.length > 0) {
              console.log(`User: ${argv.user}`);
              notes.forEach((note) => {
                const color = note.color === 'red' ? chalk.red :
                note.color === 'green' ? chalk.green :
                note.color === 'blue' ? chalk.blue :
                note.color === 'yellow' ? chalk.yellow :
                chalk.white.inverse;
                console.log(`\t${color(note.title)}`);
              });
            } else {
              console.log(chalk.yellow('No notes found'));
            }
          }
        });
      },
    })
    .help();

/**
 * Comando para ejecutar el programa.
 */
yargs.parse();