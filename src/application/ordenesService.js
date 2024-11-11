// src/application/ordenesService.js
import OrdenesRepository from "../adapters/repository/ordenesRepository.js";
import SolicitudesService from "./solicitudesService.js";
import sql from "mssql";
import config from "../config/database.js";

class OrdenesService {
  constructor() {
    this.ordenesRepository = new OrdenesRepository();
    this.solicitudesService = new SolicitudesService();
  }

  async getAllOrdenes() {
    return await this.ordenesRepository.getAll();
  }

  async getOrdenById(id) {
    try {
      return await this.ordenesRepository.getById(id);
    } catch (error) {
      console.error("Error en OrdenesService.getOrdenById:", error.message);
      throw error;
    }
  }

  async createOrden(ordenData) {
    const pool = await sql.connect(config);
    const transaction = new sql.Transaction(pool);

    try {
      await transaction.begin();
      const request = new sql.Request(transaction);

      // Insertar OrdenCompra
      const result = await request
        .input("codigo", sql.NVarChar, ordenData.codigo)
        .input("subtotal", sql.Decimal(18, 2), ordenData.subtotal)
        .input("total", sql.Decimal(18, 2), ordenData.total)
        .input("impuesto", sql.Decimal(18, 2), ordenData.impuesto)
        .input("retencion", sql.Decimal(18, 2), ordenData.retencion)
        .input("nota_creador", sql.NVarChar, ordenData.nota_creador)
        .input(
          "documentos_cotizacion",
          sql.NVarChar,
          ordenData.documentos_cotizacion
        )
        .input("usuario_creador", sql.NVarChar, ordenData.usuario_creador)
        .input("correo_creador", sql.NVarChar, ordenData.correo_creador)
        .input("id_moneda", sql.Int, ordenData.id_moneda)
        .input("id_solicitud", sql.Int, ordenData.id_solicitud)
        .input("id_proveedor", sql.Int, ordenData.id_proveedor)
        .input("id_tipo_orden", sql.Int, ordenData.id_tipo_orden)
        .input("id_plazo", sql.Int, ordenData.id_plazo)
        .input("nivel_aprobacion", sql.TinyInt, ordenData.nivel_aprobacion)
        .input(
          "justificacion_rechazo",
          sql.NVarChar,
          ordenData.justificacion_rechazo
        )
        .input("ruta_archivo_pdf", sql.NVarChar, ordenData.ruta_archivo_pdf)
        .input("total_local", sql.Decimal(18, 2), ordenData.total_local)
        .input("creado_por", sql.NVarChar, ordenData.creado_por)
        .input("fecha_vencimiento", sql.Date, ordenData.fecha_vencimiento)
        .query(`
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

      const id_orden = result.recordset[0].id_orden;

      // Insertar Detalles de OrdenCompra
      for (const producto of ordenData.productos) {
        await request
          .input("id_solicitud", sql.Int, ordenData.id_solicitud)
          .input("id_orden_compra", sql.Int, id_orden)
          .input("id_producto", sql.Int, producto.id_producto)
          .input(
            "precio_unitario",
            sql.Decimal(18, 2),
            producto.precio_unitario
          )
          .input("cantidad", sql.Int, producto.cantidad)
          .input("total_detalle", sql.Decimal(18, 2), producto.total_detalle)
          .input("cant_x_recibir", sql.Int, producto.cant_x_recibir).query(`
            INSERT INTO oc.DetalleOrdenCompra 
              (ID_SOLICITUD, ID_ORDEN_COMPRA, ID_PRODUCTO, PRECIO, CANTIDAD, FECHA_CREACION, FECHA_ACTUALIZACION,
               TOTAL_DETALLE, CANT_X_RECIBIR)
            VALUES
              (@id_solicitud, @id_orden_compra, @id_producto, @precio_unitario, @cantidad, GETDATE(), GETDATE(),
               @total_detalle, @cant_x_recibir)
          `);
      }

      await transaction.commit();
      return id_orden;
    } catch (error) {
      await transaction.rollback();
      console.error("Error en OrdenesService.createOrden:", error.message);
      throw new Error("Error al crear la orden de compra.");
    }
  }

  async updateOrden(id_orden, ordenData) {
    return await this.ordenesRepository.updateOrden(id_orden, ordenData);
  }

  async deleteOrden(id_orden) {
    return await this.ordenesRepository.deleteOrden(id_orden);
  }

  async getUltimaOrdenCreada() {
    try {
      return await this.ordenesRepository.getUltimaOrdenCreada();
    } catch (error) {
      console.error(
        "Error en OrdenesService.getUltimaOrdenCreada:",
        error.message
      );
      throw error;
    }
  }

  async getProveedores() {
    try {
      return await this.ordenesRepository.getProveedores();
    } catch (error) {
      console.error("Error en OrdenesService.getProveedores:", error.message);
      throw error;
    }
  }

  async getProveedorById(id_proveedor) {
    try {
      return await this.ordenesRepository.getProveedorById(id_proveedor);
    } catch (error) {
      console.error("Error en OrdenesService.getProveedorById:", error.message);
      throw error;
    }
  }

  async getBancosByProveedor(id_proveedor) {
    return await this.ordenesRepository.getBancosByProveedor(id_proveedor);
  }

  async getBancoById(id_banco) {
    try {
      return await this.ordenesRepository.getBancoById(id_banco);
    } catch (error) {
      console.error("Error en OrdenesService.getBancoById:", error.message);
      throw error;
    }
  }

  async getPlazoPagos() {
    try {
      return await this.ordenesRepository.getPlazoPagos();
    } catch (error) {
      console.error("Error en OrdenesService.getPlazoPagos:", error.message);
      throw error;
    }
  }

  async getEmpresas() {
    try {
      return await this.ordenesRepository.getEmpresas();
    } catch (error) {
      console.error("Error en OrdenesService.getEmpresas:", error.message);
      throw error;
    }
  }

  async getTipoOrdenes() {
    try {
      return await this.ordenesRepository.getTipoOrdenes();
    } catch (error) {
      console.error("Error en OrdenesService.getTipoOrdenes:", error.message);
      throw error;
    }
  }

  async getDetalleTipoOrden() {
    try {
      return await this.ordenesRepository.getDetalleTipoOrden();
    } catch (error) {
      console.error(
        "Error en OrdenesService.getDetalleTipoOrden:",
        error.message
      );
      throw error;
    }
  }

  async getMonedas() {
    try {
      return await this.ordenesRepository.getMonedas();
    } catch (error) {
      console.error("Error en OrdenesService.getMonedas:", error.message);
      throw error;
    }
  }

  async getCentroCostos() {
    try {
      return await this.ordenesRepository.getCentroCostos();
    } catch (error) {
      console.error("Error en OrdenesService.getCentroCostos:", error.message);
      throw error;
    }
  }

  async getProductos() {
    try {
      return await this.ordenesRepository.getProductos();
    } catch (error) {
      console.error("Error en OrdenesService.getProductos:", error.message);
      throw error;
    }
  }

  async getProductoById(id_producto) {
    try {
      return await this.ordenesRepository.getProductoById(id_producto);
    } catch (error) {
      console.error("Error en OrdenesService.getProductoById:", error.message);
      throw error;
    }
  }

  async getMonedaById(id_moneda) {
    return await this.ordenesRepository.getMonedaById(id_moneda);
  }

  async getCategorias() {
    return await this.ordenesRepository.getCategorias();
  }

  async getProductosByOrden(id_orden) {
    try {
      return await this.ordenesRepository.getProductosByOrden(id_orden);
    } catch (error) {
      console.error(
        "Error en OrdenesService.getProductosByOrden:",
        error.message
      );
      throw error;
    }
  }
}

export default OrdenesService;
