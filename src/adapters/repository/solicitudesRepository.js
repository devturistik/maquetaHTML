// src/adapters/repository/solicitudesRepository.js
import sql from "mssql";
import config from "../../config/database.js";

class SolicitudesRepository {
  // Obtener todas las solicitudes no eliminadas
  async getAll() {
    try {
      const pool = await sql.connect(config);
      const result = await pool.request().query(`
        SELECT s.id_solicitud, s.asunto, s.descripcion, s.archivos, s.usuario_solicitante, s.correo_solicitante, s.created_at, e.nombre AS estatus
        FROM oc.Solicitud s
        JOIN oc.Estatus e ON s.estatus_id = e.id_estatus
        WHERE s.eliminado = 0
        ORDER BY s.created_at DESC
      `);
      return result.recordset;
    } catch (error) {
      console.error("Error al obtener solicitudes de la base de datos:", error);
      throw error;
    }
  }

  // Obtener una solicitud por ID
  async getById(id) {
    try {
      const pool = await sql.connect(config);
      const result = await pool.request().input("id", sql.Int, id).query(`
          SELECT s.id_solicitud, s.asunto, s.descripcion, s.archivos, e.nombre AS estatus, s.usuario_solicitante, s.correo_solicitante, s.eliminado
          FROM oc.Solicitud s
          JOIN oc.Estatus e ON s.estatus_id = e.id_estatus
          WHERE s.id_solicitud = @id
        `);
      return result.recordset[0];
    } catch (error) {
      console.error("Error al obtener solicitud:", error);
      throw error;
    }
  }

  // Guardar una nueva solicitud
  async saveSolicitud(solicitud) {
    try {
      const pool = await sql.connect(config);

      const defaultStatusResult = await pool
        .request()
        .query(`SELECT id_estatus FROM oc.Estatus WHERE nombre = 'abierta'`);

      const defaultStatus = defaultStatusResult.recordset[0].id_estatus;

      const result = await pool
        .request()
        .input("asunto", sql.NVarChar, solicitud.asunto)
        .input("descripcion", sql.NVarChar, solicitud.descripcion)
        .input("archivos", sql.NVarChar, JSON.stringify(solicitud.archivos))
        .input("usuarioSolicitante", sql.NVarChar, solicitud.usuarioSolicitante)
        .input("correoSolicitante", sql.NVarChar, solicitud.correoSolicitante)
        .input("estatus_id", sql.TinyInt, defaultStatus).query(`
          INSERT INTO oc.Solicitud (asunto, descripcion, archivos, usuario_solicitante, correo_solicitante, estatus_id)
          VALUES (@asunto, @descripcion, @archivos, @usuarioSolicitante, @correoSolicitante, @estatus_id);
          SELECT SCOPE_IDENTITY() AS id_solicitud;
        `);
      return result.recordset[0];
    } catch (error) {
      console.error(
        "Error al guardar la solicitud en la base de datos:",
        error
      );
      throw error;
    }
  }

  // Actualizar una solicitud existente
  async updateSolicitud(id, solicitudData) {
    try {
      const pool = await sql.connect(config);
      await pool
        .request()
        .input("id", sql.Int, id)
        .input("asunto", sql.NVarChar, solicitudData.asunto)
        .input("descripcion", sql.NVarChar, solicitudData.descripcion)
        .input("archivos", sql.NVarChar, JSON.stringify(solicitudData.archivos))
        .query(`
          UPDATE oc.Solicitud
          SET asunto = @asunto,
              descripcion = @descripcion,
              archivos = @archivos,
              updated_at = GETDATE()
          WHERE id_solicitud = @id
        `);
    } catch (error) {
      console.error("Error al actualizar la solicitud:", error);
      throw error;
    }
  }

  async updateEstatus(id, nuevoEstatus) {
    try {
      const pool = await sql.connect(config);
      const estatusResult = await pool
        .request()
        .input("nombre", sql.NVarChar, nuevoEstatus)
        .query(
          `SELECT id_estatus FROM oc.Estatus WHERE LOWER(nombre) = LOWER(@nombre)`
        );

      if (estatusResult.recordset.length === 0) {
        throw new Error(`Estatus '${nuevoEstatus}' no encontrado`);
      }

      const estatusId = estatusResult.recordset[0].id_estatus;

      await pool
        .request()
        .input("id", sql.Int, id)
        .input("estatus_id", sql.TinyInt, estatusId).query(`
        UPDATE oc.Solicitud
        SET estatus_id = @estatus_id,
            updated_at = GETDATE()
        WHERE id_solicitud = @id
      `);
    } catch (error) {
      console.error("Error al actualizar el estatus de la solicitud:", error);
      throw error;
    }
  }

  // Eliminar una solicitud (marcar como eliminado)
  async deleteSolicitud(id, justificacion) {
    try {
      const pool = await sql.connect(config);
      await pool
        .request()
        .input("id", sql.Int, id)
        .input("justificacion", sql.NVarChar, justificacion).query(`
          UPDATE oc.Solicitud
          SET eliminado = 1,
              justificacion_eliminacion = @justificacion,
              updated_at = GETDATE()
          WHERE id_solicitud = @id
        `);
    } catch (error) {
      console.error("Error al eliminar la solicitud:", error);
      throw error;
    }
  }
}

export default SolicitudesRepository;
