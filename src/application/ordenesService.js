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

  async createOrden(ordenData, detalles, archivos) {
    const pool = await sql.connect(config);
    const transaction = new sql.Transaction(pool);

    try {
      await transaction.begin();

      const repo = this.ordenesRepository;

      const orden = await repo.saveOrden(ordenData, transaction);
      const id_orden = orden.id_orden;

      for (const detalle of detalles) {
        detalle.id_orden_compra = id_orden;
        await repo.saveDetalleOrdenCompra(detalle, transaction);
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
