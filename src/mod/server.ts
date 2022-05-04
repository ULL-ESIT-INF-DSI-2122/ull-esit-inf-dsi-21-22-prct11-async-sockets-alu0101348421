import * as net from 'net';
import {spawn} from 'child_process';

/**
 * Clase que representa un servidor.
 * @class Server
 */
export class Server {
  /**
   * Constructor de la clase Server.
   * @param port Puerto en el que escucha el servidor.
   * @constructor
   */
  constructor(private port: number) {}

  /**
   * Método que inicia el servidor y permanece a la escucha de conexiones.
   */
  start() {
    const server = net.createServer({allowHalfOpen: true}, (socket) => {
      console.log('client connected');
      let msg = '';
      socket.on('data', (dataJSON) => {
        msg += dataJSON.toString();
      });
      socket.on('end', () => {
        const json = JSON.parse(msg);
        if (json.type === 'print') {
          console.log(json.data);
          socket.write(JSON.stringify({type: 'print', data: 'Hello World'}));
          console.log('client disconnected');
          socket.end();
        } else if (json.type === 'command') {
          console.log('\tcommand: ' + json.command + ' ' + json.args.join(' '));
          const child = spawn(json.command, [...json.args]);
          let output = '';
          child.stdout.on('data', (data) => {
            output += data;
          });
          child.on('close', () => {
            console.log('\tchild process exited with code ' + child.exitCode);
            socket.write(JSON.stringify({type: 'print', data: output}));
            console.log('client disconnected');
            socket.end();
          });
        }
      });
      socket.on('error', (err) => {
        console.log(err);
      });
    });
    server.listen(this.port, () => {
      console.log('Server listening on port ' + this.port);
    });
  }
}

const server = new Server(3001);
server.start();