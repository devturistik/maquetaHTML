// src/application/solicitudesService.js
import SolicitudesRepository from "../adapters/repository/solicitudesRepository.js";
import OrdenesRepository from "../adapters/repository/ordenesRepository.js";
import dayjs from "dayjs";

class SolicitudesService {
  constructor() {
    this.solicitudesRepository = new SolicitudesRepository();
    this.ordenesRepository = new OrdenesRepository();
  }

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

  async getAllSolicitudes() {
    const solicitudes = await this.solicitudesRepository.getAllWithOrdenes();
    return solicitudes;
  }

  async getOrdenesBySolicitudId(solicitudId) {
    return await this.ordenesRepository.getOrdenesBySolicitudId(solicitudId);
  }

  async getSolicitudById(id) {
    const solicitud = await this.solicitudesRepository.getById(id);

    if (!solicitud) {
      return null;
    }

    const estatusLower = solicitud.estatus.toLowerCase();

    if (estatusLower === "editando" || estatusLower === "procesando") {
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

  async createSolicitud(solicitudData) {
    return await this.solicitudesRepository.saveSolicitud(solicitudData);
  }

  async updateSolicitud(id, solicitudData) {
    return await this.solicitudesRepository.updateSolicitud(id, solicitudData);
  }

  async updateEstatus(id, nuevoEstatus, locked_at = null) {
    return await this.solicitudesRepository.updateEstatus(
      id,
      nuevoEstatus,
      locked_at
    );
  }

  async deleteSolicitud(id, justificacion) {
    return await this.solicitudesRepository.deleteSolicitud(id, justificacion);
  }

  async updateArchivosSolicitud(solicitudId, archivos) {
    return await this.solicitudesRepository.updateArchivosSolicitud(
      solicitudId,
      archivos
    );
  }
}

export default SolicitudesService;
