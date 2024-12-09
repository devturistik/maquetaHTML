import { sql, poolPromise } from "../../config/database.js";

class TipoOrdenRepository {
  constructor() {
    this.tablaTipoOrden = "oc.TipoOrden";
    this.tablaDetalleTipoOrden = "oc.DetalleTipoOrden";
  }

  async obtenerPorId(id) {
    try {
      const pool = await poolPromise;
      const result = await pool.request().input("id_tipo", sql.Int, id).query(`
          SELECT id_tipo, nombre, estatus_tipo_orden, created_at, updated_at
          FROM ${this.tablaTipoOrden}
          WHERE id_tipo = @id_tipo
        `);

      return result.recordset.length > 0 ? result.recordset[0] : null;
    } catch (error) {
      console.error("Error al obtener el Tipo de Orden por ID:", error);
      throw error;
    }
  }

  // Crear un nuevo Tipo de Orden
  async crearTipoOrden(datos) {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("nombre", sql.NVarChar, datos.nombre)
      .input("estatus_tipo_orden", sql.Bit, datos.estatus_tipo_orden)
      .input("created_at", sql.DateTime, datos.created_at)
      .input("creado_por", sql.NVarChar, datos.creado_por).query(`
        INSERT INTO ${this.tablaTipoOrden} (nombre, estatus_tipo_orden, created_at, creado_por)
        OUTPUT INSERTED.id_tipo
        VALUES (@nombre, @estatus_tipo_orden, @created_at, @creado_por)
      `);
    return result.recordset[0].id_tipo;
  }

  // Crear un detalle para un Tipo de Orden
  async crearDetalleTipoOrden(id_tipo_orden, detalle) {
    const pool = await poolPromise;
    await pool
      .request()
      .input("id_tipo_orden", sql.Int, id_tipo_orden)
      .input("nombre_detalle", sql.NVarChar, detalle.nombre_detalle)
      .input("cantidad", sql.Decimal, detalle.cantidad)
      .input("tipo_detalle", sql.NVarChar, detalle.tipo_detalle)
      .input("activo", sql.Int, detalle.activo).query(`
        INSERT INTO ${this.tablaDetalleTipoOrden} (id_tipo_orden, nombre_detalle, cantidad, tipo_detalle, activo)
        VALUES (@id_tipo_orden, @nombre_detalle, @cantidad, @tipo_detalle, @activo)
      `);
  }

  // Obtener todos los Tipos de Orden
  async obtenerTiposOrden() {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT id_tipo, nombre, creado_por, estatus_tipo_orden, created_at FROM ${this.tablaTipoOrden}
    `);
    return result.recordset;
  }

  // Obtener detalles asociados a un Tipo de Orden
  async obtenerDetallesPorTipoOrden(id_tipo) {
    try {
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("id_tipo_orden", sql.Int, id_tipo).query(`
          SELECT id_detalle_tipo_orden, id_tipo_orden, nombre_detalle, tipo_detalle, cantidad, activo
          FROM ${this.tablaDetalleTipoOrden}
          WHERE id_tipo_orden = @id_tipo_orden AND activo = 1
        `);

      return result.recordset;
    } catch (error) {
      console.error("Error al obtener los detalles del Tipo de Orden:", error);
      throw error;
    }
  }

  async actualizarTipoOrden(id, datos) {
    try {
      const pool = await poolPromise;
      await pool
        .request()
        .input("id_tipo", sql.Int, id)
        .input("nombre", sql.NVarChar, datos.nombre)
        .input("estatus_tipo_orden", sql.Bit, datos.estatus_tipo_orden)
        .input("updated_at", sql.DateTime, new Date()).query(`
          UPDATE ${this.tablaTipoOrden}
          SET nombre = @nombre,
              estatus_tipo_orden = @estatus_tipo_orden,
              updated_at = @updated_at
          WHERE id_tipo = @id_tipo
        `);
    } catch (error) {
      console.error("Error al actualizar el Tipo de Orden:", error);
      throw error;
    }
  }

  async actualizarDetallesTipoOrden(id_tipo, detalles) {
    try {
      const pool = await poolPromise;

      await pool.request().input("id_tipo_orden", sql.Int, id_tipo).query(`
          UPDATE ${this.tablaDetalleTipoOrden}
          SET activo = 0
          WHERE id_tipo_orden = @id_tipo_orden
        `);

      for (const detalle of detalles) {
        await pool
          .request()
          .input("id_tipo_orden", sql.Int, id_tipo)
          .input("nombre_detalle", sql.NVarChar, detalle.nombre_detalle)
          .input("tipo_detalle", sql.NVarChar, detalle.tipo_detalle)
          .input("cantidad", sql.Decimal, detalle.cantidad)
          .input("activo", sql.Int, 1).query(`
            INSERT INTO ${this.tablaDetalleTipoOrden} 
              (id_tipo_orden, nombre_detalle, tipo_detalle, cantidad, activo)
            VALUES 
              (@id_tipo_orden, @nombre_detalle, @tipo_detalle, @cantidad, @activo)
          `);
      }
    } catch (error) {
      console.error(
        "Error al actualizar los detalles del Tipo de Orden:",
        error
      );
      throw error;
    }
  }
}

export default TipoOrdenRepository;
