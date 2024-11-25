// src/application/solicitudesService.js
import SolicitudesRepository from "../adapters/repository/solicitudesRepository.js";
import OrdenesRepository from "../adapters/repository/ordenesRepository.js";
import dayjs from "dayjs";

class SolicitudesService {
  constructor() {
    this.solicitudesRepository = new SolicitudesRepository();
    this.ordenesRepository = new OrdenesRepository();
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
    const solicitudesRaw = await this.solicitudesRepository.getAllWithOrdenes();
    const solicitudesMap = {};

    solicitudesRaw.forEach((solicitud) => {
      const solicitudId = solicitud.id_solicitud;
      if (!solicitudesMap[solicitudId]) {
        solicitudesMap[solicitudId] = {
          id_solicitud: solicitud.id_solicitud,
          asunto: solicitud.asunto,
          descripcion: solicitud.descripcion,
          archivos: solicitud.archivos,
          usuario_solicitante: solicitud.usuario_solicitante,
          correo_solicitante: solicitud.correo_solicitante,
          created_at: solicitud.created_at,
          estatus: solicitud.estatus,
          ordenes: [],
        };
      }
      if (solicitud.id_orden) {
        solicitudesMap[solicitudId].ordenes.push({
          id_orden: solicitud.id_orden,
          detalle: solicitud.detalle,
        });
      }
    });

    const solicitudes = Object.values(solicitudesMap);

    return solicitudes;
  }

  async getOrdenesBySolicitudId(solicitudId) {
    return await this.ordenesRepository.getOrdenesBySolicitudId(solicitudId);
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

  async updateArchivosSolicitud(solicitudId, archivos) {
    return await this.solicitudesRepository.updateArchivosSolicitud(
      solicitudId,
      archivos
    );
  }
}

export default SolicitudesService;
