// src/domain/system.js
export default class System {
  constructor({ id, nombre, descripcion }) {
    this.id = id; // ID del sistema
    this.nombre = nombre; // Nombre del sistema
    this.descripcion = descripcion; // Descripción del sistema
  }

  /**
   * Actualiza la descripción del sistema.
   * @param {string} nuevaDescripcion - Nueva descripción del sistema.
   */
  updateDescripcion(nuevaDescripcion) {
    this.descripcion = nuevaDescripcion;
  }
}
