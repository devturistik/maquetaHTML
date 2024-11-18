// src/adapters/repository/ordenesRepository.js
import { sql, poolPromise } from "../../config/database.js";

class OrdenesRepository {
  async getAllOrdenes() {
    const query = `
      SELECT
        *
      FROM
        oc.OrdenCompra
      ORDER BY
        ID_ORDEN ASC
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

  async getProveedores() {
    const query = `
      SELECT
        ID_PROVEEDOR,
        NOMBRE_PROVEEDOR,
        DOCUMENTO_PROVEEDOR,
        TELEFONO_PRINCIPAL,
        CORREO_PRINCIPAL
      FROM
        oc.Proveedor
      WHERE
        ESTATUS_PROVEEDOR = 1 AND ELIMINADO = 0
      ORDER BY
        NOMBRE_PROVEEDOR
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
        ID_FORMA_PAGO, NOMBRE
      FROM
        oc.PlazoPago
      WHERE
        ELIMINADO = 0
        AND ESTATUS_FORMA_PAGO = 1
      ORDER BY
        NOMBRE
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
        ID_EMPRESA, NOMBRE
      FROM
        oc.Empresa
      WHERE
        ELIMINADO = 0
      ORDER BY
        NOMBRE
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
        ID_CENTRO_COSTO, NOMBRE, ENCARGADO, CORREO_ENCARGADO, PRESUPUESTO
      FROM
        oc.CentroCosto
      WHERE
        ESTATUS = 1
      ORDER BY
        NOMBRE
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
        id_tipo, nombre
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
        ID_MONEDA, ABREV, NOMBRE, CAMBIO
      FROM
        oc.Monedas
      ORDER BY
        NOMBRE
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
        ID_PRODUCTO, DESCRIPCION, UNIDAD
      FROM
        oc.Producto
      WHERE
        ELIMINADO = 0
      ORDER BY
        DESCRIPCION
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

  async getBancosByProveedor(proveedorId) {
    const query = `
      SELECT
        b.ID_BANCO,
        b.NOMBRE_BANCO,
        pb.TIPO_CUENTA,
        pb.NUMERO_CUENTA
      FROM
        oc.ProveedorBanco pb
      JOIN
        oc.Banco b
      ON
        pb.ID_BANCO = b.ID_BANCO
      WHERE
        pb.ID_PROVEEDOR = @ID_PROVEEDOR
      AND pb.ELIMINADO = 0
      AND b.ELIMINADO = 0
      ORDER BY
        b.NOMBRE_BANCO
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

  async getCuentasContablesByEmpresa(empresaId) {
    const query = `
      SELECT
        ID_CUENTA,
        NOMBRE_CUENTA,
        CODIGO
      FROM
        oc.Cuentas
      WHERE
        ID_EMPRESA = @ID_EMPRESA
      ORDER BY
        NOMBRE_CUENTA
    `;
    try {
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("ID_EMPRESA", sql.Int, empresaId)
        .query(query);
      return result.recordset;
    } catch (error) {
      console.error(
        "Error al obtener cuentas contables por empresa:",
        error.message
      );
      throw error;
    }
  }

  async getDetallesTipoOrden(tipoOrdenId) {
    const query = `
      SELECT
        NOMBRE_DETALLE,
        CANTIDAD,
        TIPO_DETALLE
      FROM
        oc.DetalleTipoOrden
      WHERE
        ID_TIPO_ORDEN = @ID_TIPO_ORDEN
        AND ACTIVO = 1
      ORDER BY
        NOMBRE_DETALLE
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

  async createOrden(newOrden) {
    const query = `
      INSERT INTO oc.OrdenCompra(
        CODIGO,
        SUBTOTAL,
        TOTAL,
        IMPUESTO,
        RETENCION,
        USUARIO_CREADOR,
        CORREO_CREADOR,
        NOTA_CREADOR,
        DOCUMENTOS_COTIZACION,
        NIVEL_APROBACION,
        TOTAL_LOCAL,
        ID_MONEDA,
        ID_EMPRESA,
        ID_SOLICITUD,
        ID_PROVEEDOR,
        ID_TIPO_ORDEN,
        ID_PLAZO,
        FECHA_VENCIMIENTO
      )
      OUTPUT INSERTED.ID_ORDEN AS id_orden
      VALUES(
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
        @ID_MONEDA,
        @ID_EMPRESA,
        @ID_SOLICITUD,
        @ID_PROVEEDOR,
        @ID_TIPO_ORDEN,
        @ID_PLAZO,
        @FECHA_VENCIMIENTO
      )
    `;
    try {
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("CODIGO", sql.NVarChar, newOrden.codigo)
        .input("SUBTOTAL", sql.Decimal, newOrden.subtotal)
        .input("TOTAL", sql.Decimal, newOrden.total)
        .input("IMPUESTO", sql.Decimal, newOrden.impuesto)
        .input("RETENCION", sql.Decimal, newOrden.retencion)
        .input("USUARIO_CREADOR", sql.NVarChar, newOrden.usuario_creador)
        .input("CORREO_CREADOR", sql.NVarChar, newOrden.correo_creador)
        .input("NOTA_CREADOR", sql.NVarChar, newOrden.nota_creador)
        .input("RUTA_ARCHIVO_PDF", sql.NVarChar, newOrden.ruta_archivo_pdf)
        .input(
          "DOCUMENTOS_COTIZACION",
          sql.NVarChar,
          newOrden.documentos_cotizacion
        )
        .input("NIVEL_APROBACION", sql.TinyInt, newOrden.nivel_aprobacion)
        .input(
          "JUSTIFICACION_RECHAZO",
          sql.NVarChar,
          newOrden.justificacion_rechazo
        )
        .input("TOTAL_LOCAL", sql.Decimal, newOrden.total_local)
        .input("ID_MONEDA", sql.Int, newOrden.id_moneda)
        .input("ID_EMPRESA", sql.Int, newOrden.id_empresa)
        .input("ID_SOLICITUD", sql.Int, newOrden.id_solicitud)
        .input("ID_PROVEEDOR", sql.Int, newOrden.id_proveedor)
        .input("ID_TIPO_ORDEN", sql.Int, newOrden.id_tipo_orden)
        .input("ID_PLAZO", sql.Int, newOrden.id_plazo)
        .input("FECHA_VENCIMIENTO", sql.Date, newOrden.fecha_vencimiento)
        .query(query);
      return result.recordset[0].id_orden;
    } catch (error) {
      console.error("Error en ordenesRepository.createOrden:", error.message);
      throw error;
    }
  }

  async updateOrdenCodigo(id_orden, codigo) {
    const query = `
      UPDATE oc.OrdenCompra
      SET CODIGO = @CODIGO
      WHERE ID_ORDEN = @ID_ORDEN
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
      SET RUTA_ARCHIVO_PDF = @PDF_DATA
      WHERE ID_ORDEN = @ID_ORDEN
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
        NOMBRE_PROVEEDOR,
        DOCUMENTO_PROVEEDOR,
        TELEFONO_PRINCIPAL,
        CORREO_PRINCIPAL
      FROM
        oc.Proveedor
      WHERE
        ID_PROVEEDOR = @ID
      AND
        ELIMINADO = 0
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
        NOMBRE_BANCO
      FROM
        oc.Banco
      WHERE
        ID_BANCO = @ID
      AND
        ELIMINADO = 0
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
        NOMBRE
      FROM
        oc.PlazoPago
      WHERE
        ID_FORMA_PAGO = @ID
      AND
        ELIMINADO = 0
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
        NOMBRE,
        DOCUMENTO,
        DIRECCION
      FROM
        oc.Empresa
      WHERE
        ID_EMPRESA = @ID
      AND
        ELIMINADO = 0
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
        NOMBRE,
        ENCARGADO
      FROM
        oc.CentroCosto
      WHERE
        ID_CENTRO_COSTO = @ID
      AND
        ESTATUS = 1
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
        NOMBRE
      FROM
        oc.TipoOrden
      WHERE
        ID_TIPO = @ID
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
        ABREV,
        NOMBRE,
        CAMBIO
      FROM
        oc.Monedas
      WHERE
        ID_MONEDA = @ID
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
        NOMBRE_CUENTA,
        CODIGO
      FROM
        oc.Cuentas
      WHERE
        ID_CUENTA = @ID
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
        NUMERO_CUENTA,
        TIPO_CUENTA,
        CORREO_BANCO
      FROM
        oc.ProveedorBanco
      WHERE
        ID_BANCO = @ID_BANCO
      AND
        ID_PROVEEDOR = @ID_PROVEEDOR
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

export default OrdenesRepository;
