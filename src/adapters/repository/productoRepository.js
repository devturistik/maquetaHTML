import { sql, poolPromise } from "../../config/database.js";

class ProductoRepository {
  constructor() {
    this.tabla = "oc.Producto"; // Esquema y tabla
  }

  // Obtener todos los Productos
  async getAll() {
    try {
      const pool = await poolPromise;
      const result = await pool.request().query(`
          SELECT 
            id_producto, 
            descripcion, 
            unidad, 
            presentacion, 
            estatus_producto, 
            fecha_creacion, 
            fecha_actualizacion 
          FROM ${this.tabla}
        `);
      return result.recordset;
    } catch (error) {
      console.error("Error en ProductoRepository.getAll:", error);
      throw error;
    }
  }

  // Obtener un Producto por su ID
  async getById(id_producto) {
    try {
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("id_producto", sql.Int, id_producto).query(`
          SELECT 
            id_producto, 
            descripcion, 
            unidad, 
            presentacion, 
            estatus_producto, 
            fecha_creacion, 
            fecha_actualizacion 
          FROM ${this.tabla}
          WHERE id_producto = @id_producto
        `);
      return result.recordset[0];
    } catch (error) {
      console.error("Error en ProductoRepository.getById:", error);
      throw error;
    }
  }

  // Crear un nuevo Producto
  async create(datos) {
    try {
      const pool = await poolPromise;
      await pool
        .request()
        .input("descripcion", sql.VarChar, datos.descripcion)
        .input("unidad", sql.VarChar, datos.unidad)
        .input("presentacion", sql.VarChar, datos.presentacion)
        .input("estatus_producto", sql.Bit, datos.estatus_producto)
        .input("fecha_creacion", sql.Date, datos.fecha_creacion)
        .input("fecha_actualizacion", sql.Date, datos.fecha_actualizacion)
        .query(`
          INSERT INTO ${this.tabla} 
            (descripcion, unidad, presentacion, estatus_producto, fecha_creacion, fecha_actualizacion)
          VALUES 
            (@descripcion, @unidad, @presentacion, @estatus_producto, @fecha_creacion, @fecha_actualizacion)
        `);
    } catch (error) {
      console.error("Error en ProductoRepository.create:", error);
      throw error;
    }
  }

  // Actualizar un Producto existente
  async update(id_producto, datos) {
    try {
      const pool = await poolPromise;
      await pool
        .request()
        .input("id_producto", sql.Int, id_producto)
        .input("descripcion", sql.VarChar, datos.descripcion)
        .input("unidad", sql.VarChar, datos.unidad)
        .input("presentacion", sql.VarChar, datos.presentacion)
        .input("estatus_producto", sql.Bit, datos.estatus_producto)
        .input("fecha_actualizacion", sql.Date, datos.fecha_actualizacion)
        .query(`
          UPDATE ${this.tabla}
          SET 
            descripcion = @descripcion,
            unidad = @unidad,
            presentacion = @presentacion,
            estatus_producto = @estatus_producto,
            fecha_actualizacion = @fecha_actualizacion
          WHERE id_producto = @id_producto
        `);
    } catch (error) {
      console.error("Error en ProductoRepository.update:", error);
      throw error;
    }
  }

  // Actualizar el estatus de un Producto (0 o 1)
  async actualizarEstatus(id_producto, estatus_producto) {
    try {
      const pool = await poolPromise;
      await pool
        .request()
        .input("id_producto", sql.Int, id_producto)
        .input("estatus_producto", sql.Bit, estatus_producto)
        .input("fecha_actualizacion", sql.Date, new Date()).query(`
          UPDATE ${this.tabla}
          SET 
            estatus_producto = @estatus_producto,
            fecha_actualizacion = @fecha_actualizacion
          WHERE id_producto = @id_producto
        `);
    } catch (error) {
      console.error("Error en ProductoRepository.actualizarEstatus:", error);
      throw error;
    }
  }
}

export default ProductoRepository;
