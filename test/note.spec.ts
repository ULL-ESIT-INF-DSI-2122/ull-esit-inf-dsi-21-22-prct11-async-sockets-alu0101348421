import 'mocha';
import {expect} from 'chai';
import {Note} from '../src/note';

describe('Note', () => {
  let note: Note;
  beforeEach(() => {
    note = new Note('User', 'Title', 'Body', 'red');
  });

  it('should be a Note', () => {
    expect(note).to.be.an.instanceof(Note);
  });

  it('should have a user', () => {
    expect(note.user).to.equal('User');
  });

  it('should have a title', () => {
    expect(note.title).to.equal('Title');
  });

  it('should have a body', () => {
    expect(note.body).to.equal('Body');
  });

  it('should have a color', () => {
    expect(note.color).to.equal('red');
  });
});