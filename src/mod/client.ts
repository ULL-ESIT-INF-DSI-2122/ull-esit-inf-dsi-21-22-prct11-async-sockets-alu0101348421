import * as net from 'net';


/**
 * Clase que representa un cliente capaz de mandar comandos a un servidor.
 * @class Client
 */
export class Client {
  /**
   * Socket
   * @type {net.Socket}
   */
  private socket: net.Socket;

  /**
   * Constructor de la clase Client.
   * @param port Puerto en el que escucha el servidor.
   */
  constructor(private port: number) {
    this.socket = new net.Socket();
    this.start();
  }

  /**
   * Método que inicia el cliente y se conecta al servidor.
   */
  start() {
    this.socket.connect(this.port);
  }

  /**
   * Método que envía un mensaje al servidor.
   * @param data Mensaje a enviar.
   */
  sendMsg(msg: string) {
    this.socket.write(JSON.stringify({type: 'print', data: msg}));
    this.socket.end();
    this.listen((data) => {
      const json = JSON.parse(data);
      if (json.type === 'print') {
        console.log(json.data);
      }
    });
  }

  /**
   * Método que envía un comando al servidor.
   * @param command Comando a enviar.
   * @param args Argumentos del comando.
   */
  sendCommand(command: string, args: string[]) {
    this.socket.write(JSON.stringify({type: 'command', command, args}));
    this.socket.end();
    this.listen((data) => {
      const json = JSON.parse(data);
      if (json.type === 'print') {
        console.log(json.data);
      }
    });
  }

  /**
   * Método que escucha los mensajes del servidor.
   * @param callback Función a ejecutar cuando se recibe un mensaje.
   */
  listen(callback: (data: string) => void) {
    let output = '';
    this.socket.on('data', (dataJSON) => {
      output += dataJSON.toString();
    });
    this.socket.on('end', () => {
      callback(output);
    });
  }
}

const client = new Client(3001);
client.sendCommand('ls', ['-l', '/home/usuario/DSI-P11/']);