// src/application/solicitudesService.js
import SolicitudesRepository from "../adapters/repository/solicitudesRepository.js";
import { validateSolicitudData } from "../utils/validation.js";

class SolicitudesService {
  constructor() {
    this.solicitudesRepository = new SolicitudesRepository();
  }

  async getAllSolicitudes() {
    return await this.solicitudesRepository.getAll();
  }

  async getSolicitudById(id) {
    return await this.solicitudesRepository.getById(id);
  }

  async createSolicitud(solicitudData) {
    const validationErrors = validateSolicitudData(solicitudData);
    console.log(validationErrors);
    if (validationErrors) {
      const error = new Error("Validation Error");
      error.validationErrors = validationErrors;
      throw error;
    }

    return await this.solicitudesRepository.saveSolicitud(solicitudData);
  }

  async updateSolicitud(id, solicitudData) {
    const validationErrors = validateSolicitudData(solicitudData);
    if (validationErrors) {
      const error = new Error("Validation Error");
      error.validationErrors = validationErrors;
      throw error;
    }

    return await this.solicitudesRepository.updateSolicitud(id, solicitudData);
  }

  async deleteSolicitud(id, justificacion) {
    return await this.solicitudesRepository.deleteSolicitud(id, justificacion);
  }
}

export default SolicitudesService;
