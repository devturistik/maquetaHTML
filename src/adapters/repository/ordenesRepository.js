// src/adapters/repository/ordenesRepository.js
import sql from "mssql";
import config from "../../config/database.js";

class OrdenesRepository {
  async getAll() {
    try {
      const pool = await sql.connect(config);
      const result = await pool.request().query(`
        SELECT
          id_orden, codigo, subtotal,total, impuesto, retencion,usuario_creador, correo_creador, nota_creador, ruta_archivo_pdf, documentos_cotizacion, nivel_aprobacion, justificacion_rechazo, total_local
        FROM oc.OrdenCompra
        `);
      return result.recordset;
    } catch (error) {
      console.error(
        "Error al obtener ordenes de la base de datos:",
        error.message
      );
      throw new Error("Error al obtener ordenes");
    }
  }

  async getById(id) {
    try {
      const pool = await sql.connect(config);
      const result = await pool
        .request()
        .input("id_orden", sql.Int, id)
        .query(`SELECT * FROM oc.OrdenCompra WHERE id_orden = @id_orden`);
      return result.recordset[0];
    } catch (error) {
      console.error("Error al obtener orden:", error.message);
      throw new Error("Error al obtener la orden de compra.");
    }
  }

  async saveOrden(orden) {
    try {
      const pool = await sql.connect(config);
      const result = await pool
        .request()
        .input("codigo", sql.NVarChar, orden.codigo)
        .input("subtotal", sql.Decimal(10, 2), orden.subtotal)
        .input("total", sql.Decimal(10, 2), orden.total)
        .input("impuesto", sql.Decimal(10, 2), orden.impuesto)
        .input("retencion", sql.Decimal(10, 2), orden.retencion)
        .input("usuario_creador", sql.NVarChar, orden.usuario_creador)
        .input("correo_creador", sql.NVarChar, orden.correo_creador)
        .input("nota_creador", sql.NVarChar, orden.nota_creador)
        .input("ruta_archivo_pdf", sql.NVarChar, orden.ruta_archivo_pdf)
        .input(
          "documentos_cotizacion",
          sql.NVarChar,
          orden.documentos_cotizacion
        )
        .input("nivel_aprobacion", sql.TinyInt, orden.nivel_aprobacion)
        .input(
          "justificacion_rechazo",
          sql.NVarChar,
          orden.justificacion_rechazo
        )
        .input("total_local", sql.Decimal(10, 2), orden.total_local)
        .input("id_moneda", sql.Int, orden.id_moneda)
        .input("id_solicitud", sql.Int, orden.id_solicitud)
        .input("id_proveedor", sql.Int, orden.id_proveedor)
        .input("id_tipo_orden", sql.Int, orden.id_tipo_orden)
        .input("id_plazo", sql.Int, orden.id_plazo)
        .input("creado_por", sql.NVarChar, orden.creado_por).query(`
          INSERT INTO oc.OrdenCompra
            (codigo, subtotal, total, impuesto, retencion, usuario_creador, correo_creador, nota_creador, ruta_archivo_pdf, documentos_cotizacion, nivel_aprobacion, justificacion_rechazo, total_local, id_moneda, id_solicitud, id_proveedor, id_tipo_orden, id_plazo, creado_por)
          VALUES
            (@codigo, @subtotal, @total, @impuesto, @retencion, @usuario_creador, @correo_creador, @nota_creador, @ruta_archivo_pdf, @documentos_cotizacion, @nivel_aprobacion, @justificacion_rechazo, @total_local, @id_moneda, @id_solicitud, @id_proveedor, @id_tipo_orden, @id_plazo, @creado_por)
        `);
      return result.recordset;
    } catch (error) {
      console.error("Error al guardar orden:", error.message);
      throw new Error("Error al guardar orden");
    }
  }

