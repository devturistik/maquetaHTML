// src/domain/role.js
export default class Role {
  constructor({ id, nombre, nivelJerarquia }) {
    this.id = id; // ID del rol
    this.nombre = nombre; // Nombre del rol
    this.nivelJerarquia = nivelJerarquia; // Nivel jerárquico del rol
  }

  /**
   * Compara este rol con otro por nivel jerárquico.
   * @param {Role} otroRol - Otro rol para comparar.
   * @returns {boolean} True si este rol tiene un nivel mayor o igual.
   */
  hasHigherOrEqualHierarchy(otroRol) {
    return this.nivelJerarquia >= otroRol.nivelJerarquia;
  }
}
