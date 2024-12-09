import { sql, poolPromise } from "../../config/database.js";

class PlazoPagoRepository {
  constructor() {
    this.tabla = "oc.PlazoPago"; // Esquema y tabla
  }

  // Obtener todos los PlazoPagos
  async getAll() {
    try {
      const pool = await poolPromise;
      const result = await pool.request().query(`
          SELECT 
            id_forma_pago, 
            nombre, 
            estatus_forma_pago, 
            fecha_creacion, 
            fecha_actualizacion 
          FROM ${this.tabla}
        `);
      return result.recordset;
    } catch (error) {
      console.error("Error en PlazoPagoRepository.getAll:", error);
      throw error;
    }
  }

  // Obtener un PlazoPago por su ID
  async getById(id_forma_pago) {
    try {
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("id_forma_pago", sql.Int, id_forma_pago).query(`
          SELECT 
            id_forma_pago, 
            nombre, 
            estatus_forma_pago, 
            fecha_creacion, 
            fecha_actualizacion 
          FROM ${this.tabla}
          WHERE id_forma_pago = @id_forma_pago
        `);
      return result.recordset[0];
    } catch (error) {
      console.error("Error en PlazoPagoRepository.getById:", error);
      throw error;
    }
  }

  // Crear un nuevo PlazoPago
  async create(datos) {
    try {
      const pool = await poolPromise;
      await pool
        .request()
        .input("nombre", sql.VarChar, datos.nombre)
        .input("estatus_forma_pago", sql.Bit, datos.estatus_forma_pago)
        .input("fecha_creacion", sql.Date, datos.fecha_creacion)
        .input("fecha_actualizacion", sql.Date, datos.fecha_actualizacion)
        .query(`
          INSERT INTO ${this.tabla} 
            (nombre, estatus_forma_pago, fecha_creacion, fecha_actualizacion)
          VALUES 
            (@nombre, @estatus_forma_pago, @fecha_creacion, @fecha_actualizacion)
        `);
    } catch (error) {
      console.error("Error en PlazoPagoRepository.create:", error);
      throw error;
    }
  }

  // Actualizar un PlazoPago existente
  async update(id_forma_pago, datos) {
    try {
      const pool = await poolPromise;
      await pool
        .request()
        .input("id_forma_pago", sql.Int, id_forma_pago)
        .input("nombre", sql.VarChar, datos.nombre)
        .input("estatus_forma_pago", sql.Bit, datos.estatus_forma_pago)
        .input("fecha_actualizacion", sql.Date, datos.fecha_actualizacion)
        .query(`
          UPDATE ${this.tabla}
          SET 
            nombre = @nombre,
            estatus_forma_pago = @estatus_forma_pago,
            fecha_actualizacion = @fecha_actualizacion
          WHERE id_forma_pago = @id_forma_pago
        `);
    } catch (error) {
      console.error("Error en PlazoPagoRepository.update:", error);
      throw error;
    }
  }

  // Actualizar el estatus de un PlazoPago (0 o 1)
  async actualizarEstatus(id_forma_pago, estatus_forma_pago) {
    try {
      const pool = await poolPromise;
      await pool
        .request()
        .input("id_forma_pago", sql.Int, id_forma_pago)
        .input("estatus_forma_pago", sql.Bit, estatus_forma_pago)
        .input("fecha_actualizacion", sql.Date, new Date()).query(`
          UPDATE ${this.tabla}
          SET 
            estatus_forma_pago = @estatus_forma_pago,
            fecha_actualizacion = @fecha_actualizacion
          WHERE id_forma_pago = @id_forma_pago
        `);
    } catch (error) {
      console.error("Error en PlazoPagoRepository.actualizarEstatus:", error);
      throw error;
    }
  }
}

export default PlazoPagoRepository;
