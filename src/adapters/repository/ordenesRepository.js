import sql from "mssql";
import config from "../../config/database.js";

class OrdenesRepository {
  async getAll() {
    try {
      const pool = await sql.connect(config);
      const result = await pool.request().query(`
        SELECT
          id_orden, codigo, subtotal, total, impuesto, retencion, usuario_creador, correo_creador, nota_creador,
          ruta_archivo_pdf, documentos_cotizacion, nivel_aprobacion, justificacion_rechazo, total_local,
          id_moneda, id_solicitud, id_proveedor, id_tipo_orden, id_plazo, creado_por, fecha_vencimiento
        FROM oc.OrdenCompra
      `);
      return result.recordset;
    } catch (error) {
      console.error(
        "Error al obtener órdenes de la base de datos:",
        error.message
      );
      throw new Error("Error al obtener órdenes");
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
        .input("subtotal", sql.Decimal(18, 2), orden.subtotal)
        .input("total", sql.Decimal(18, 2), orden.total)
        .input("impuesto", sql.Decimal(18, 2), orden.impuesto)
        .input("retencion", sql.Decimal(18, 2), orden.retencion)
        .input("nota_creador", sql.NVarChar, orden.nota_creador)
        .input(
          "documentos_cotizacion",
          sql.NVarChar,
          orden.documentos_cotizacion
        )
        .input("usuario_creador", sql.NVarChar, orden.usuario_creador)
        .input("correo_creador", sql.NVarChar, orden.correo_creador)
        .input("id_moneda", sql.Int, orden.id_moneda)
        .input("id_solicitud", sql.Int, orden.id_solicitud)
        .input("id_proveedor", sql.Int, orden.id_proveedor)
        .input("id_tipo_orden", sql.Int, orden.id_tipo_orden)
        .input("id_plazo", sql.Int, orden.id_plazo)
        .input("nivel_aprobacion", sql.TinyInt, orden.nivel_aprobacion)
        .input(
          "justificacion_rechazo",
          sql.NVarChar,
          orden.justificacion_rechazo
        )
        .input("ruta_archivo_pdf", sql.NVarChar, orden.ruta_archivo_pdf)
        .input("total_local", sql.Decimal(18, 2), orden.total_local)
        .input("creado_por", sql.NVarChar, orden.creado_por)
        .input("fecha_vencimiento", sql.Date, orden.fecha_vencimiento).query(`
          INSERT INTO oc.OrdenCompra 
            (codigo, subtotal, total, impuesto, retencion, nota_creador, documentos_cotizacion, usuario_creador,
             correo_creador, id_moneda, id_solicitud, id_proveedor, id_tipo_orden, id_plazo, nivel_aprobacion,
             justificacion_rechazo, ruta_archivo_pdf, total_local, creado_por, fecha_vencimiento, created_at)
          VALUES
            (@codigo, @subtotal, @total, @impuesto, @retencion, @nota_creador, @documentos_cotizacion, @usuario_creador,
             @correo_creador, @id_moneda, @id_solicitud, @id_proveedor, @id_tipo_orden, @id_plazo, @nivel_aprobacion,
             @justificacion_rechazo, @ruta_archivo_pdf, @total_local, @creado_por, @fecha_vencimiento, GETDATE())
          SELECT SCOPE_IDENTITY() AS id_orden
        `);
      return result.recordset[0];
    } catch (error) {
      console.error("Error en OrdenesRepository.saveOrden:", error.message);
      throw new Error("Error al guardar la orden de compra.");
    }
  }

