import {Note} from './note';

/**
 * tipo de dato para el color
 */
export type Color = 'red' | 'green' | 'blue' | 'yellow';

/**
 * Modelo para un mensaje de petición.
 */
export type RequestMessage = {
  type: 'add' | 'update' | 'remove' | 'read' | 'list';
  user?: string;
  title?: string;
  body?: string;
  color?: Color;
};

/**
 * Modelo para un mensaje de respuesta.
 */
export type ResponseMessage = {
  type: 'add' | 'update' | 'remove' | 'read' | 'list' | 'unknown';
  success: boolean;
  notes?: Note[];
  error?: string;
}