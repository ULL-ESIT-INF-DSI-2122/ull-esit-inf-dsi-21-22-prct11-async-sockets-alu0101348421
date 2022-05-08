import 'mocha';
import {expect} from 'chai';
import * as sinon from 'sinon';
import * as fs from 'fs';
import {Server} from '../src/server';
import {Client} from '../src/client';
import {Note} from '../src/note';
import {Color} from '../src/types';

describe('server & client', () => {
  let server: Server;
  before(() => {
    server = new Server();
    sinon.stub(console, 'log');
  });
  after(() => {
    server.stop();
    sinon.restore();
  });

  it('a client should be able to connect and disconnect', (done) => {
    const client = new Client();
    client.stop();
    done();
  });

  it('should be able to add a note', (done) => {
    const note = new Note('testUser', 'testTitle', 'testBody', 'yellow');
    const client = new Client();
    client.addNote(note, (err) => {
      expect(err).to.be.null;
      expect(fs.existsSync('./db/testUser')).to.be.true;
      done();
    });
  });

  it('should not be able to add a note with repeated title', (done) => {
    const note = new Note('testUser', 'testTitle', 'testBody', 'yellow');
    const client = new Client();
    client.addNote(note, (err) => {
      if (err) {
        expect(err.message).to.equal('Note already exists');
      } else {
        expect.fail();
      }
      expect(fs.existsSync('./db/testUser')).to.be.true;
      done();
    });
  });

  it('should be able to update a note', (done) => {
    const newNote = new Note('testUser', 'testTitle', 'newTestBody', 'blue');
    const client = new Client();
    client.updateNote(newNote, (err) => {
      expect(err).to.be.null;
      expect(fs.existsSync('./db/testUser')).to.be.true;
      expect(fs.readFileSync('./db/testUser/testTitle.json').toString()).to.equal(JSON.stringify(newNote));
      done();
    });
  });

  it('should not be able to update a note if it does not exist', (done) => {
    const newNote = new Note('testUser', 'noTitle', 'TestBody', 'blue');
    const client = new Client();
    client.updateNote(newNote, (err) => {
      if (err) {
        expect(err.message).to.equal('Note does not exist');
      } else {
        expect.fail();
      }
      done();
    });
  });

  it('should be able to read a note', (done) => {
    const client = new Client();
    client.readNote('testUser', 'testTitle', (err, note) => {
      expect(err).to.be.null;
      if (note) {
        expect(note.user as string).to.equal('testUser');
        expect(note.title as string).to.equal('testTitle');
        expect(note.body as string).to.equal('newTestBody');
        expect(note.color as Color).to.equal('blue');
      } else {
        expect.fail();
      }
      done();
    });
  });

  it('should not be able to read a note if it does not exist', (done) => {
    const client = new Client();
    client.readNote('testUser', 'noTitle', (err, note) => {
      if (err) {
        expect(err.message).to.equal('Note does not exist');
      } else {
        expect.fail();
      }
      done();
    });
  });

  it('should be able to list all notes of a user', (done) => {
    const client = new Client();
    client.listNotes('testUser', (err, notes) => {
      expect(err).to.be.null;
      if (notes) {
        expect(notes.length).to.equal(1);
        expect(notes[0].user as string).to.equal('testUser');
        expect(notes[0].title as string).to.equal('testTitle');
        expect(notes[0].body as string).to.equal('newTestBody');
        expect(notes[0].color as Color).to.equal('blue');
      } else {
        expect.fail();
      }
      done();
    });
  });

  it('should not be able to list the notes of a user if it does not exist', (done) => {
    const client = new Client();
    client.listNotes('noUser', (err, notes) => {
      if (err) {
        expect(err.message).to.equal('User does not exist');
      } else {
        expect.fail();
      }
      done();
    });
  });

  it('should be able to delete a note', (done) => {
    const client = new Client();
    client.removeNote('testUser', 'testTitle', (err) => {
      expect(err).to.be.null;
      expect(fs.existsSync('./db/testUser')).to.be.true;
      expect(fs.existsSync('./db/testUser/testTitle.json')).to.be.false;
      done();
    });
  });

  it('should not be able to delete a note if it does not exist', (done) => {
    const client = new Client();
    client.removeNote('testUser', 'noTitle', (err) => {
      if (err) {
        expect(err.message).to.equal('Note does not exist');
      } else {
        expect.fail();
      }
      done();
    });
  });
});