// src/application/ordenesService.js
import OrdenesRepository from "../adapters/repository/ordenesRepository.js";

class OrdenesService {
  constructor() {
    this.ordenesRepository = new OrdenesRepository();
  }

  async getAllOrdenes() {
    return await this.ordenesRepository.getAll();
  }

  async getOrdenById(id) {
    return await this.ordenesRepository.getById(id);
  }

  async createOrden(ordenData) {
    return await this.ordenesRepository.saveOrden(ordenData);
  }

  async updateOrden(id, ordenData) {
    return await this.ordenesRepository.updateOrden(id, ordenData);
  }

  async deleteOrden(id) {
    return await this.ordenesRepository.deleteOrden(id);
  }

  async getProveedores() {
    return await this.ordenesRepository.getProveedores();
  }

  async getBancos() {
    return await this.ordenesRepository.getBancos();
  }

  async getPlazoPagos() {
    return await this.ordenesRepository.getPlazoPagos();
  }

  async getEmpresas() {
    return await this.ordenesRepository.getEmpresas();
  }

  async getTipoOrdenes() {
    return await this.ordenesRepository.getTipoOrdenes();
  }

  async getMonedas() {
    return await this.ordenesRepository.getMonedas();
  }

  async getCategorias() {
    return await this.ordenesRepository.getCategorias();
  }

  async getProductos() {
    return await this.ordenesRepository.getProductos();
  }
}

export default OrdenesService;
