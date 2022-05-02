import * as yargs from 'yargs';
import {Note, Color} from './note';

yargs
    .command({
      command: 'add',
      describe: 'Add a new note',
      builder: {
        user: {
          describe: 'User of the note',
          demand: true,
          alias: 'u',
        },
        title: {
          describe: 'Title of the note',
          demand: true,
          alias: 't',
        },
        body: {
          describe: 'Body of the note',
          demand: true,
          alias: 'b',
        },
        color: {
          describe: 'Color of the note',
          demand: true,
          alias: 'c',
          type: 'string',
          choices: ['red', 'green', 'blue', 'yellow'],
        },
      },
      handler: (argv) => {
        const note = new Note(
          argv.user as string,
          argv.title as string,
          argv.body as string,
          argv.color as Color);
        console.log(note);
      },
    })
    .help;