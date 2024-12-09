// src/application/ordenesService.js
import OrdenesRepository from "../adapters/repository/ordenesRepository.js";
import { sql, poolPromise } from "../config/database.js";

class OrdenesService {
  constructor() {
    this.ordenesRepository = new OrdenesRepository();
  }

  async getAllOrdenes() {
    return await this.ordenesRepository.getAllOrdenes();
  }

  async getOrdenById(id_orden) {
    try {
      return await this.ordenesRepository.getOrdenById(id_orden);
    } catch (error) {
      console.error("Error en OrdenesService.getOrdenById:", error.message);
      throw error;
    }
  }

  async archivarOrden(id_orden) {
    try {
      return await this.ordenesRepository.archivarOrden(id_orden);
    } catch (error) {
      console.error("Error en OrdenesService.archivarOrden:", error.message);
      throw error;
    }
  }

  async desarchivarOrden(id_orden) {
    try {
      await this.ordenesRepository.desarchivarOrden(id_orden);
    } catch (error) {
      console.error("Error en OrdenesService.desarchivarOrden:", error.message);
      throw error;
    }
  }

  async getOrdenesArchivadas() {
    try {
      return await this.ordenesRepository.getOrdenesArchivadas();
    } catch (error) {
      console.error(
        "Error en OrdenesService.getOrdenesArchivadas:",
        error.message
      );
      throw error;
    }
  }

  async getHistorialAprobaciones(codigoOrden) {
    try {
      return await this.ordenesRepository.getHistorialAprobaciones(codigoOrden);
    } catch (error) {
      console.error(
        "Error en OrdenesService.getHistorialAprobaciones:",
        error.message
      );
      throw error;
    }
  }

  async getUsuariosAprobadores(historialAprobaciones) {
    try {
      const aprobadorIds = historialAprobaciones
        .map((h) => h.aprobador_id)
        .filter(Boolean);
      return await this.ordenesRepository.getUsuariosAprobadores(aprobadorIds);
    } catch (error) {
      console.error(
        "Error en OrdenesService.getUsuariosAprobadores:",
        error.message
      );
      throw error;
    }
  }

  async getProveedores() {
    return await this.ordenesRepository.getProveedores();
  }

  async getPlazosDePago() {
    return await this.ordenesRepository.getPlazosDePago();
  }

  async getEmpresas() {
    return await this.ordenesRepository.getEmpresas();
  }

  async getCentrosDeCosto() {
    return await this.ordenesRepository.getCentrosDeCosto();
  }

  async getTiposDeOrden() {
    return await this.ordenesRepository.getTiposDeOrden();
  }

  async getMonedas() {
    return await this.ordenesRepository.getMonedas();
  }

  async getProductos() {
    return await this.ordenesRepository.getProductos();
  }

  async getCuentasContables() {
    return await this.ordenesRepository.getCuentasContables();
  }

  async getBancosByProveedor(proveedorId) {
    return await this.ordenesRepository.getBancosByProveedor(proveedorId);
  }

  async getDetallesTipoOrden(tipoOrdenId) {
    return await this.ordenesRepository.getDetallesTipoOrden(tipoOrdenId);
  }

  async createOrdenConDetalles(newOrden, productos, id_solicitud) {
    try {
      const result = await this.ordenesRepository.createOrdenConDetalles(
        newOrden,
        productos,
        id_solicitud
      );
      return result;
    } catch (error) {
      console.error(
        "Error en OrdenesService.createOrdenConDetalles:",
        error.message
      );
      throw error;
    }
  }

  async updateOrdenDocumentosCotizacion(id_orden, documentosCotizacion) {
    try {
      await this.ordenesRepository.updateOrdenDocumentosCotizacion(
        id_orden,
        documentosCotizacion
      );
    } catch (error) {
      console.error(
        "Error en OrdenesService.updateOrdenDocumentosCotizacion:",
        error.message
      );
      throw error;
    }
  }

  async updateOrdenCodigo(id_orden, codigo) {
    try {
      await this.ordenesRepository.updateOrdenCodigo(id_orden, codigo);
    } catch (error) {
      console.error(
        "Error en OrdenesService.updateOrdenCodigo:",
        error.message
      );
      throw error;
    }
  }

  async updateOrdenPdfUrl(id_orden, pdfUrl) {
    try {
      await this.ordenesRepository.updateOrdenPdfUrl(id_orden, pdfUrl);
    } catch (error) {
      console.error(
        "Error en OrdenesService.updateOrdenPdfUrl:",
        error.message
      );
      throw error;
    }
  }

  async cancelarOrden(id_orden, justificacion) {
    try {
      await this.ordenesRepository.cancelarOrden(id_orden, justificacion);
    } catch (error) {
      console.error("Error en OrdenesService.cancelarOrden:", error.message);
      throw error;
    }
  }

  async getProveedorById(id) {
    try {
      return await this.ordenesRepository.getProveedorById(id);
    } catch (error) {
      console.error("Error en OrdenesService.getProveedorById:", error.message);
      throw error;
    }
  }

  async getBancoById(id) {
    try {
      return await this.ordenesRepository.getBancoById(id);
    } catch (error) {
      console.error("Error en OrdenesService.getBancoById:", error.message);
      throw error;
    }
  }

  async getPlazoPagoById(id) {
    try {
      return await this.ordenesRepository.getPlazoPagoById(id);
    } catch (error) {
      console.error("Error en OrdenesService.getPlazoPagoById:", error.message);
      throw error;
    }
  }

  async getEmpresaById(id) {
    try {
      return await this.ordenesRepository.getEmpresaById(id);
    } catch (error) {
      console.error("Error en OrdenesService.getEmpresaById:", error.message);
      throw error;
    }
  }

  async getCentroCostoById(id) {
    try {
      return await this.ordenesRepository.getCentroCostoById(id);
    } catch (error) {
      console.error(
        "Error en OrdenesService.getCentroCostoById:",
        error.message
      );
      throw error;
    }
  }

  async getTipoOrdenById(id) {
    try {
      return await this.ordenesRepository.getTipoOrdenById(id);
    } catch (error) {
      console.error("Error en OrdenesService.getTipoOrdenById:", error.message);
      throw error;
    }
  }

  async getMonedaById(id) {
    try {
      return await this.ordenesRepository.getMonedaById(id);
    } catch (error) {
      console.error("Error en OrdenesService.getMonedaById:", error.message);
      throw error;
    }
  }

  async getCuentaContableById(id) {
    try {
      return await this.ordenesRepository.getCuentaContableById(id);
    } catch (error) {
      console.error(
        "Error en OrdenesService.getCuentaContableById:",
        error.message
      );
      throw error;
    }
  }

  async getProveedorBanco(id_banco, id_proveedor) {
    try {
      return await this.ordenesRepository.getProveedorBanco(
        id_banco,
        id_proveedor
      );
    } catch (error) {
      console.error(
        "Error en OrdenesService.getProveedorBanco:",
        error.message
      );
      throw error;
    }
  }

  async getOrdenesByIds(ids) {
    try {
      return await this.ordenesRepository.fetchOrdenesByIds(ids);
    } catch (error) {
      throw error;
    }
  }
}

export default OrdenesService;
