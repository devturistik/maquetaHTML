import { sql, poolPromise } from "../../config/database.js";

class ProveedorRepository {
  constructor() {
    this.tabla = "oc.Proveedor"; // Esquema y tabla
  }

  // Obtener todos los Proveedores no eliminados
  async getAll() {
    try {
      const pool = await poolPromise;
      const result = await pool.request().query(`
          SELECT 
            id_proveedor, 
            nombre_proveedor, 
            documento_proveedor, 
            telefono_principal, 
            correo_principal, 
            estatus_proveedor, 
            fecha_creacion, 
            fecha_actualizacion 
          FROM ${this.tabla}
          WHERE eliminado = 0
        `);
      return result.recordset;
    } catch (error) {
      console.error("Error en ProveedorRepository.getAll:", error);
      throw error;
    }
  }

  // Obtener un Proveedor por su ID (si no está eliminado)
  async getById(id_proveedor) {
    try {
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("id_proveedor", sql.Int, id_proveedor).query(`
          SELECT 
            id_proveedor, 
            nombre_proveedor, 
            documento_proveedor, 
            telefono_principal, 
            correo_principal, 
            estatus_proveedor, 
            fecha_creacion, 
            fecha_actualizacion 
          FROM ${this.tabla}
          WHERE id_proveedor = @id_proveedor AND eliminado = 0
        `);
      return result.recordset[0];
    } catch (error) {
      console.error("Error en ProveedorRepository.getById:", error);
      throw error;
    }
  }

  // Crear un nuevo Proveedor
  async create(datos) {
    try {
      const pool = await poolPromise;
      await pool
        .request()
        .input("nombre_proveedor", sql.VarChar, datos.nombre_proveedor)
        .input("documento_proveedor", sql.VarChar, datos.documento_proveedor)
        .input("telefono_principal", sql.VarChar, datos.telefono_principal)
        .input("correo_principal", sql.VarChar, datos.correo_principal)
        .input("estatus_proveedor", sql.VarChar, datos.estatus_proveedor)
        .input("fecha_creacion", sql.Date, datos.fecha_creacion)
        .input("fecha_actualizacion", sql.Date, datos.fecha_actualizacion)
        .input("eliminado", sql.Int, datos.eliminado).query(`
          INSERT INTO ${this.tabla} 
            (nombre_proveedor, documento_proveedor, telefono_principal, correo_principal, estatus_proveedor, fecha_creacion, fecha_actualizacion, eliminado)
          VALUES 
            (@nombre_proveedor, @documento_proveedor, @telefono_principal, @correo_principal, @estatus_proveedor, @fecha_creacion, @fecha_actualizacion, @eliminado)
        `);
    } catch (error) {
      console.error("Error en ProveedorRepository.create:", error);
      throw error;
    }
  }

  // Actualizar un Proveedor existente
  async update(id_proveedor, datos) {
    try {
      const pool = await poolPromise;
      await pool
        .request()
        .input("id_proveedor", sql.Int, id_proveedor)
        .input("nombre_proveedor", sql.VarChar, datos.nombre_proveedor)
        .input("documento_proveedor", sql.VarChar, datos.documento_proveedor)
        .input("telefono_principal", sql.VarChar, datos.telefono_principal)
        .input("correo_principal", sql.VarChar, datos.correo_principal)
        .input("estatus_proveedor", sql.VarChar, datos.estatus_proveedor)
        .input("fecha_actualizacion", sql.Date, datos.fecha_actualizacion)
        .query(`
          UPDATE ${this.tabla}
          SET 
            nombre_proveedor = @nombre_proveedor,
            documento_proveedor = @documento_proveedor,
            telefono_principal = @telefono_principal,
            correo_principal = @correo_principal,
            estatus_proveedor = @estatus_proveedor,
            fecha_actualizacion = @fecha_actualizacion
          WHERE id_proveedor = @id_proveedor AND eliminado = 0
        `);
    } catch (error) {
      console.error("Error en ProveedorRepository.update:", error);
      throw error;
    }
  }

  // Actualizar el estatus de un Proveedor (Activo/Inactivo)
  async actualizarEstatus(id_proveedor, estatus_proveedor) {
    try {
      const pool = await poolPromise;
      await pool
        .request()
        .input("id_proveedor", sql.Int, id_proveedor)
        .input("estatus_proveedor", sql.VarChar, estatus_proveedor)
        .input("fecha_actualizacion", sql.Date, new Date()).query(`
          UPDATE ${this.tabla}
          SET 
            estatus_proveedor = @estatus_proveedor,
            fecha_actualizacion = @fecha_actualizacion
          WHERE id_proveedor = @id_proveedor AND eliminado = 0
        `);
    } catch (error) {
      console.error("Error en ProveedorRepository.actualizarEstatus:", error);
      throw error;
    }
  }

  // Eliminar (soft delete) un Proveedor
  async eliminar(id_proveedor) {
    try {
      const pool = await poolPromise;
      await pool.request().input("id_proveedor", sql.Int, id_proveedor).query(`
          UPDATE ${this.tabla}
          SET 
            eliminado = 1,
            fecha_actualizacion = @fecha_actualizacion
          WHERE id_proveedor = @id_proveedor AND eliminado = 0
        `);
    } catch (error) {
      console.error("Error en ProveedorRepository.eliminar:", error);
      throw error;
    }
  }
}

export default ProveedorRepository;
