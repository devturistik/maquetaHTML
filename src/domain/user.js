// src/domain/user.js
export default class User {
  constructor({
    id,
    nombre,
    apellido,
    departamento,
    correo,
    clave,
    activo,
    usuarioCreador,
  }) {
    this.id = id;
    this.nombre = nombre;
    this.apellido = apellido;
    this.departamento = departamento;
    this.correo = correo;
    this.clave = clave; // Clave cifrada
    this.activo = activo;
    this.usuarioCreador = usuarioCreador;
  }

  // Verificación de contraseña
  async verifyPassword(password) {
    return bcrypt.compare(password, this.clave);
  }
}
