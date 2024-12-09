import { sql, poolPromise } from "../../config/database.js";

class MonedaRepository {
  constructor() {
    this.tabla = "oc.Monedas"; // Esquema y tabla
  }

  // Obtener todas las Monedas
  async getAll() {
    try {
      const pool = await poolPromise;
      const result = await pool.request().query(`
          SELECT 
            id_moneda, 
            abrev, 
            nombre, 
            fecha_creacion, 
            fecha_sistema, 
            cambio 
          FROM ${this.tabla}
        `);
      return result.recordset;
    } catch (error) {
      console.error("Error en MonedaRepository.getAll:", error);
      throw error;
    }
  }

  // Obtener una Moneda por su ID
  async getById(id_moneda) {
    try {
      const pool = await poolPromise;
      const result = await pool.request().input("id_moneda", sql.Int, id_moneda)
        .query(`
          SELECT 
            id_moneda, 
            abrev, 
            nombre, 
            fecha_creacion, 
            fecha_sistema, 
            cambio 
          FROM ${this.tabla}
          WHERE id_moneda = @id_moneda
        `);
      return result.recordset[0];
    } catch (error) {
      console.error("Error en MonedaRepository.getById:", error);
      throw error;
    }
  }

  // Crear una nueva Moneda
  async create(datos) {
    try {
      const pool = await poolPromise;
      await // fecha_sistema se manejará automáticamente en la base de datos
      pool
        .request()
        .input("abrev", sql.VarChar, datos.abrev)
        .input("nombre", sql.VarChar, datos.nombre)
        .input("cambio", sql.VarChar, datos.cambio)
        .input("fecha_creacion", sql.DateTime, datos.fecha_creacion).query(`
          INSERT INTO ${this.tabla} 
            (abrev, nombre, cambio, fecha_creacion)
          VALUES 
            (@abrev, @nombre, @cambio, @fecha_creacion)
        `);
    } catch (error) {
      console.error("Error en MonedaRepository.create:", error);
      throw error;
    }
  }

  // Actualizar una Moneda existente
  async update(id_moneda, datos) {
    try {
      const pool = await poolPromise;
      await pool
        .request()
        .input("id_moneda", sql.Int, id_moneda)
        .input("abrev", sql.VarChar, datos.abrev)
        .input("nombre", sql.VarChar, datos.nombre)
        .input("cambio", sql.VarChar, datos.cambio)
        .input("fecha_actualizacion", sql.DateTime, datos.fecha_actualizacion)
        .query(`
          UPDATE ${this.tabla}
          SET 
            abrev = @abrev,
            nombre = @nombre,
            cambio = @cambio,
            fecha_actualizacion = @fecha_actualizacion
          WHERE id_moneda = @id_moneda
        `);
    } catch (error) {
      console.error("Error en MonedaRepository.update:", error);
      throw error;
    }
  }
}

export default MonedaRepository;
