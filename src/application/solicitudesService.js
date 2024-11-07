// src/application/solicitudesService.js
import SolicitudesRepository from "../adapters/repository/solicitudesRepository.js";
import { validateSolicitudData } from "../utils/validation.js";

class SolicitudesService {
  constructor() {
    this.solicitudesRepository = new SolicitudesRepository();
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
    const validationErrors = validateSolicitudData(solicitudData);
    if (validationErrors) {
      const error = new Error("Validation Error");
      error.validationErrors = validationErrors;
      throw error;
    }

    return await this.solicitudesRepository.saveSolicitud(solicitudData);
  }

  // Actualizar una solicitud existente
  async updateSolicitud(id, solicitudData) {
    const validationErrors = validateSolicitudData(solicitudData);
    if (validationErrors) {
      const error = new Error("Validation Error");
      error.validationErrors = validationErrors;
      throw error;
    }

    return await this.solicitudesRepository.updateSolicitud(id, solicitudData);
  }

  // Eliminar una solicitud
  async deleteSolicitud(id, justificacion) {
    return await this.solicitudesRepository.deleteSolicitud(id, justificacion);
  }

  // Marcar un archivo como eliminado
  async marcarArchivoComoEliminado(idSolicitud, urlArchivo) {
    const solicitud = await this.solicitudesRepository.getById(idSolicitud);
    let archivos = JSON.parse(solicitud.archivos);

    archivos = archivos.map((archivo) => {
      if (archivo.url === urlArchivo) {
        return { ...archivo, eliminado: 1 };
      }
      return archivo;
    });

    const archivosJson = JSON.stringify(archivos);
    await this.solicitudesRepository.updateArchivos(idSolicitud, archivosJson);
  }
}

export default SolicitudesService;
