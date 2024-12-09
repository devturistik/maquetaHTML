import CentroCostoRepository from "../adapters/repository/centroCostoRepository.js";

class CentroCostoService {
  constructor() {
    this.centroCostoRepository = new CentroCostoRepository();
  }

  // Obtener todos los Centros de Costo
  async obtenerTodosLosCentroCostos() {
    return await this.centroCostoRepository.getAll();
  }

  // Obtener Centros de Costo por estatus
  async obtenerCentroCostosPorEstatus(estatus) {
    return await this.centroCostoRepository.getByEstatus(estatus);
  }

  // Obtener un Centro de Costo por su ID
  async obtenerCentroCostoPorId(id) {
    return await this.centroCostoRepository.getById(id);
  }

  // Crear un nuevo Centro de Costo
  async crearCentroCosto(datos) {
    return await this.centroCostoRepository.create(datos);
  }

  // Actualizar un Centro de Costo existente
  async actualizarCentroCosto(id, datos) {
    return await this.centroCostoRepository.update(id, datos);
  }

  // Actualizar el estatus de un Centro de Costo
  async actualizarEstatus(id, estatus) {
    return await this.centroCostoRepository.actualizarEstatus(id, estatus);
  }

  // Obtener la lista de gerentes (nombre y apellido) de la tabla Usuarios
  async obtenerGerentes() {
    return await this.centroCostoRepository.getGerentes();
  }
}

export default CentroCostoService;