  async saveDetalleOrdenCompra(detalleOrdenCompra) {
    try {
      const pool = await sql.connect(config);
      await pool
        .request()
        .input("id_solicitud", sql.Int, detalleOrdenCompra.id_solicitud)
        .input("id_orden_compra", sql.Int, detalleOrdenCompra.id_orden_compra)
        .input("id_producto", sql.Int, detalleOrdenCompra.id_producto)
        .input(
          "precio_unitario",
          sql.Decimal(18, 2),
          detalleOrdenCompra.precio_unitario
        )
        .input("cantidad", sql.Int, detalleOrdenCompra.cantidad)
        .input(
          "total_detalle",
          sql.Decimal(18, 2),
          detalleOrdenCompra.total_detalle
        )
        .input("cant_x_recibir", sql.Int, detalleOrdenCompra.cant_x_recibir)
        .query(`
          INSERT INTO oc.DetalleOrdenCompra 
            (ID_SOLICITUD, ID_ORDEN_COMPRA, ID_PRODUCTO, PRECIO, CANTIDAD, FECHA_CREACION, FECHA_ACTUALIZACION,
             TOTAL_DETALLE, CANT_X_RECIBIR)
          VALUES
            (@id_solicitud, @id_orden_compra, @id_producto, @precio_unitario, @cantidad, GETDATE(), GETDATE(),
             @total_detalle, @cant_x_recibir)
        `);
    } catch (error) {
      console.error("Error al guardar detalle de orden:", error.message);
      throw new Error("Error al guardar detalle de orden");
    }
  }

  async updateOrden(id_orden, updatedFields) {
    try {
      const pool = await sql.connect(config);
      const request = pool.request();
      request.input("id_orden", sql.Int, id_orden);

      Object.keys(updatedFields).forEach((key) => {
        if (key !== "id") {
          if (typeof updatedFields[key] === "number") {
            request.input(key, sql.Decimal(18, 2), updatedFields[key]);
          } else {
            request.input(key, sql.NVarChar, updatedFields[key]);
          }
        }
      });

      const result = await request.query(`
        UPDATE oc.OrdenCompra
        SET
          subtotal = @subtotal,
          total = @total,
          impuesto = @impuesto,
          retencion = @retencion,
          usuario_creador = @usuario_creador,
          correo_creador = @correo_creador,
          nota_creador = @nota_creador,
          documentos_cotizacion = @documentos_cotizacion,
          nivel_aprobacion = @nivel_aprobacion,
          justificacion_rechazo = @justificacion_rechazo,
          ruta_archivo_pdf = @ruta_archivo_pdf,
          total_local = @total_local,
          id_moneda = @id_moneda,
          id_solicitud = @id_solicitud,
          id_proveedor = @id_proveedor,
          id_tipo_orden = @id_tipo_orden,
          id_plazo = @id_plazo,
          actualizado_por = @creado_por,
          updated_at = GETDATE()
        WHERE id_orden = @id_orden
      `);
      return result.rowsAffected[0];
    } catch (error) {
      console.error("Error al actualizar orden:", error.message);
      throw new Error("Error al actualizar orden");
    }
  }

  async deleteOrden(id_orden) {
    try {
      const pool = await sql.connect(config);
      const result = await pool
        .request()
        .input("id_orden", sql.Int, id_orden)
        .query(`DELETE FROM oc.OrdenCompra WHERE id_orden = @id_orden`);
      return result.rowsAffected[0];
    } catch (error) {
      console.error("Error al eliminar orden:", error.message);
      throw new Error("Error al eliminar orden");
    }
  }

  async getUltimaOrdenCreada() {
    try {
      const pool = await sql.connect(config);
      const result = await pool.request().query(`
        SELECT TOP 1 id_orden
        FROM oc.OrdenCompra
        ORDER BY id_orden DESC
      `);
      return result.recordset[0];
    } catch (error) {
      console.error("Error al obtener la última orden creada:", error.message);
      throw new Error("Error al obtener la última orden creada");
    }
  }

