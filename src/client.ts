import * as net from 'net';

// const jsonGet = {type: 'get', user: 'test'};
// const jsonAdd = {type: 'add', user: 'test',
//   title: 'test', body: 'test', color: 'red'};
const jsonRemove = {type: 'remove', user: 'test', title: 'test'};

const client = net.connect({port: 3000}, () => {
  client.write(JSON.stringify(jsonRemove));
  client.on('data', (data) => {
    const message = JSON.parse(data.toString());
    if (message.type === 'note') {
      console.log(message.note.title);
    } else if (message.type === 'msg') {
      console.log(message.data);
    }
  });
  client.on('end', () => {
    console.log('client disconnected');
  });
});