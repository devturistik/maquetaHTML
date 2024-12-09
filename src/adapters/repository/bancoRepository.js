import { sql, poolPromise } from "../../config/database.js";

class BancoRepository {
  constructor() {
    this.tabla = "oc.Banco"; // Esquema y tabla
  }

  // Obtener todos los Bancos activos
  async getAll() {
    try {
      const pool = await poolPromise;
      const result = await pool
        .request()
        .query(`SELECT id_banco, nombre_banco, estatus FROM ${this.tabla}`);
      return result.recordset;
    } catch (error) {
      console.error("Error en BancoRepository.getAll:", error);
      throw error;
    }
  }

  // Obtener Bancos por estatus
  async getByEstatus(estatus) {
    try {
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("estatus", sql.Int, estatus)
        .query(
          `SELECT id_banco, nombre_banco, estatus FROM ${this.tabla} WHERE estatus = @estatus`
        );
      return result.recordset;
    } catch (error) {
      console.error("Error en BancoRepository.getByEstatus:", error);
      throw error;
    }
  }

  // Obtener un Banco por su ID (independientemente del estatus)
  async getById(id) {
    try {
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("id_banco", sql.Int, id)
        .query(
          `SELECT id_banco, nombre_banco, estatus FROM ${this.tabla} WHERE id_banco = @id_banco`
        );
      return result.recordset[0];
    } catch (error) {
      console.error("Error en BancoRepository.getById:", error);
      throw error;
    }
  }

  // Crear un nuevo Banco
  async create(datos) {
    try {
      const pool = await poolPromise;
      await pool
        .request()
        .input("nombre_banco", sql.VarChar, datos.nombre_banco)
        .input("estatus", sql.Int, datos.estatus).query(`
          INSERT INTO ${this.tabla} (nombre_banco, estatus, created_at, updated_at)
          VALUES (@nombre_banco, @estatus, GETDATE(), GETDATE())
        `);
    } catch (error) {
      console.error("Error en BancoRepository.create:", error);
      throw error;
    }
  }

  // Actualizar un Banco existente
  async update(id, datos) {
    try {
      const pool = await poolPromise;
      await pool
        .request()
        .input("id_banco", sql.Int, id)
        .input("nombre_banco", sql.VarChar, datos.nombre_banco)
        .input("estatus", sql.Int, datos.estatus).query(`
          UPDATE ${this.tabla}
          SET nombre_banco = @nombre_banco,
              estatus = @estatus,
              updated_at = GETDATE()
          WHERE id_banco = @id_banco
        `);
    } catch (error) {
      console.error("Error en BancoRepository.update:", error);
      throw error;
    }
  }

  // Actualizar el estatus de un Banco
  async actualizarEstatus(id, estatus) {
    try {
      const pool = await poolPromise;
      await pool
        .request()
        .input("id_banco", sql.Int, id)
        .input("estatus", sql.Int, estatus).query(`
          UPDATE ${this.tabla}
          SET estatus = @estatus,
              updated_at = GETDATE()
          WHERE id_banco = @id_banco
        `);
    } catch (error) {
      console.error("Error en BancoRepository.actualizarEstatus:", error);
      throw error;
    }
  }

  async obtenerTodosLosBancosActivos() {
    try {
      const pool = await poolPromise;
      const result = await pool.request().query(`
          SELECT id_banco, nombre_banco, estatus
          FROM ${this.tabla}
          WHERE estatus = 1
        `);
      return result.recordset;
    } catch (error) {
      console.error(
        "Error en BancoRepository.obtenerTodosLosBancosActivos:",
        error
      );
      throw error;
    }
  }
}

export default BancoRepository;