  async updateOrden(id, updatedFields) {
    try {
      const pool = await sql.connect(config);
      const result = await pool
        .request()
        .input("id_orden", sql.Int, id)
        .input("subtotal", sql.Decimal(10, 2), updatedFields.subtotal)
        .input("total", sql.Decimal(10, 2), updatedFields.total)
        .input("impuesto", sql.Decimal(10, 2), updatedFields.impuesto)
        .input("retencion", sql.Decimal(10, 2), updatedFields.retencion)
        .input("usuario_creador", sql.NVarChar, updatedFields.usuario_creador)
        .input("correo_creador", sql.NVarChar, updatedFields.correo_creador)
        .input("nota_creador", sql.NVarChar, updatedFields.nota_creador)
        .input("ruta_archivo_pdf", sql.NVarChar, updatedFields.ruta_archivo_pdf)
        .input(
          "documentos_cotizacion",
          sql.NVarChar,
          updatedFields.documentos_cotizacion
        )
        .input("nivel_aprobacion", sql.TinyInt, updatedFields.nivel_aprobacion)
        .input(
          "justificacion_rechazo",
          sql.NVarChar,
          updatedFields.justificacion_rechazo
        )
        .input("total_local", sql.Decimal(10, 2), updatedFields.total_local)
        .input("id_moneda", sql.Int, updatedFields.id_moneda)
        .input("id_solicitud", sql.Int, updatedFields.id_solicitud)
        .input("id_proveedor", sql.Int, updatedFields.id_proveedor)
        .input("id_tipo_orden", sql.Int, updatedFields.id_tipo_orden).query(`
          UPDATE oc.OrdenCompra
          SET
            subtotal = @subtotal,
            total = @total,
            impuesto = @impuesto,
            retencion = @retencion,
            usuario_creador = @usuario_creador,
            correo_creador = @correo_creador,
            nota_creador = @nota_creador,
            ruta_archivo_pdf = @ruta_archivo_pdf,
            documentos_cotizacion = @documentos_cotizacion,
            nivel_aprobacion = @nivel_aprobacion,
            justificacion_rechazo = @justificacion_rechazo,
            total_local = @total_local,
            id_moneda = @id_moneda,
            id_solicitud = @id_solicitud,
            id_proveedor = @id_proveedor,
            id_tipo_orden = @id_tipo_orden,
            updated_at = GETDATE()
          WHERE id = @id
        `);
      return result.rowsAffected[0];
    } catch (error) {
      console.error("Error al actualizar orden:", error.message);
      throw new Error("Error al actualizar orden");
    }
  }

  async deleteOrden(id) {
    try {
      const pool = await sql.connect(config);
      const result = await pool
        .request()
        .input("id", sql.Int, id)
        .query(`DELETE FROM oc.OrdenCompra WHERE id = @id`);
      return result.rowsAffected[0];
    } catch (error) {
      console.error("Error al eliminar orden:", error.message);
      throw new Error("Error al eliminar orden");
    }
  }

  async getProveedores() {
    try {
      const pool = await sql.connect(config);
      const result = await pool.request().query(`
        SELECT id_proveedor, nombre FROM oc.Proveedor WHERE eliminado = 0 AND estatus = 1
      `);
      return result.recordset;
    } catch (error) {
      console.error("Error al obtener proveedores:", error.message);
      throw new Error("Error al obtener proveedores");
    }
  }

  async getBancos() {
    try {
      const pool = await sql.connect(config);
      const result = await pool.request().query(`
        SELECT id_banco, nombre_banco FROM oc.Banco WHERE eliminado = 0
      `);
      return result.recordset;
    } catch (error) {
      console.error("Error al obtener bancos:", error.message);
      throw new Error("Error al obtener bancos");
    }
  }

  async getPlazoPagos() {
    try {
      const pool = await sql.connect(config);
      const result = await pool.request().query(`
        SELECT id_plazo, descripcion, dias FROM oc.PlazoPago
      `);
      return result.recordset;
    } catch (error) {
      console.error("Error al obtener plazos de pago:", error.message);
      throw new Error("Error al obtener plazos de pago");
    }
  }

  async getEmpresas() {
    try {
      const pool = await sql.connect(config);
      const result = await pool.request().query(`
        SELECT id_empresa, nombre FROM oc.Empresa WHERE eliminado = 0
      `);
      return result.recordset;
    } catch (error) {
      console.error("Error al obtener empresas:", error.message);
      throw new Error("Error al obtener empresas");
    }
  }

  async getTipoOrdenes() {
    try {
      const pool = await sql.connect(config);
      const result = await pool.request().query(`
        SELECT id_tipo, tipo FROM oc.TipoOrden
      `);
      return result.recordset;
    } catch (error) {
      console.error("Error al obtener tipos de orden:", error.message);
      throw new Error("Error al obtener tipos de orden");
    }
  }

  async getMonedas() {
    try {
      const pool = await sql.connect(config);
      const result = await pool.request().query(`
        SELECT id_moneda, codigo_moneda, nombre_moneda, simbolo FROM oc.Moneda WHERE estatus = 1
      `);
      return result.recordset;
    } catch (error) {
      console.error("Error al obtener monedas:", error.message);
      throw new Error("Error al obtener monedas");
    }
  }

  async getCategorias() {
    try {
      const pool = await sql.connect(config);
      const result = await pool.request().query(`
        SELECT id_categoria, nombre_categoria FROM oc.CategoriaProducto
      `);
      return result.recordset;
    } catch (error) {
      console.error("Error al obtener categorías:", error.message);
      throw new Error("Error al obtener categorías");
    }
  }

  async getProductos() {
    try {
      const pool = await sql.connect(config);
      const result = await pool.request().query(`
        SELECT id_producto, nombre FROM oc.Producto
      `);
      return result.recordset;
    } catch (error) {
      console.error("Error al obtener productos:", error.message);
      throw new Error("Error al obtener productos");
    }
  }
}

export default OrdenesRepository;
