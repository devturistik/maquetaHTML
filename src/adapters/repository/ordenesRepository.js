// src/adapters/repository/ordenesRepository.js
import { sql, poolPromise } from "../../config/database.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

class OrdenesRepository {
  async getAllOrdenes() {
    const query = `
      SELECT
        o.id_orden,
        o.codigo,
        o.subtotal,
        o.total,
        o.impuesto,
        o.retencion,
        o.usuario_creador,
        o.correo_creador,
        o.nota_creador,
        o.ruta_archivo_pdf,
        o.documentos_cotizacion,
        o.nivel_aprobacion,
        o.justificacion_rechazo,
        o.total_local,
        o.id_solicitud,
        o.created_at,
        e.nombre AS estatus
      FROM
        oc.OrdenCompra o
      JOIN
        oc.Estatus e
      ON
        o.estatus_id = e.id_estatus
      ORDER BY
        id_orden ASC
    `;
    try {
      const pool = await poolPromise;
      const result = await pool.request().query(query);
      return result.recordset;
    } catch (error) {
      console.error("Error al obtener ordenes:", error.message);
      throw error;
    }
  }

  async getOrdenById(id_orden) {
    const query = `
      SELECT
        o.id_orden,
        o.codigo,
        o.subtotal,
        o.total,
        o.impuesto,
        o.retencion,
        o.usuario_creador,
        o.correo_creador,
        o.nota_creador,
        o.ruta_archivo_pdf,
        o.documentos_cotizacion,
        o.nivel_aprobacion,
        o.justificacion_rechazo,
        o.total_local,
        o.id_centro_costo,
        o.id_moneda,
        o.id_empresa,
        o.id_solicitud,
        o.id_proveedor,
        o.id_tipo_orden,
        o.id_plazo,
        o.created_at,
        e.nombre AS estatus
      FROM
        oc.OrdenCompra o
      JOIN
        oc.Estatus e ON o.estatus_id = e.id_estatus
      WHERE
        o.id_orden = @ID_ORDEN
    `;
    try {
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("ID_ORDEN", sql.Int, id_orden)
        .query(query);
      return result.recordset[0];
    } catch (error) {
      console.error("Error al obtener la orden:", error.message);
      throw error;
    }
  }

  async getOrdenesBySolicitudId(solicitudId) {
    const query = `
      SELECT
        o.id_orden,
        o.codigo,
        o.subtotal,
        o.total,
        o.impuesto,
        o.retencion,
        o.usuario_creador,
        o.correo_creador,
        o.nota_creador,
        o.ruta_archivo_pdf,
        o.documentos_cotizacion,
        o.nivel_aprobacion,
        o.justificacion_rechazo,
        o.total_local,
        o.created_at,
        e.nombre AS estatus
      FROM
        oc.OrdenCompra o
      JOIN
        oc.Estatus e
      ON
        o.estatus_id = e.id_estatus
      WHERE
        o.id_solicitud = @ID_SOLICITUD
    `;
    try {
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("ID_SOLICITUD", sql.Int, solicitudId)
        .query(query);
      return result.recordset;
    } catch (error) {
      console.error("Error al obtener órdenes por solicitud:", error.message);
      throw error;
    }
  }

  async getProveedores() {
    const query = `
      SELECT
        id_proveedor,
        nombre_proveedor,
        documento_proveedor,
        telefono_principal,
        correo_principal
      FROM
        oc.Proveedor
      WHERE
        estatus_proveedor = 1
      AND
        eliminado = 0
      ORDER BY
        nombre_proveedor
    `;
    try {
      const pool = await poolPromise;
      const result = await pool.request().query(query);
      return result.recordset;
    } catch (error) {
      console.error("Error al obtener proveedores:", error.message);
      throw error;
    }
  }

  async getPlazosDePago() {
    const query = `
      SELECT
        id_forma_pago,
        nombre
      FROM
        oc.PlazoPago
      WHERE
        estatus_forma_pago = 1
      ORDER BY
        nombre
    `;
    try {
      const pool = await poolPromise;
      const result = await pool.request().query(query);
      return result.recordset;
    } catch (error) {
      console.error("Error al obtener plazos de pago:", error.message);
      throw error;
    }
  }

