import { sql, poolPromise } from "../../config/database.js";

class CuentaRepository {
  constructor() {
    this.tabla = "oc.Cuentas"; // Esquema y tabla
  }

  // Obtener todas las Cuentas
  async getAll() {
    try {
      const pool = await poolPromise;
      const result = await pool
        .request()
        .query(`SELECT id_cuenta, codigo, nombre_cuenta FROM ${this.tabla}`);
      return result.recordset;
    } catch (error) {
      console.error("Error en CuentaRepository.getAll:", error);
      throw error;
    }
  }

  // Obtener una Cuenta por su ID
  async getById(id) {
    try {
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("id_cuenta", sql.Int, id)
        .query(
          `SELECT id_cuenta, codigo, nombre_cuenta FROM ${this.tabla} WHERE id_cuenta = @id_cuenta`
        );
      return result.recordset[0];
    } catch (error) {
      console.error("Error en CuentaRepository.getById:", error);
      throw error;
    }
  }

  // Crear una nueva Cuenta
  async create(datos) {
    try {
      const pool = await poolPromise;
      await pool
        .request()
        .input("codigo", sql.VarChar, datos.codigo)
        .input("nombre_cuenta", sql.VarChar, datos.nombre_cuenta).query(`
          INSERT INTO ${this.tabla} (codigo, nombre_cuenta)
          VALUES (@codigo, @nombre_cuenta)
        `);
    } catch (error) {
      console.error("Error en CuentaRepository.create:", error);
      throw error;
    }
  }

  // Actualizar una Cuenta existente
  async update(id, datos) {
    try {
      const pool = await poolPromise;
      await pool
        .request()
        .input("id_cuenta", sql.Int, id)
        .input("codigo", sql.VarChar, datos.codigo)
        .input("nombre_cuenta", sql.VarChar, datos.nombre_cuenta).query(`
          UPDATE ${this.tabla}
          SET codigo = @codigo,
              nombre_cuenta = @nombre_cuenta
          WHERE id_cuenta = @id_cuenta
        `);
    } catch (error) {
      console.error("Error en CuentaRepository.update:", error);
      throw error;
    }
  }
}

export default CuentaRepository;
