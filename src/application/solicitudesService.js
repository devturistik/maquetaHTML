// src/application/solicitudesService.js
import SolicitudesRepository from "../adapters/repository/solicitudesRepository.js";

class SolicitudesService {
  constructor() {
    this.solicitudesRepository = new SolicitudesRepository();
  }

  // Validar datos de solicitud
  validateSolicitudData(solicitudData) {
    const errors = {};
    if (!solicitudData.asunto || solicitudData.asunto.trim() === "") {
      errors.asunto = "El asunto es requerido.";
    }
    if (!solicitudData.descripcion || solicitudData.descripcion.trim() === "") {
      errors.descripcion = "La descripción es requerida.";
    }
    return Object.keys(errors).length > 0 ? errors : null;
  }

  // Obtener todas las solicitudes
  async getAllSolicitudes() {
    return await this.solicitudesRepository.getAll();
  }

  // Obtener una solicitud por ID
  async getSolicitudById(id) {
    return await this.solicitudesRepository.getById(id);
  }

  // Crear una nueva solicitud
  async createSolicitud(solicitudData) {
    return await this.solicitudesRepository.saveSolicitud(solicitudData);
  }

  // Actualizar una solicitud existente
  async updateSolicitud(id, solicitudData) {
    return await this.solicitudesRepository.updateSolicitud(id, solicitudData);
  }

  async updateEstatus(id, nuevoEstatus) {
    return await this.solicitudesRepository.updateEstatus(id, nuevoEstatus);
  }

  // Eliminar una solicitud
  async deleteSolicitud(id, justificacion) {
    return await this.solicitudesRepository.deleteSolicitud(id, justificacion);
  }
}

export default SolicitudesService;
