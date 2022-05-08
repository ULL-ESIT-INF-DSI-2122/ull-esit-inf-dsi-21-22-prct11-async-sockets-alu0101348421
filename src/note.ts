import {Color} from './types';

/**
 * Clase que representa una nota.
 * @class Note
 */
export class Note {
  /**
   * Constructor de la clase.
   * @param user Usuario.
   * @param title Título.
   * @param body Cuerpo.
   * @param color Color.
   * @constructor
   */
  constructor(
    public user: string,
    public title: string,
    public body: string,
    public color: Color) {}
}