  async getEmpresas() {
    const query = `
      SELECT
        id_empresa,
        nombre,
        documento,
        direccion
      FROM
        oc.Empresa
      WHERE
        eliminado = 0
      ORDER BY
        nombre
    `;
    try {
      const pool = await poolPromise;
      const result = await pool.request().query(query);
      return result.recordset;
    } catch (error) {
      console.error("Error al obtener empresas:", error.message);
      throw error;
    }
  }

  async getCentrosDeCosto() {
    const query = `
      SELECT
        id_centro_costo,
        nombre
      FROM
        oc.CentroCosto
      WHERE
        estatus = 1
      ORDER BY
        nombre
    `;
    try {
      const pool = await poolPromise;
      const result = await pool.request().query(query);
      return result.recordset;
    } catch (error) {
      console.error("Error al obtener centro de costos:", error.message);
      throw error;
    }
  }

  async getTiposDeOrden() {
    const query = `
      SELECT
        id_tipo,
        nombre
      FROM
        oc.TipoOrden
      ORDER BY
        nombre
    `;
    try {
      const pool = await poolPromise;
      const result = await pool.request().query(query);
      return result.recordset;
    } catch (error) {
      console.error("Error al obtener tipos de orden:", error.message);
      throw error;
    }
  }

  async getMonedas() {
    const query = `
      SELECT
        id_moneda,
        abrev,
        nombre,
        cambio
      FROM
        oc.Monedas
      ORDER BY
        nombre
    `;
    try {
      const pool = await poolPromise;
      const result = await pool.request().query(query);
      return result.recordset;
    } catch (error) {
      console.error("Error al obtener monedas:", error.message);
      throw error;
    }
  }

  async getProductos() {
    const query = `
      SELECT
        id_producto,
        descripcion,
        unidad
      FROM
        oc.Producto
      WHERE
        estatus_producto = 1
      ORDER BY
        descripcion
    `;
    try {
      const pool = await poolPromise;
      const result = await pool.request().query(query);
      return result.recordset;
    } catch (error) {
      console.error("Error al obtener productos:", error.message);
      throw error;
    }
  }

  async getCuentasContables() {
    const query = `
      SELECT
        id_cuenta,
        nombre_cuenta,
        codigo
      FROM
        oc.Cuentas
      ORDER BY
        nombre_cuenta
    `;
    try {
      const pool = await poolPromise;
      const result = await pool.request().query(query);
      return result.recordset;
    } catch (error) {
      console.error("Error al obtener cuentas contables:", error.message);
      throw error;
    }
  }

  async getBancosByProveedor(proveedorId) {
    const query = `
      SELECT
        b.id_banco,
        b.nombre_banco,
        pb.tipo_cuenta,
        pb.numero_cuenta
      FROM
        oc.ProveedorBanco pb
      JOIN
        oc.Banco b
      ON
        pb.id_banco = b.id_banco
      WHERE
        pb.id_proveedor = @ID_PROVEEDOR
      AND b.estatus = 1
      ORDER BY
        b.nombre_banco
    `;
    try {
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("ID_PROVEEDOR", sql.Int, proveedorId)
        .query(query);
      return result.recordset;
    } catch (error) {
      console.error("Error al obtener bancos por proveedor:", error.message);
      throw error;
    }
  }

  async getDetallesTipoOrden(tipoOrdenId) {
    const query = `
      SELECT
        nombre_detalle,
        cantidad,
        tipo_detalle
      FROM
        oc.DetalleTipoOrden
      WHERE
        id_tipo_orden = @ID_TIPO_ORDEN
      AND
        activo = 1
      ORDER BY
        nombre_detalle
    `;
    try {
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("ID_TIPO_ORDEN", sql.Int, tipoOrdenId)
        .query(query);
      return result.recordset;
    } catch (error) {
      console.error(
        "Error al obtener detalles de tipo de orden:",
        error.message
      );
      throw error;
    }
  }

