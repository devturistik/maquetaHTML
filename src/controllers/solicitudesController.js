// src/controllers/solicitudesController.js
import SolicitudesService from "../application/solicitudesService.js";
import { encodeBase64, decodeBase64 } from "../utils/base64.js";

class SolicitudesController {
  constructor() {
    this.solicitudesService = new SolicitudesService();
  }

  getAllSolicitudes = async (req, res) => {
    try {
      const solicitudes = await this.solicitudesService.getAllSolicitudes();
      res.render("solicitudes", {
        solicitudes: solicitudes.map((solicitud) => ({
          ...solicitud,
          id: encodeBase64(solicitud.id_solicitud),
        })),
        successMessage: req.query.success || null,
      });
    } catch (error) {
      console.error("Error al obtener solicitudes:", error.message);
      res.status(500).send("Error al obtener solicitudes");
    }
  };

  getSolicitudById = async (req, res) => {
    try {
      const id = decodeBase64(req.params.id);
      const solicitud = await this.solicitudesService.getSolicitudById(id);
      solicitud.id = encodeBase64(solicitud.id_solicitud);
      res.render("solicitud/detalle", { solicitud });
    } catch (error) {
      console.error("Error al obtener solicitud:", error.message);
      res.status(500).send("Error al obtener solicitud");
    }
  };

  renderCreateForm = (req, res) => {
    res.render("solicitud/crear", {
      errors: {},
      errorMessage: "",
      successMessage: "",
      asunto: "",
      descripcion: "",
    });
  };

  createSolicitud = async (req, res) => {
    try {
      const { asunto, descripcion } = req.body;
      const archivos = req.files && req.files.length > 0 ? req.files : [];
      const { nombre, apellido, correo } = res.locals.user || {};

      const archivosPaths = archivos.map((file) => file.originalname);
      const archivosJson = archivosPaths.length
        ? JSON.stringify(archivosPaths)
        : JSON.stringify([]);

      const solicitudData = {
        asunto,
        descripcion,
        archivos: archivosJson,
        usuarioSolicitante: `${nombre} ${apellido}`,
        correoSolicitante: correo,
      };

      await this.solicitudesService.createSolicitud(solicitudData);

      req.flash("successMessage", "Solicitud creada con éxito");
      res.redirect("/solicitudes");
    } catch (error) {
      if (error.validationErrors) {
        res.render("solicitud/crear", {
          errors: error.validationErrors,
          errorMessage: "Por favor, corrige los errores en el formulario.",
          asunto: req.body.asunto,
          descripcion: req.body.descripcion,
        });
      } else {
        req.flash(
          "errorMessage",
          "Error al crear la solicitud: " + error.message
        );
        res.redirect("/solicitudes");
      }
    }
  };

  renderEditForm = async (req, res) => {
    try {
      const id = decodeBase64(req.params.id);
      const solicitud = await this.solicitudesService.getSolicitudById(id);
      solicitud.id = encodeBase64(solicitud.id_solicitud);
      res.render("solicitud/editar", {
        solicitud,
        errors: {},
        errorMessage: "",
        successMessage: "",
      });
    } catch (error) {
      console.error("Error al obtener solicitud para editar:", error.message);
      res.status(500).send("Error al obtener solicitud para editar");
    }
  };

  updateSolicitud = async (req, res) => {
    try {
      const id = decodeBase64(req.params.id);
      const { asunto, descripcion } = req.body;
      const archivos = req.files && req.files.length > 0 ? req.files : [];
      const archivosPaths = archivos.map((file) => file.originalname);
      const archivosJson = archivosPaths.length
        ? JSON.stringify(archivosPaths)
        : JSON.stringify([]);

      const solicitudData = {
        asunto,
        descripcion,
        archivos: archivosJson,
      };

      await this.solicitudesService.updateSolicitud(id, solicitudData);

      req.flash("successMessage", "Solicitud actualizada con éxito");
      res.redirect("/solicitudes");
    } catch (error) {
      if (error.validationErrors) {
        const solicitud = await this.solicitudesService.getSolicitudById(id);
        solicitud.id = encodeBase64(solicitud.id_solicitud);
        solicitud.asunto = req.body.asunto;
        solicitud.descripcion = req.body.descripcion;
        solicitud.archivos = req.body.archivos || "[]";
        res.render("solicitud/editar", {
          solicitud,
          errors: error.validationErrors,
          errorMessage: "Por favor, corrige los errores en el formulario.",
        });
      } else {
        req.flash(
          "errorMessage",
          "Error al actualizar la solicitud: " + error.message
        );
        res.redirect("/solicitudes");
      }
    }
  };

  renderDeleteForm = async (req, res) => {
    try {
      const id = decodeBase64(req.params.id);
      const solicitud = await this.solicitudesService.getSolicitudById(id);
      solicitud.id = encodeBase64(solicitud.id_solicitud);
      res.render("solicitud/eliminar", {
        solicitud,
        errors: {},
        errorMessage: "",
        successMessage: "",
        justificacion: "",
      });
    } catch (error) {
      console.error("Error al obtener solicitud para eliminar:", error.message);
      req.flash(
        "errorMessage",
        "Error al cargar el formulario de eliminación."
      );
      res.redirect("/solicitudes");
    }
  };

  deleteSolicitud = async (req, res) => {
    try {
      const id = decodeBase64(req.params.id);
      const { justificacion } = req.body;

      if (!justificacion || justificacion.trim() === "") {
        const solicitud = await this.solicitudesService.getSolicitudById(id);
        solicitud.id = encodeBase64(solicitud.id_solicitud);
        res.render("solicitud/eliminar", {
          solicitud,
          errors: { justificacion: "La justificación es requerida." },
          errorMessage:
            "Debe proporcionar una justificación para eliminar la solicitud.",
          justificacion,
        });
        return;
      }

      await this.solicitudesService.deleteSolicitud(id, justificacion);

      req.flash("successMessage", "Solicitud eliminada con éxito");
      res.redirect("/solicitudes");
    } catch (error) {
      console.error("Error al eliminar la solicitud:", error.message);
      req.flash(
        "errorMessage",
        "Error al eliminar la solicitud: " + error.message
      );
      res.redirect("/solicitudes");
    }
  };
}

export default SolicitudesController;
