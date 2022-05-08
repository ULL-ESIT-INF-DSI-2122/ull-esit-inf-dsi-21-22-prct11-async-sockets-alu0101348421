import * as fs from 'fs';
import * as net from 'net';
import chalk from 'chalk';
import {Note} from './note';
import {Color, RequestMessage, ResponseMessage} from './types';

/**
 * Clase que representa el servidor de notas.
 * @class Server
 */
export class Server {
  /**
   * Directorio de la base de datos.
   */
  private readonly dbDir: string;
  /**
   * Servidor de notas.
   */
  private readonly server: net.Server;

  MISSING_PARAMETERS = 'Missing parameters';
  NOTE_NOT_EXISTS = 'Note does not exist';
  USER_NOT_EXISTS = 'User does not exist';

  /**
   * Constructor de la clase.
   * @param {string} dbDir Directorio de la base de datos.
   * @param {number} port Puerto del servidor.
   */
  constructor(dbDir = './db', port = 3000) {
    this.dbDir = dbDir;
    this.server = net.createServer((socket) => {
      let msg = '';
      let open = 0;
      let close = 0;
      console.log(chalk.green('Client connected'));
      socket.on('data', (data) => {
        const len = msg.length;
        msg += data.toString();
        for (let i = len; i < msg.length; i++) {
          if (msg[i] === '{') {
            open++;
          } else if (msg[i] === '}') {
            close++;
          }
        }
        if (open > 0 && open === close) {
          const json = JSON.parse(msg);
          msg = '';
          open = 0;
          close = 0;
          console.log(chalk.green(`\tReceived: ${json.type}`));
          this.handleRequest(json, socket, (response: ResponseMessage) => {
            if (response.success) {
              console.log(chalk.green(`\tAll right, sending response`));
            } else {
              console.log(chalk.red(`\tError: ${response.error}`));
            }
            socket.write(JSON.stringify(response));
          });
        }
      });
      socket.on('end', () => {
        console.log(chalk.green('Client disconnected'));
      });
    });
    this.server.listen(port, () => {
      console.log(chalk.green(`Server listening on port ${port}`));
    });
  }

  /**
   * Método que gestiona las peticiones.
   * @param request Petición.
   * @param socket Socket del cliente.
   * @param callback Callback.
   * @callback response Mensaje de respuesta.
   */
  private handleRequest(request: RequestMessage, socket: net.Socket, callback: (response: ResponseMessage) => void) {
    switch (request.type) {
      case 'add':
        this.addNote(request, callback);
        break;
      case 'update':
        this.updateNote(request, callback);
        break;
      case 'remove':
        this.removeNote(request, callback);
        break;
      case 'read':
        this.readNote(request, callback);
        break;
      case 'list':
        this.listNotes(request, callback);
        break;
      default:
        callback({
          type: 'unknown',
          success: false,
          error: 'Unknown request'});
        break;
    }
  }

  /**
   * Método que añade una nota.
   * @param request Petición.
   * @param callback Callback.
   * @callback response Mensaje de respuesta.
   */
  private addNote(request: RequestMessage, callback: (response: ResponseMessage) => void) {
    let note: Note;
    if (request.user && request.title && request.body && request.color) {
      note = new Note(request.user, request.title, request.body, request.color);
    } else {
      callback({
        type: 'add',
        success: false,
        error: this.MISSING_PARAMETERS});
      return;
    }
    if (!fs.existsSync(`${this.dbDir}/${request.user}`)) {
      fs.mkdir(`${this.dbDir}/${request.user}`, (err) => {
        if (err) {
          callback({
            type: 'add',
            success: false,
            error: 'Error creating user'});
        } else {
          fs.writeFile(`${this.dbDir}/${request.user}/${request.title}.json`, JSON.stringify(note), (err) => {
            if (err) {
              callback({
                type: 'add',
                success: false,
                error: 'Error adding note'});
            } else {
              callback({
                type: 'add',
                success: true});
            }
          });
        }
      });
    } else if (fs.existsSync(`${this.dbDir}/${request.user}/${request.title}.json`)) {
      callback({
        type: 'add',
        success: false,
        error: 'Note already exists'});
    } else {
      fs.writeFile(`${this.dbDir}/${request.user}/${request.title}.json`, JSON.stringify(note), (err) => {
        if (err) {
          callback({
            type: 'add',
            success: false,
            error: 'Error adding note'});
        } else {
          callback({
            type: 'add',
            success: true});
        }
      });
    }
  }