  async createOrdenConDetalles(newOrden, productos, id_solicitud) {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    try {
      await transaction.begin();

      const requestOrden = new sql.Request(transaction);
      const queryOrden = `
        INSERT INTO oc.OrdenCompra(
          codigo,
          subtotal,
          total,
          impuesto,
          retencion,
          usuario_creador,
          correo_creador,
          nota_creador,
          documentos_cotizacion,
          nivel_aprobacion,
          total_local,
          id_centro_costo,
          id_moneda,
          id_empresa,
          id_solicitud,
          id_proveedor,
          id_tipo_orden,
          id_plazo,
          id_cuenta_contable,
          fecha_vencimiento,
          estatus_id,
          created_at
        )
        OUTPUT INSERTED.ID_ORDEN AS id_orden
        VALUES (
          @CODIGO,
          @SUBTOTAL,
          @TOTAL,
          @IMPUESTO,
          @RETENCION,
          @USUARIO_CREADOR,
          @CORREO_CREADOR,
          @NOTA_CREADOR,
          @DOCUMENTOS_COTIZACION,
          @NIVEL_APROBACION,
          @TOTAL_LOCAL,
          @ID_CENTRO_COSTO,
          @ID_MONEDA,
          @ID_EMPRESA,
          @ID_SOLICITUD,
          @ID_PROVEEDOR,
          @ID_TIPO_ORDEN,
          @ID_PLAZO,
          @ID_CUENTA_CONTABLE,
          @FECHA_VENCIMIENTO,
          @ESTATUS_ID,
          @CREATED_AT
        )
      `;

      const requestEstatus = new sql.Request(transaction);
      const defaultStatusResult = await requestEstatus.query(
        `SELECT id_estatus FROM oc.Estatus WHERE nombre = 'pendiente'`
      );
      const defaultStatus = defaultStatusResult.recordset[0].id_estatus;

      const resultOrden = await requestOrden
        .input("CODIGO", sql.NVarChar, newOrden.codigo)
        .input("SUBTOTAL", sql.Decimal(18, 2), newOrden.subtotal)
        .input("TOTAL", sql.Decimal(18, 2), newOrden.total)
        .input("IMPUESTO", sql.Decimal(18, 2), newOrden.impuesto)
        .input("RETENCION", sql.Decimal(18, 2), newOrden.retencion)
        .input("USUARIO_CREADOR", sql.NVarChar, newOrden.usuario_creador)
        .input("CORREO_CREADOR", sql.NVarChar, newOrden.correo_creador)
        .input("NOTA_CREADOR", sql.NVarChar, newOrden.nota_creador)
        .input(
          "DOCUMENTOS_COTIZACION",
          sql.NVarChar,
          newOrden.documentos_cotizacion
        )
        .input("NIVEL_APROBACION", sql.TinyInt, newOrden.nivel_aprobacion)
        .input("TOTAL_LOCAL", sql.Decimal(18, 2), newOrden.total_local)
        .input("ID_CENTRO_COSTO", sql.Int, newOrden.id_centro_costo)
        .input("ID_MONEDA", sql.Int, newOrden.id_moneda)
        .input("ID_EMPRESA", sql.Int, newOrden.id_empresa)
        .input("ID_SOLICITUD", sql.Int, newOrden.id_solicitud)
        .input("ID_PROVEEDOR", sql.Int, newOrden.id_proveedor)
        .input("ID_TIPO_ORDEN", sql.Int, newOrden.id_tipo_orden)
        .input("ID_PLAZO", sql.Int, newOrden.id_plazo)
        .input("ID_CUENTA_CONTABLE", sql.Int, newOrden.id_cuenta_contable)
        .input("FECHA_VENCIMIENTO", sql.Date, newOrden.fecha_vencimiento)
        .input("ESTATUS_ID", sql.Int, defaultStatus)
        .input("CREATED_AT", sql.DateTime, newOrden.fecha_creacion)
        .query(queryOrden);

      const id_orden = resultOrden.recordset[0].id_orden;

      const codigoOC = generateCodigoOrden(id_orden);
      const requestCodigo = new sql.Request(transaction);
      await requestCodigo
        .input("CODIGO", sql.NVarChar, codigoOC)
        .input("ID_ORDEN", sql.Int, id_orden).query(`
          UPDATE oc.OrdenCompra
          SET codigo = @CODIGO
          WHERE id_orden = @ID_ORDEN
        `);

      for (const producto of productos) {
        const requestDetalle = new sql.Request(transaction);
        await requestDetalle
          .input("ID_SOLICITUD", sql.Int, id_solicitud)
          .input("ID_ORDEN_COMPRA", sql.Int, id_orden)
          .input("ID_PRODUCTO", sql.Int, producto.id_producto)
          .input("PRECIO", sql.Decimal(18, 2), producto.valorUnitario)
          .input("CANTIDAD", sql.Decimal(18, 2), producto.cantidad)
          .input("TOTAL_DETALLE", sql.Decimal(18, 2), producto.valorTotal)
          .input("CANT_X_RECIBIR", sql.Decimal(18, 2), producto.cantidad)
          .query(`
            INSERT INTO oc.DetalleOrdenCompra (
              id_solicitud,
              id_orden_compra,
              id_producto,
              precio,
              cantidad,
              total_detalle,
              cant_x_recibir
            )
            VALUES (
              @ID_SOLICITUD,
              @ID_ORDEN_COMPRA,
              @ID_PRODUCTO,
              @PRECIO,
              @CANTIDAD,
              @TOTAL_DETALLE,
              @CANT_X_RECIBIR
            )
          `);
      }

      await transaction.commit();

      return { id_orden, codigoOC };
    } catch (error) {
      await transaction.rollback();
      console.error(
        "Error en OrdenesRepository.createOrdenConDetalles:",
        error.message
      );
      throw error;
    }
  }

