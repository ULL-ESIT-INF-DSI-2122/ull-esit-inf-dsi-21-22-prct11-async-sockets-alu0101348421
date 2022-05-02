export type Color = 'red' | 'green' | 'blue' | 'yellow';

export class Note {
  constructor(
    public user: string,
    public title: string,
    public body: string,
    public color: Color) {}
}
