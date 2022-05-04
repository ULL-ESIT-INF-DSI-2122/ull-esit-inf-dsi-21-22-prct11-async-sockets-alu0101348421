import * as fs from 'fs';
import * as net from 'net';
import {Note} from './note';

export class Server {
  private dbDir: string;

  constructor(dbDir: string = './db') {
    this.dbDir = dbDir;
  }

  start(port: number = 3000) {
    const server = net.createServer((socket: net.Socket) => {
      console.log('client connected');
      socket.on('data', (dataJSON) => {
        const message = JSON.parse(dataJSON.toString());
        if (message.type === 'add') {
          const note = new Note(message.user,
              message.title,
              message.body,
              message.color);
          this.addNote(note, (err) => {
            if (err) {
              console.log(err);
              socket.write(JSON.stringify({type: 'msg', data: err}), () => {
                socket.end();
              });
            } else {
              socket.write(JSON.stringify({type: 'msg', data: 'note added'}),
                  () => {
                    socket.end();
                  });
            }
          });
        } else if (message.type === 'remove') {
          this.removeNote(message.user, message.title, (err) => {
            if (err) {
              console.log(err);
              socket.write(JSON.stringify({type: 'msg', data: err}), () => {
                socket.end();
              });
            } else {
              socket.write(JSON.stringify({type: 'msg', data: 'note removed'}),
                  () => {
                    socket.end();
                  });
            }
          });
        }
      });
      socket.on('end', () => {
        console.log('client disconnected');
      });
    });
    server.listen(port, () => {
      console.log('Server listening on port ' + port);
    });
  }

  private getNotes(user: string, callback: (notes: Note[]) => void) {
    const notes: Note[] = [];
    fs.readdir(`${this.dbDir}/${user}`, (err, files) => {
      if (err) {
        throw err;
      }
      for (const file of files) {
        const tmp = fs.readFileSync(`${this.dbDir}/${user}/${file}`, 'utf8');
        const json = JSON.parse(tmp);
        if (json.user == user) {
          notes.push(new Note(json.user, json.title, json.body, json.color));
        }
      }
      callback(notes);
    });
  }

  private addNote(note: Note, callback: (err: Error | null)
  => void) {
    if (!fs.existsSync(`${this.dbDir}/${note.user}`)) {
      fs.mkdirSync(`${this.dbDir}/${note.user}`);
    }
    if (fs.existsSync(`${this.dbDir}/${note.user}/${note.title}.json`)) {
      callback(new Error('note already exists'));
    }
    fs.writeFile(`${this.dbDir}/${note.user}/${note.title}.json`,
        JSON.stringify(note), (writeErr) => {
          if (writeErr) {
            callback(writeErr);
          }
          callback(null);
        });
  }

  private removeNote(user: string, title: string, callback:
      (err: NodeJS.ErrnoException | null) => void) {
    fs.access(`${this.dbDir}/${user}/${title}.json`, fs.constants.F_OK,
        (err) => {
          if (err) {
            callback(new Error('note does not exist'));
          }
          fs.unlink(`${this.dbDir}/${user}/${title}.json`, (unlinkErr) => {
            if (unlinkErr) {
              callback(unlinkErr);
            }
            callback(null);
          });
        });
  }
}

const server = new Server();
server.start();