  async updateOrdenCodigo(id_orden, codigo) {
    const query = `
      UPDATE oc.OrdenCompra
      SET codigo = @CODIGO
      WHERE id_orden = @ID_ORDEN
    `;
    try {
      const pool = await poolPromise;
      await pool
        .request()
        .input("CODIGO", sql.NVarChar, codigo)
        .input("ID_ORDEN", sql.Int, id_orden)
        .query(query);
    } catch (error) {
      console.error(
        "Error en ordenesRepository.updateOrdenCodigo:",
        error.message
      );
      throw error;
    }
  }

  async updateOrdenPdfUrl(id_orden, pdfData) {
    const query = `
      UPDATE oc.OrdenCompra
      SET ruta_archivo_pdf = @PDF_DATA
      WHERE id_orden = @ID_ORDEN
    `;
    try {
      const pool = await poolPromise;
      await pool
        .request()
        .input("PDF_DATA", sql.NVarChar, JSON.stringify(pdfData))
        .input("ID_ORDEN", sql.Int, id_orden)
        .query(query);
    } catch (error) {
      console.error(
        "Error en ordenesRepository.updateOrdenPdfUrl:",
        error.message
      );
      throw error;
    }
  }

  async getProveedorById(id) {
    const query = `
      SELECT
        nombre_proveedor,
        documento_proveedor,
        telefono_principal,
        correo_principal
      FROM
        oc.Proveedor
      WHERE
        id_proveedor = @ID
      AND
        eliminado = 0
    `;
    try {
      const pool = await poolPromise;
      const result = await pool.request().input("ID", sql.Int, id).query(query);
      return result.recordset[0];
    } catch (error) {
      console.error(
        "Error en ordenesRepository.getProveedorById:",
        error.message
      );
      throw error;
    }
  }

  async getBancoById(id) {
    const query = `
      SELECT
        nombre_banco
      FROM
        oc.Banco
      WHERE
        id_banco = @ID
    `;
    try {
      const pool = await poolPromise;
      const result = await pool.request().input("ID", sql.Int, id).query(query);
      return result.recordset[0];
    } catch (error) {
      console.error("Error en ordenesRepository.getBancoById:", error.message);
      throw error;
    }
  }

