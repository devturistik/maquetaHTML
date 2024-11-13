// src/application/solicitudesService.js
import SolicitudesRepository from "../adapters/repository/solicitudesRepository.js";
import dayjs from "dayjs";

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
    const solicitud = await this.solicitudesRepository.getById(id);

    if (!solicitud) {
      return null;
    }

    if (solicitud.estatus.toLowerCase() === "editando") {
      const lockedAt = dayjs(solicitud.locked_at);
      const now = dayjs();
      const diff = now.diff(lockedAt, "minute");

      const lockTimeout = 5;

      if (diff > lockTimeout) {
        await this.updateEstatus(id, "abierta");
        solicitud.estatus = "abierta";
        solicitud.locked_at = null;
      }
    }

    return solicitud;
  }

  async releaseLock(id) {
    await this.updateEstatus(id, "abierta");
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
