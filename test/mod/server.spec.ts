import 'mocha';
import {expect} from 'chai';
import {spawn} from 'child_process';
import kill from 'tree-kill';
// import sinon
import * as sinon from 'sinon';
import {Server} from '../../src/mod/server';
import {Client} from '../../src/mod/client';

describe('Server', () => {
  let client: Client;
  let server: Server;
  let child: any;
  before(() => {
    child = spawn('node', ['../../src/mod/server.js']);
    sinon.stub(console, 'log');
    server = new Server(3000);
    client = new Client(3000);
  });


  it('should be able to start', () => {
    expect(server).to.be.an.instanceof(Server);
    expect(server).respondTo('start');
  });

  it('should be able to receive a message', (done) => {
    let output = '';
    child.stdout.on('data', (data: any) => {
      output += data;
    });
    child.on('close', () => {
      expect(output).to.not.be.null;
      done();
    });
    client.sendMsg('Hello World');
  });
});