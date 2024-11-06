// src/adapters/repository/solicitudesRepository.js
import sql from "mssql";
import config from "../../config/database.js";

class SolicitudesRepository {
  async getAll() {
    try {
      const pool = await sql.connect(config);
      const result = await pool.request().query(`
        SELECT s.id_solicitud, s.asunto, s.descripcion, s.archivos, s.usuario_solicitante, s.correo_solicitante, e.nombre AS estatus
        FROM oc.Solicitud s
        JOIN oc.Estatus e ON s.estatus_id = e.id_estatus
        WHERE s.eliminado = 0
      `);
      return result.recordset;
    } catch (error) {
      console.error(
        "Error al obtener solicitudes de la base de datos:",
        error.message
      );
      throw new Error("Error al obtener solicitudes");
    }
  }

  async getById(id) {
    try {
      const pool = await sql.connect(config);
      const result = await pool
        .request()
        .input("id", sql.Int, id)
        .query(
          `SELECT s.id_solicitud, s.asunto, s.descripcion, s.archivos, e.nombre AS estatus, s.usuario_solicitante, s.correo_solicitante, s.eliminado FROM oc.Solicitud s JOIN oc.Estatus e ON s.estatus_id = e.id_estatus WHERE id_solicitud = @id`
        );
      return result.recordset[0];
    } catch (error) {
      console.error("Error al obtener solicitud:", error.message);
      throw new Error("Error al obtener solicitud");
    }
  }

  async saveSolicitud(solicitud) {
    try {
      const pool = await sql.connect(config);

      const defaultStatus = (
        await pool
          .request()
          .query(`SELECT id_estatus FROM oc.Estatus WHERE nombre = 'pendiente'`)
      ).recordset[0].id_estatus;

      const result = await pool
        .request()
        .input("asunto", sql.NVarChar, solicitud.asunto)
        .input("descripcion", sql.NVarChar, solicitud.descripcion)
        .input("archivos", sql.NVarChar, solicitud.archivos)
        .input("usuarioSolicitante", sql.NVarChar, solicitud.usuarioSolicitante)
        .input("correoSolicitante", sql.NVarChar, solicitud.correoSolicitante)
        .input("estatus_id", sql.TinyInt, defaultStatus).query(`
          INSERT INTO oc.Solicitud (asunto, descripcion, archivos, usuario_solicitante, correo_solicitante, estatus_id)
          VALUES (@asunto, @descripcion, @archivos, @usuarioSolicitante, @correoSolicitante, @estatus_id);
          SELECT SCOPE_IDENTITY() AS id;
        `);
      return result.recordset;
    } catch (error) {
      console.error(
        "Error al guardar la solicitud en la base de datos:",
        error.message
      );
      throw new Error("Error al guardar la solicitud");
    }
  }

  async updateSolicitud(id, { asunto, descripcion, archivos }) {
    try {
      const pool = await sql.connect(config);
      await pool
        .request()
        .input("id", sql.Int, id)
        .input("asunto", sql.NVarChar, asunto)
        .input("descripcion", sql.NVarChar, descripcion)
        .input("archivos", sql.NVarChar, archivos).query(`
          UPDATE oc.Solicitud
          SET asunto = @asunto,
              descripcion = @descripcion,
              archivos = @archivos,
              updated_at = GETDATE()
          WHERE id_solicitud = @id
        `);
    } catch (error) {
      console.error("Error al actualizar la solicitud:", error.message);
      throw new Error("Error al actualizar la solicitud");
    }
  }

  async deleteSolicitud(id, justificacion) {
    try {
      const pool = await sql.connect(config);
      await pool
        .request()
        .input("id", sql.Int, id)
        .input("justificacion", sql.NVarChar, justificacion).query(`
          UPDATE oc.Solicitud
          SET eliminado = 1, justificacion_eliminacion = @justificacion
          WHERE id_solicitud = @id
        `);
    } catch (error) {
      console.error("Error al eliminar la solicitud:", error.message);
      throw new Error("Error al eliminar la solicitud");
    }
  }
}

export default SolicitudesRepository;
