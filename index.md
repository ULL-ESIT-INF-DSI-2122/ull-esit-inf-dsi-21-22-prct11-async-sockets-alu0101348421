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

Dentro de este constructor, primero comprobase
## Manejo de la línea de comandos
# Conclusiones