  async getProveedores() {
    try {
      const pool = await sql.connect(config);
      const result = await pool.request().query(`
        SELECT
          ID_PROVEEDOR, NOMBRE_PROVEEDOR, DOCUMENTO_PROVEEDOR, TELEFONO_PRINCIAL, CORREO_PRINCIPAL
        FROM
          oc.Proveedor
        WHERE
          ESTATUS_PROVEEDOR = 1 AND ELIMINADO = 0
      `);
      return result.recordset;
    } catch (error) {
      console.error(
        "Error en OrdenesRepository.getProveedores:",
        error.message
      );
      throw new Error("Error al obtener proveedores.");
    }
  }

  async getProveedorById(id_proveedor) {
    try {
      const pool = await sql.connect(config);
      const result = await pool
        .request()
        .input("id_proveedor", sql.Int, id_proveedor).query(`
          SELECT *
          FROM oc.Proveedor
          WHERE ID_PROVEEDOR = @id_proveedor
            AND ELIMINADO = 0
        `);
      return result.recordset[0];
    } catch (error) {
      console.error("Error al obtener proveedor por ID:", error.message);
      throw new Error("Error al obtener proveedor por ID");
    }
  }

  async getBancosByProveedor(id_proveedor) {
    try {
      const pool = await sql.connect(config);
      const result = await pool.request().query(`
        SELECT b.ID_BANCO, b.NOMBRE_BANCO
        FROM oc.ProveedorBanco pb
        JOIN oc.Banco b ON pb.ID_BANCO = b.ID_BANCO
        WHERE pb.ID_PROVEEDOR = ${id_proveedor}
          AND pb.ELIMINADO = 0
          AND b.ELIMINADO = 0
      `);
      return result.recordset;
    } catch (error) {
      console.error("Error al obtener bancos por proveedor:", error.message);
      throw new Error("Error al obtener bancos por proveedor");
    }
  }

  async getBancoById(id_banco) {
    try {
      const pool = await sql.connect(config);
      const result = await pool.request().input("id_banco", sql.Int, id_banco)
        .query(`
          SELECT *
          FROM oc.Banco
          WHERE ID_BANCO = @id_banco
            AND ELIMINADO = 0
        `);
      return result.recordset[0];
    } catch (error) {
      console.error("Error al obtener banco por ID:", error.message);
      throw new Error("Error al obtener banco por ID");
    }
  }

  async getPlazoPagos() {
    try {
      const pool = await sql.connect(config);
      const result = await pool.request().query(`
        SELECT
          ID_FORMA_PAGO, NOMBRE
        FROM
          oc.PlazoPago
        WHERE
          ELIMINADO = 0
          AND ESTATUS_FORMA_PAGO = 1
      `);
      return result.recordset;
    } catch (error) {
      console.error("Error en OrdenesRepository.getPlazoPagos:", error.message);
      throw new Error("Error al obtener plazos de pago.");
    }
  }

  async getMonedaById(id_moneda) {
    try {
      const pool = await sql.connect(config);
      const result = await pool.request().input("id_moneda", sql.Int, id_moneda)
        .query(`
          SELECT ID_MONEDA, ABREV, NOMBRE, CAMBIO
          FROM oc.Monedas
          WHERE ID_MONEDA = @id_moneda
        `);
      return result.recordset[0];
    } catch (error) {
      console.error("Error al obtener moneda por ID:", error.message);
      throw new Error("Error al obtener moneda");
    }
  }

  async getMonedas() {
    try {
      const pool = await sql.connect(config);
      const result = await pool.request().query(`
        SELECT
          ID_MONEDA, ABREV, NOMBRE, CAMBIO
        FROM
          oc.Monedas
      `);
      return result.recordset;
    } catch (error) {
      console.error("Error en OrdenesRepository.getMonedas:", error.message);
      throw new Error("Error al obtener monedas.");
    }
  }

  async getEmpresas() {
    try {
      const pool = await sql.connect(config);
      const result = await pool.request().query(`
        SELECT
          ID_EMPRESA, NOMBRE
        FROM
          oc.Empresa
        WHERE
          ELIMINADO = 0
      `);
      return result.recordset;
    } catch (error) {
      console.error("Error en OrdenesRepository.getEmpresas:", error.message);
      throw new Error("Error al obtener empresas.");
    }
  }

