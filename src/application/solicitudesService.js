// src/application/solicitudesService.js
import SolicitudesRepository from "../adapters/repository/solicitudesRepository.js";
import OrdenesRepository from "../adapters/repository/ordenesRepository.js";

class SolicitudesService {
  constructor() {
    this.solicitudesRepository = new SolicitudesRepository();
    this.ordenesRepository = new OrdenesRepository();
  }

  async getAllSolicitudes(filtros = {}) {
    return await this.solicitudesRepository.getAllWithOrdenes(filtros);
  }

  async getOrdenesBySolicitudId(solicitudId) {
    return await this.ordenesRepository.getOrdenesBySolicitudId(solicitudId);
  }

  async getSolicitudById(id) {
    const solicitud = await this.solicitudesRepository.getById(id);
    if (!solicitud) {
      return null;
    }

    return solicitud;
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

  async getArchivedSolicitudes(filtros = {}) {
    return await this.solicitudesRepository.getArchivedSolicitudes(filtros);
  }

  async archiveSolicitud(id) {
    return await this.solicitudesRepository.archiveSolicitud(id);
  }

  async desarchiveSolicitud(id) {
    return await this.solicitudesRepository.desarchiveSolicitud(id);
  }
}

export default SolicitudesService;