  async getPlazoPagoById(id) {
    const query = `
      SELECT
        nombre
      FROM
        oc.PlazoPago
      WHERE
        id_forma_pago = @ID
      AND
        estatus_forma_pago = 1
    `;
    try {
      const pool = await poolPromise;
      const result = await pool.request().input("ID", sql.Int, id).query(query);
      return result.recordset[0];
    } catch (error) {
      console.error(
        "Error en ordenesRepository.getPlazoPagoById:",
        error.message
      );
      throw error;
    }
  }

  async getEmpresaById(id) {
    const query = `
      SELECT
        nombre,
        documento,
        direccion
      FROM
        oc.Empresa
      WHERE
        id_empresa = @ID
      AND
        eliminado = 0
    `;
    try {
      const pool = await poolPromise;
      const result = await pool.request().input("ID", sql.Int, id).query(query);
      return result.recordset[0];
    } catch (error) {
      console.error(
        "Error en ordenesRepository.getEmpresaById:",
        error.message
      );
      throw error;
    }
  }

  async getCentroCostoById(id) {
    const query = `
      SELECT
        nombre
      FROM
        oc.CentroCosto
      WHERE
        id_centro_costo = @ID
      AND
        estatus = 1
    `;
    try {
      const pool = await poolPromise;
      const result = await pool.request().input("ID", sql.Int, id).query(query);
      return result.recordset[0];
    } catch (error) {
      console.error(
        "Error en ordenesRepository.getCentroCostoById:",
        error.message
      );
      throw error;
    }
  }

  async getTipoOrdenById(id) {
    const query = `
      SELECT
        nombre
      FROM
        oc.TipoOrden
      WHERE
        id_tipo = @ID
    `;
    try {
      const pool = await poolPromise;
      const result = await pool.request().input("ID", sql.Int, id).query(query);
      return result.recordset[0];
    } catch (error) {
      console.error(
        "Error en ordenesRepository.getTipoOrdenById:",
        error.message
      );
      throw error;
    }
  }

  async getMonedaById(id) {
    const query = `
      SELECT
        abrev,
        nombre,
        cambio
      FROM
        oc.Monedas
      WHERE
        id_moneda = @ID
    `;
    try {
      const pool = await poolPromise;
      const result = await pool.request().input("ID", sql.Int, id).query(query);
      return result.recordset[0];
    } catch (error) {
      console.error("Error en ordenesRepository.getMonedaById:", error.message);
      throw error;
    }
  }

  async getCuentaContableById(id) {
    const query = `
      SELECT
        nombre_cuenta,
        codigo
      FROM
        oc.Cuentas
      WHERE
        id_cuenta = @ID
    `;
    try {
      const pool = await poolPromise;
      const result = await pool.request().input("ID", sql.Int, id).query(query);
      return result.recordset[0];
    } catch (error) {
      console.error(
        "Error en ordenesRepository.getCuentaContableById:",
        error.message
      );
      throw error;
    }
  }

  async getProveedorBanco(id_banco, id_proveedor) {
    const query = `
      SELECT
        numero_cuenta,
        tipo_cuenta,
        correo_banco
      FROM
        oc.ProveedorBanco
      WHERE
        id_banco = @ID_BANCO
      AND
        id_proveedor = @ID_PROVEEDOR
    `;
    try {
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("ID_BANCO", sql.Int, id_banco)
        .input("ID_PROVEEDOR", sql.Int, id_proveedor)
        .query(query);
      const proveedorBanco = result.recordset[0];
      if (!proveedorBanco) {
        return null;
      }

      const bancoDetails = await this.getBancoById(id_banco);
      return {
        ...proveedorBanco,
        ...bancoDetails,
      };
    } catch (error) {
      console.error(
        "Error en ordenesRepository.getProveedorBanco:",
        error.message
      );
      throw error;
    }
  }
}

function generateCodigoOrden(id_orden) {
  const fecha = new Date();
  const anio = fecha.getFullYear();
  const mes = ("0" + (fecha.getMonth() + 1)).slice(-2);
  const dia = ("0" + fecha.getDate()).slice(-2);
  return `${dia}${mes}${anio}-${id_orden}`;
}

export default OrdenesRepository;