  /**
   * Método que actualiza una nota.
   * @param request Petición.
   * @param callback Callback.
   * @callback response Mensaje de respuesta.
   */
  private updateNote(request: RequestMessage, callback: (response: ResponseMessage) => void) {
    let note: Note;
    if (request.user && request.title && request.body && request.color) {
      note = new Note(request.user, request.title, request.body, request.color);
    } else {
      callback({
        type: 'update',
        success: false,
        error: this.MISSING_PARAMETERS});
      return;
    }
    if (!fs.existsSync(`${this.dbDir}/${request.user}`)) {
      fs.mkdirSync(`${this.dbDir}/${request.user}`);
    }
    if (fs.existsSync(`${this.dbDir}/${request.user}/${request.title}.json`)) {
      fs.writeFile(`${this.dbDir}/${request.user}/${request.title}.json`, JSON.stringify(note), (err) => {
        if (err) {
          callback({
            type: 'update',
            success: false,
            error: 'Error updating note'});
        } else {
          callback({
            type: 'update',
            success: true,
            notes: [note]});
        }
      });
    } else {
      callback({
        type: 'update',
        success: false,
        error: this.NOTE_NOT_EXISTS});
    }
  }

  /**
   * Método que elimina una nota.
   * @param request Petición.
   * @param callback Callback.
   * @callback response Mensaje de respuesta.
   */
  private removeNote(request: RequestMessage, callback: (response: ResponseMessage) => void) {
    if (request.user && request.title) {
      if (!fs.existsSync(`${this.dbDir}/${request.user}`)) {
        callback({
          type: 'remove',
          success: false,
          error: this.USER_NOT_EXISTS});
      } else if (!fs.existsSync(`${this.dbDir}/${request.user}/${request.title}.json`)) {
        callback({
          type: 'remove',
          success: false,
          error: this.NOTE_NOT_EXISTS});
      } else {
        fs.unlink(`${this.dbDir}/${request.user}/${request.title}.json`, (err) => {
          if (err) {
            callback({
              type: 'remove',
              success: false,
              error: 'Error removing note'});
          } else {
            callback({
              type: 'remove',
              success: true});
          }
        });
      }
    } else {
      callback({
        type: 'remove',
        success: false,
        error: this.MISSING_PARAMETERS});
    }
  }

  /**
   * Método que lee una nota.
   * @param request Petición.
   * @param callback Callback.
   * @callback response Mensaje de respuesta.
   */
  private readNote(request: RequestMessage, callback: (response: ResponseMessage) => void) {
    if (request.user && request.title) {
      if (!fs.existsSync(`${this.dbDir}/${request.user}`)) {
        callback({
          type: 'read',
          success: false,
          error: this.USER_NOT_EXISTS});
      } else if (!fs.existsSync(`${this.dbDir}/${request.user}/${request.title}.json`)) {
        callback({
          type: 'read',
          success: false,
          error: this.NOTE_NOT_EXISTS});
      } else {
        fs.readFile(`${this.dbDir}/${request.user}/${request.title}.json`, 'utf8', (err, data) => {
          if (err) {
            callback({
              type: 'read',
              success: false,
              error: 'Error reading note'});
          } else {
            const json = JSON.parse(data);
            const note = new Note(json.user as string,
                                  json.title as string,
                                  json.body as string,
                                  json.color as Color);
            callback({
              type: 'read',
              success: true,
              notes: [note]});
          }
        });
      }
    } else {
      callback({
        type: 'read',
        success: false,
        error: this.MISSING_PARAMETERS});
    }
  }

  /**
   * Método que lista las notas.
   * @param request Petición.
   * @param callback Callback.
   * @callback response Mensaje de respuesta.
   */
  private listNotes(request: RequestMessage, callback: (response: ResponseMessage) => void) {
    if (request.user) {
      if (!fs.existsSync(`${this.dbDir}/${request.user}`)) {
        callback({
          type: 'list',
          success: false,
          error: this.USER_NOT_EXISTS});
      } else {
        const notes: Note[] = [];
        fs.readdir(`${this.dbDir}/${request.user}`, (err, files) => {
          if (err) {
            callback({
              type: 'list',
              success: false,
              error: 'Error listing notes'});
          } else {
            if (files.length <= 0) {
              callback({
                type: 'list',
                success: true,
                notes: []});
            } else {
              files.forEach((file) => {
                fs.readFile(`${this.dbDir}/${request.user}/${file}`, 'utf8', (readErr, data) => {
                  if (readErr) {
                    callback({
                      type: 'list',
                      success: false,
                      error: 'Error reading note'});
                  } else {
                    const json = JSON.parse(data);
                    const note = new Note(json.user as string,
                                          json.title as string,
                                          json.body as string,
                                          json.color as Color);
                    notes.push(note);
                    if (notes.length === files.length) {
                      callback({
                        type: 'list',
                        success: true,
                        notes: notes});
                    }
                  }
                });
              });
            }
          }
        });
      }
    } else {
      callback({
        type: 'list',
        success: false,
        error: this.MISSING_PARAMETERS});
    }
  }

  /**
   * Método que para el servidor.
   */
  public stop() {
    this.server.close();
  }
}