  async getCentroCostos() {
    try {
      const pool = await sql.connect(config);
      const result = await pool.request().query(`
        SELECT
          ID_CENTRO_COSTO, NOMBRE, ENCARGADO
        FROM
          oc.CentroCosto
        WHERE
          ESTATUS_FORMA_PAGO = 1
      `);
      return result.recordset;
    } catch (error) {
      console.error(
        "Error en OrdenesRepository.getCentroCostos:",
        error.message
      );
      throw new Error("Error al obtener centros de costo.");
    }
  }

  async getTipoOrdenes() {
    try {
      const pool = await sql.connect(config);
      const result = await pool.request().query(`
        SELECT
          id_tipo, nombre
        FROM
          oc.TipoOrden
      `);
      return result.recordset;
    } catch (error) {
      console.error(
        "Error en OrdenesRepository.getTipoOrdenes:",
        error.message
      );
      throw new Error("Error al obtener tipos de orden.");
    }
  }

  async getDetalleTipoOrden() {
    try {
      const pool = await sql.connect(config);
      const result = await pool.request().query(`
        SELECT 
          dto.id_detalle_tipo_orden,
          dto.id_tipo_orden,
          dto.nombre_detalle,
          dto.cantidad,
          dto.tipo_detalle,
          dto.activo
        FROM 
          oc.DetalleTipoOrden dto
        WHERE 
          dto.activo = 1
      `);
      return result.recordset;
    } catch (error) {
      console.error(
        "Error en OrdenesRepository.getDetalleTipoOrden:",
        error.message
      );
      throw new Error("Error al obtener detalles de tipo de orden.");
    }
  }

  async getProductos() {
    try {
      const pool = await sql.connect(config);
      const result = await pool.request().query(`
        SELECT
          ID_PRODUCTO, DESCRIPCION, UNIDAD, PRESENTACION, ESTATUS_PRODUCTO, FECHA_CREACION, FECHA_ACTUALIZACION
        FROM
          oc.Producto
        WHERE
          ELIMINADO = 0
      `);
      return result.recordset;
    } catch (error) {
      console.error("Error en OrdenesRepository.getProductos:", error.message);
      throw new Error("Error al obtener productos.");
    }
  }

  async getProductoById(id_producto) {
    try {
      const pool = await sql.connect(config);
      const result = await pool
        .request()
        .input("id_producto", sql.Int, id_producto).query(`
          SELECT
            ID_PRODUCTO,
            DESCRIPCION,
            UNIDAD,
            PRESENTACION,
            ESTATUS_PRODUCTO,
            FECHA_CREACION,
            FECHA_ACTUALIZACION
          FROM
            oc.Producto
          WHERE
            ID_PRODUCTO = @id_producto
            AND ELIMINADO = 0
        `);
      return result.recordset[0];
    } catch (error) {
      console.error(
        "Error en OrdenesRepository.getProductoById:",
        error.message
      );
      throw new Error("Error al obtener el producto por ID.");
    }
  }

  async getProductosByOrden(id_orden) {
    try {
      const pool = await sql.connect(config);
      const result = await pool.request().input("id_orden", sql.Int, id_orden)
        .query(`
          SELECT p.DESCRIPCION, opc.CANTIDAD, opc.PRECIO AS precio_unitario
          FROM oc.DetalleOrdenCompra opc
          JOIN oc.Producto p ON opc.ID_PRODUCTO = p.ID_PRODUCTO
          WHERE opc.ID_ORDEN_COMPRA = @id_orden 
            AND p.ELIMINADO = 0
        `);
      return result.recordset;
    } catch (error) {
      console.error("Error al obtener productos por orden:", error.message);
      throw new Error("Error al obtener productos por orden");
    }
  }
}

export default OrdenesRepository;
