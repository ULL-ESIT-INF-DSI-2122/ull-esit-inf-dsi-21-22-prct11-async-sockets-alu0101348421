[![Tests](https://github.com/ULL-ESIT-INF-DSI-2122/ull-esit-inf-dsi-21-22-prct11-async-sockets-alu0101348421/actions/workflows/test.js.yml/badge.svg)](https://github.com/ULL-ESIT-INF-DSI-2122/ull-esit-inf-dsi-21-22-prct11-async-sockets-alu0101348421/actions/workflows/test.js.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=ULL-ESIT-INF-DSI-2122_ull-esit-inf-dsi-21-22-prct11-async-sockets-alu0101348421&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=ULL-ESIT-INF-DSI-2122_ull-esit-inf-dsi-21-22-prct11-async-sockets-alu0101348421)
[![Coverage Status](https://coveralls.io/repos/github/ULL-ESIT-INF-DSI-2122/ull-esit-inf-dsi-21-22-prct11-async-sockets-alu0101348421/badge.svg?branch=main)](https://coveralls.io/github/ULL-ESIT-INF-DSI-2122/ull-esit-inf-dsi-21-22-prct11-async-sockets-alu0101348421?branch=main)

# Índice
- [Índice](#índice)
- [Introducción](#introducción)
- [Tipos](#tipos)
  - [Color](#color)
  - [RequestMessage](#requestmessage)
  - [ResponseMessage](#responsemessage)
- [Notas](#notas)
- [Cliente](#cliente)
  - [Manejo de la línea de comandos](#manejo-de-la-línea-de-comandos)
- [Servidor](#servidor)
  - [Manejo de la línea de comandos](#manejo-de-la-línea-de-comandos-1)
- [Conclusiones](#conclusiones)
# Introducción
En esta práctica se ponen en uso una gran variedad de conceptos como la programación asíncrona, sockets, manejo de ficheros, eventos, etc.

El desarrollo se basará en un cliente y un servidor que permitan la comunicación entre ellos con el objetivo de realizar un conjunto de operaciones que gestionaran una aplicación de notas.

Estas operaciones serán las siguientes:
- Añadir una nota
- Actualizar una nota
- Eliminar una nota
- Leer una nota
- Listar todas las notas de un usuario

Para trabajar con la aplicación se hará uso de la línea de comandos, y esta será controlada mediante el módulo yargs.
# Tipos
Para la restricción de los colores que se pueden usar en las notas, y un control de los mensajes de petición y respuesta entre cliente y servidor, se definen los siguientes tipos.
## Color
Una simple definición de tipo en el que se establece los colores posibles que se pueden usar en las notas.
```typescript
export type Color = 'red' | 'green' | 'blue' | 'yellow';
```
## RequestMessage
Para los mensajes de petición se establece el tipo de petición, y 4 valores que pueden existir o no:
- **user**: El nombre del propietario de la nota.
- **title**: El título de la nota.
- **body**: El cuerpo de la nota.
- **color**: El color de la nota.
```typescript
export type RequestMessage = {
  type: 'add' | 'update' | 'remove' | 'read' | 'list';
  user?: string;
  title?: string;
  body?: string;
  color?: Color;
};
```
## ResponseMessage
En el caso de los mensajes de respuesta, se define, primero, el tipo de mensaje al que hay que responder, luego, si la operación ha sido realizada con éxito o no. En caso de que la operación requiera devolver una o mas notas, se devuelven también, y en caso de que haya habido un error, se devuelve un mensaje de error.
```typescript
export type ResponseMessage = {
  type: 'add' | 'update' | 'remove' | 'read' | 'list' | 'unknown';
  success: boolean;
  notes?: Note[];
  error?: string;
}
```
# Notas
Para la gestión de las notas, se define la clase Note, que representa una nota con un usuario, un título, un cuerpo y un color.
```typescript
export class Note {
  constructor(
    public user: string,
    public title: string,
    public body: string,
    public color: Color) {}
}
```
# Cliente
La clase cliente tendrá como atributos privados el puerto en el que se va a trabajar y el propio socket que será iniciado en el constructor.
```typescript
export class Client {
  private socket: net.Socket;

  (...)

  constructor(private readonly port: number = 3000) {
    this.socket = net.createConnection(this.port);
  }

  (...)
```
Luego hay tres método básicos para la comunicación con el servidor. El primero es el método send, que envía un mensaje al servidor. El segundo es el método stop, que cierra el socket. El tercero es el método listen, que espera a que llegue un mensaje en formato JSON del servidor y lo devuelve entero en forma de callback.

Para este último método se ha llevado a cabo un patrón que se repetirá en el servidor y se basa en el conteo del número de corchetes que se abren en el mensaje y el número de corchetes que se cierran. Una vez coincidan, se da por finalizado el mensaje y se puede devolver en el callback.

```typescript
  public send(data: string) {
    if (this.socket) {
      this.socket.write(data);
    }
  }

  public stop() {
    if (this.socket) {
      this.socket.end();
    }
  }

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
```

Con estas funciones básicas, lo siguiente son un conjunto de métodos encargados a simplificar la comunicación, evitando que desde fuera de la clase se cree el mensaje JSON, y que en su lugar, se llame a una función que formatee correctamente el mensaje y gestione los errores.

- **addNote**: Añade una nota.
En primer lugar, se formatea el mensaje de petición, se envía al servidor y se espera la respuesta. Una vez llega la respuesta, dependiendo de los atributos del mensaje, se devuelve un error o no en el callback.
```typescript
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
        } else {
          callback(new Error(this.UNKNOWN_RESPONSE));
        }
        this.socket.end();
      });
    }
  }
```
- **updateNote**: Actualiza una nota.
Esta función es similar a la anterior, pero se envía un mensaje de actualización en lugar de uno de añadir.
```typescript
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
        } else {
          callback(new Error(this.UNKNOWN_RESPONSE));
        }
        this.socket.end();
      });
    }
  }
```
- **removeNote**: Elimina una nota.
Esta función solo requiere del usuario y el título de la nota que se quiere eliminar.
```typescript
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
        } else {
          callback(new Error(this.UNKNOWN_RESPONSE));
        }
        this.socket.end();
      });
    }
  }
```
- **readNote**: Lee una nota.
Esta función se diferencia de las anteriores en el callback, ya que en este caso, además del posible error, se devuelve la nota que se quiere leer.
```typescript
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
        } else {
          callback(new Error(this.UNKNOWN_RESPONSE), null);
        }
        this.socket.end();
      });
    }
  }
```
- **listNotes**: Lista todas las notas de un usuario.
Y al igual que la anterior, se envía el mensaje de petición y se espera la respuesta, devolviendo una lista de notas en caso de que todo haya ido bien.
```typescript
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
        } else {
          callback(new Error(this.UNKNOWN_RESPONSE), []);
        }
        this.socket.end();
      });
    }
  }
```
## Manejo de la línea de comandos
Para el manejo de la línea de comandos, se utiliza el módulo `yargs` en el cuál tendremos las siguientes opciones:
- **add**: Añade una nota.
  - user
  - title
  - body
  - color
- **update**: Actualiza una nota.
  - user
  - title
  - body
  - color
- **remove**: Elimina una nota.
  - user
  - title
- **read**: Lee una nota.
  - user
  - title
- **list**: Lista todas las notas de un usuario.
  - user
- **help**: Muestra la ayuda.

Como todos los comandos siguen el mismo formato, vamos a ver únicamente el comando de añadir una nota.
```typescript
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
```
Aquí se puede ver que primero describimos la entrada de datos de la línea de comandos, para posteriormente, en el handler, hacer ciertas comprobaciones y llamar a la función de añadir una nota.
Luego, para que imprimir la información de forma correcta, se utiliza el módulo `chalk` para poder pintar los mensajes de color.
# Servidor
Para la clase encargada del lado del servidor, tendremos en el constructor el directorio que trataremos como base de datos y el puerto sobre el que vamos a trabajar.

Dentro de este constructor, primero se comprueba que exista el directorio que se indica, y en caso contrario, se crea.

Luego, se crea un socket en el puerto que se indica y se inicia la escucha por peticiones.

Esta recepción de peticiones seguirá el mismo patrón que nombramos en el lado del cliente, y una vez se reciba un mensaje, se ejecutará un método que se encargará de manejarlo para después volver al constructor para enviar la respuesta.

```typescript
export class Server {
  private readonly dbDir: string;
  private readonly server: net.Server;

  MISSING_PARAMETERS = 'Missing parameters';
  NOTE_NOT_EXISTS = 'Note does not exist';
  USER_NOT_EXISTS = 'User does not exist';

  constructor(dbDir = './db', port = 3000) {
    if (!fs.existsSync(dbDir)) {
      if (dbDir[0] === '/') {
        fs.mkdirSync(dbDir);
        this.dbDir = dbDir;
      } else {
        const pwd = process.cwd();
        fs.mkdirSync(`${pwd}/${dbDir}`);
        this.dbDir = `${pwd}/${dbDir}`;
      }
    } else {
      this.dbDir = dbDir;
    }
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
  (...)
}
```
Esta función de la que hablábamos que manejaría la petición que se recibe es, conceptualmente, un switch que devuelve la respuesta en un callback.
```typescript
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
```
Luego, estas funciones a las que se llaman aquí serán las encargadas de manejar la petición específica y trabajar con los archivos de las notas, además de devolver la respuesta adecuada o un error en caso de que algo falle.
- **addNote**: añade una nota a la base de datos.
En esta función, lo primero que se hace es comprobar los datos recibidos y crear una nota con ellos. A continuación, se comprueban los ficheros de la base de datos, y si todo es correcto, se parsea la nota y se añade a la base de datos.
```typescript
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
      fs.mkdir(`${this.dbDir}/${request.user}`, (mkdirErr) => {
        if (mkdirErr) {
          callback({
            type: 'add',
            success: false,
            error: mkdirErr.message});
        } else {
          fs.writeFile(`${this.dbDir}/${request.user}/${request.title}.json`, JSON.stringify(note), (writeErr) => {
            if (writeErr) {
              callback({
                type: 'add',
                success: false,
                error: writeErr.message});
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
```
- **updateNote**: actualiza una nota existente en la base de datos.
Esta función es prácticamente un calco de la anterior con la diferencia de que el caso en el que se escribe la nota es el contrario al de añadir. En el primero, solo se añade en caso de que esta no exista, y en este, solo se actualiza en caso de que exista.
```typescript
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
```
- **removeNote**: elimina una nota existente en la base de datos.
En este caso, primero se comprueba que exista el usuario, luego que exista la nota, y si todo es correcto, se elimina.
```typescript
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
```
- **readNote**: devuelve una nota existente en la base de datos.
En esta función, comprobaremos que exista el fichero dentro del directorio del usuario, y si es así, lo leeremos, creamos una nota con los datos leídos, y devolvemos la nota.
```typescript
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
```
- **listNotes**: devuelve una lista de todas las notas existentes en la base de datos.
Por último, en este apartado, comprobamos que exista el usuario, y si es así, creamos una lista de notas, vamos leyendo todas las notas y añadiéndolas a la lista para devolverla en el mensaje de respuesta.
```typescript
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
```

Por último, creamos una función para detener al servidor de forma explícita.
```typescript
  public stop() {
    this.server.close();
  }
```
## Manejo de la línea de comandos
El manejo de la línea de comandos para el lado del servidor es más simple que para el lado del cliente.

Nos bastará con dos comandos, uno para inicializar directamente el servidor, y otro para inicializarlo con un timeout que cierre el servidor automáticamente.

- **start**: inicializa el servidor.
  - port: el puerto en el que se va a escuchar.
```typescript
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
```
- **timeout**: inicializa el servidor con un timeout que lo cierra automáticamente.
  - timeout: el tiempo de espera antes de cerrar el servidor.
  - port: el puerto en el que se va a escuchar.
```typescript
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
```
# Conclusiones
Esta práctica ha sido realmente amplia en cuanto a la cantidad de diferentes temas que se han tratado. En primer lugar, el manejo de los ficheros ya los habíamos tratado en prácticas anteriores, pero el hecho de trabajarlos de forma asíncrona añaden una dificultad extra, y si a eso se le suma el uso de sockets para enviar y recibir datos, la complejidad vuelve a aumentar otro grado. Sin embargo, es una buena forma de trabajar con todos estos temas y poder implementarlos todos conjuntamente.