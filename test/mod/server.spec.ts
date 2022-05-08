// import 'mocha';
// import {expect} from 'chai';
// import {exec} from 'child_process';
// import * as sinon from 'sinon';
// import {Server} from '../../src/mod/server';
// import {Client} from '../../src/mod/client';

// describe('Server', () => {
//   let client: Client;
//   let server: Server;
//   let runningServer: any;

//   before(() => {
//     runningServer = exec('node dist/mod/server.js');
//     sinon.stub(console, 'log');
//     server = new Server(3001);
//     client = new Client(3001);
//   });

//   it('should be able to start', () => {
//     expect(server).to.be.an.instanceof(Server);
//     expect(server).respondTo('start');
//   });

//   it('should be able to receive a message', (done) => {
//     let output = '';
//     runningServer.stdout.on('data', (data: any) => {
//       output += data;
//     });
//     runningServer.stdout.on('end', () => {
//       expect(output).to.include('Hello world!');
//       done();
//     });
//     client.sendMsg('Hello world!');
//   });
// });