import * as net from 'net';
import { Note } from './note';
import { RequestMessage, ResponseMessage } from './types';

/**
 * Clase que representa el cliente de un servidor de notas.
 * @class Client
 */
export class Client {
  /**
   * Socket del cliente.
   */
  private readonly socket: net.Socket;

  UNKNOWN_RESPONSE = 'Unknown response';

  /**
   * Constructor de la clase.
   * @param {number} port Puerto del servidor.
   */
  constructor(private readonly port: number = 3000) {
    this.socket = net.createConnection(this.port);
  }

  /**
   * Método que envía un mensaje al servidor.
   * @param data Mensaje a enviar.
   */
  public send(data: string) {
    if (this.socket) {
      this.socket.write(data);
    }
  }

  /**
   * Método que cierra el socket del cliente.
   */
  public stop() {
    if (this.socket) {
      this.socket.end();
    }
  }

  /**
   * Método que escucha una respuesta del servidor.
   * @param callback Callback
   * @callback response Respuesta
   */
  public listen(callback: (response: ResponseMessage) => void) {
    if (this.socket) {
      let msg = '';
      let open = 0;
      let close = 0;
      this.socket.on('data', (data) => {
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
          callback(JSON.parse(msg));
        }
      });
    } else {
      callback({type: 'unknown', success: false, error: 'No socket'});
    }
  }

  /**
   * Método que añade una nota.
   * @param note Nota a añadir
   * @param callback Callback
   * @callback err Error o null
   */
  public addNote(note: Note, callback: (err: Error | null) => void) {
    if (this.socket !== null) {
      const request: RequestMessage = {
        type: 'add',
        user: note.user,
        title: note.title,
        body: note.body,
        color: note.color};
      this.send(JSON.stringify(request));
      this.listen((response: ResponseMessage) => {
        if (response.type === 'add' && response.success) {
          callback(null);
        } else if (response.type === 'add' && !response.success && response.error) {
          callback(new Error(response.error));
        } else if (response.type === 'add' && !response.success) {
          callback(new Error('Note not added'));
        } else {
          callback(new Error(this.UNKNOWN_RESPONSE));
        }
        this.socket.end();
      });
    }
  }

  /**
   * Método que actualiza una nota.
   * @param note Nota a actualizar
   * @param callback Callback
   * @callback err Error o null
   */
  public updateNote(note: Note, callback: (err: Error | null) => void) {
    if (this.socket !== null) {
      const request: RequestMessage = {
        type: 'update',
        user: note.user,
        title: note.title,
        body: note.body,
        color: note.color};
      this.send(JSON.stringify(request));
      this.listen((response: ResponseMessage) => {
        if (response.type === 'update' && response.success) {
          callback(null);
        } else if (response.type === 'update' && !response.success && response.error) {
          callback(new Error(response.error));
        } else if (response.type === 'update' && !response.success) {
          callback(new Error('Note not updated'));
        } else {
          callback(new Error(this.UNKNOWN_RESPONSE));
        }
        this.socket.end();
      });
    }
  }

  /**
   * Método que elimina una nota.
   * @param user Usuario
   * @param title Título
   * @param callback Callback
   * @callback err Error o null
   */
  public removeNote(user: string, title: string, callback: (err: Error | null) => void) {
    if (this.socket !== null) {
      const request: RequestMessage = {
        type: 'remove',
        user: user,
        title: title};
      this.send(JSON.stringify(request));
      this.listen((response: ResponseMessage) => {
        if (response.type === 'remove' && response.success) {
          callback(null);
        } else if (response.type === 'remove' && !response.success && response.error) {
          callback(new Error(response.error));
        } else if (response.type === 'remove' && !response.success) {
          callback(new Error('Note not removed'));
        } else {
          callback(new Error(this.UNKNOWN_RESPONSE));
        }
        this.socket.end();
      });
    }
  }

  /**
   * Método que lee una nota.
   * @param user Usuario
   * @param title Título
   * @param callback Callback
   * @callback err Error o null
   * @callback note Nota o null
   */
  public readNote(user: string, title: string, callback: (err: Error | null, note: Note | null) => void) {
    if (this.socket !== null) {
      const request: RequestMessage = {
        type: 'read',
        user: user,
        title: title};
      this.send(JSON.stringify(request));
      this.listen((response: ResponseMessage) => {
        if (response.type === 'read' && response.success) {
          if (response.notes) {
            callback(null, response.notes[0]);
          }
        } else if (response.type === 'read' && !response.success && response.error) {
          callback(new Error(response.error), null);
        } else if (response.type === 'read' && !response.success) {
          callback(new Error('Note not read'), null);
        } else {
          callback(new Error(this.UNKNOWN_RESPONSE), null);
        }
        this.socket.end();
      });
    }
  }

  /**
   * Método que lista las notas de un usuario.
   * @param user Usuario
   * @param callback Callback
   * @callback err Error o null
   * @callback notes Notas o null
   */
  public listNotes(user: string, callback: (err: Error | null, notes: Note[]) => void) {
    if (this.socket !== null) {
      const request: RequestMessage = {
        type: 'list',
        user: user};
      this.send(JSON.stringify(request));
      this.listen((response: ResponseMessage) => {
        const callbackNotes: Note[] = [];
        if (response.type === 'list' && response.success) {
          if (response.notes) {
            response.notes.forEach((note: Note) => {
              callbackNotes.push(note);
            });
            callback(null, callbackNotes);
          } else {
            callback(new Error('No notes'), []);
          }
        } else if (response.type === 'list' && !response.success && response.error) {
          callback(new Error(response.error), []);
        } else if (response.type === 'list' && !response.success) {
          callback(new Error('Unknown error'), []);
        } else {
          callback(new Error(this.UNKNOWN_RESPONSE), []);
        }
        this.socket.end();
      });
    }
  }
}
