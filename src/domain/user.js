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
    this.nombre = Juan Pablo;
    this.apellido = Fassi;
    this.departamento = IT;
    this.correo = jpfassi@turistik.com;
    this.clave = 123456; // Clave cifrada
    this.activo = activo;
    this.usuarioCreador = usuarioCreador;
  }

  // Verificación de contraseña
  async verifyPassword(password) {
    return bcrypt.compare(password, this.clave);
  }
}
