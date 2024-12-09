import { sql, poolPromise } from "../../config/database.js";

class EmpresaRepository {
  constructor() {
    this.tabla = "oc.Empresa"; // Esquema y tabla
  }

  // Obtener todas las Empresas que no están eliminadas
  async getAll() {
    try {
      const pool = await poolPromise;
      const result = await pool.request().query(`
          SELECT 
            id_empresa, 
            nombre, 
            documento, 
            giro, 
            direccion, 
            telefono, 
            correo, 
            encargado, 
            estatus_empresa, 
            fecha_creacion, 
            fecha_actualizacion 
          FROM ${this.tabla}
          WHERE eliminado = 0
        `);
      return result.recordset;
    } catch (error) {
      console.error("Error en EmpresaRepository.getAll:", error);
      throw error;
    }
  }

  // Obtener Empresas por estatus (Activo/Inactivo) que no están eliminadas
  async getByEstatus(estatus_empresa) {
    try {
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("estatus_empresa", sql.VarChar, estatus_empresa).query(`
          SELECT 
            id_empresa, 
            nombre, 
            documento, 
            giro, 
            direccion, 
            telefono, 
            correo, 
            encargado, 
            estatus_empresa, 
            fecha_creacion, 
            fecha_actualizacion 
          FROM ${this.tabla}
          WHERE estatus_empresa = @estatus_empresa AND eliminado = 0
        `);
      return result.recordset;
    } catch (error) {
      console.error("Error en EmpresaRepository.getByEstatus:", error);
      throw error;
    }
  }

  // Obtener una Empresa por su ID, si no está eliminada
  async getById(id_empresa) {
    try {
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("id_empresa", sql.Int, id_empresa).query(`
          SELECT 
            id_empresa, 
            nombre, 
            documento, 
            giro, 
            direccion, 
            telefono, 
            correo, 
            encargado, 
            estatus_empresa, 
            fecha_creacion, 
            fecha_actualizacion 
          FROM ${this.tabla}
          WHERE id_empresa = @id_empresa AND eliminado = 0
        `);
      return result.recordset[0];
    } catch (error) {
      console.error("Error en EmpresaRepository.getById:", error);
      throw error;
    }
  }

  // Crear una nueva Empresa
  async create(datos) {
    try {
      const pool = await poolPromise;
      const fechaActualizacion = datos.fecha_actualizacion
        ? datos.fecha_actualizacion
        : new Date();

      await pool
        .request()
        .input("nombre", sql.VarChar, datos.nombre)
        .input("documento", sql.VarChar, datos.documento)
        .input("giro", sql.VarChar, datos.giro)
        .input("direccion", sql.VarChar, datos.direccion)
        .input("telefono", sql.VarChar, datos.telefono)
        .input("correo", sql.VarChar, datos.correo)
        .input("encargado", sql.VarChar, datos.encargado)
        .input("estatus_empresa", sql.VarChar, datos.estatus_empresa)
        .input("eliminado", sql.Int, datos.eliminado)
        .input("fecha_creacion", sql.Date, new Date())
        .input("fecha_actualizacion", sql.Date, fechaActualizacion)
        .query(`
          INSERT INTO ${this.tabla} 
            (nombre, documento, giro, direccion, telefono, correo, encargado, estatus_empresa, eliminado, fecha_creacion, fecha_actualizacion)
          VALUES 
            (@nombre, @documento, @giro, @direccion, @telefono, @correo, @encargado, @estatus_empresa, @eliminado, @fecha_creacion, @fecha_actualizacion)
        `);
    } catch (error) {
      console.error("Error en EmpresaRepository.create:", error);
      throw error;
    }
  }

  // Actualizar una Empresa existente
  async update(id_empresa, datos) {
    try {
      const pool = await poolPromise;
      const fechaActualizacion = datos.fecha_actualizacion
        ? datos.fecha_actualizacion
        : new Date();

      await pool
        .request()
        .input("id_empresa", sql.Int, id_empresa)
        .input("nombre", sql.VarChar, datos.nombre)
        .input("documento", sql.VarChar, datos.documento)
        .input("giro", sql.VarChar, datos.giro)
        .input("direccion", sql.VarChar, datos.direccion)
        .input("telefono", sql.VarChar, datos.telefono)
        .input("correo", sql.VarChar, datos.correo)
        .input("encargado", sql.VarChar, datos.encargado)
        .input("estatus_empresa", sql.VarChar, datos.estatus_empresa)
        .input("fecha_actualizacion", sql.Date, fechaActualizacion).query(`
          UPDATE ${this.tabla}
          SET 
            nombre = @nombre,
            documento = @documento,
            giro = @giro,
            direccion = @direccion,
            telefono = @telefono,
            correo = @correo,
            encargado = @encargado,
            estatus_empresa = @estatus_empresa,
            fecha_actualizacion = @fecha_actualizacion
          WHERE id_empresa = @id_empresa AND eliminado = 0
        `);
    } catch (error) {
      console.error("Error en EmpresaRepository.update:", error);
      throw error;
    }
  }

  // Actualizar el estatus de una Empresa (Activo/Inactivo)
  async actualizarEstatus(id_empresa, estatus_empresa) {
    try {
      const pool = await poolPromise;
      await pool
        .request()
        .input("id_empresa", sql.Int, id_empresa)
        .input("estatus_empresa", sql.VarChar, estatus_empresa)
        .input("fecha_actualizacion", sql.Date, new Date()).query(`
          UPDATE ${this.tabla}
          SET 
            estatus_empresa = @estatus_empresa,
            fecha_actualizacion = @fecha_actualizacion
          WHERE id_empresa = @id_empresa AND eliminado = 0
        `);
    } catch (error) {
      console.error("Error en EmpresaRepository.actualizarEstatus:", error);
      throw error;
    }
  }

  // Marcar una Empresa como eliminada (eliminado = 1)
  async softDelete(id_empresa) {
    try {
      const pool = await poolPromise;
      await pool
        .request()
        .input("id_empresa", sql.Int, id_empresa)
        .input("eliminado", sql.Int, 1)
        .input("fecha_actualizacion", sql.Date, new Date()).query(`
          UPDATE ${this.tabla}
          SET 
            eliminado = @eliminado,
            fecha_actualizacion = @fecha_actualizacion
          WHERE id_empresa = @id_empresa AND eliminado = 0
        `);
    } catch (error) {
      console.error("Error en EmpresaRepository.softDelete:", error);
      throw error;
    }
  }
}

export default EmpresaRepository;
