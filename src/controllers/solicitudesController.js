// src/controllers/solicitudesController.js
import SolicitudesService from "../application/solicitudesService.js";
import { encodeBase64, decodeBase64 } from "../utils/base64.js";
import AzureBlobService from "../services/azureBlobService.js";
import dayjs from "dayjs";

class SolicitudesController {
  constructor() {
    this.solicitudesService = new SolicitudesService();
  }

  // Obtener todas las solicitudes
  getAllSolicitudes = async (req, res) => {
    try {
      const solicitudes = await this.solicitudesService.getAllSolicitudes();
      res.render("solicitudes", {
        solicitudes: solicitudes.map((solicitud) => ({
          ...solicitud,
          id: encodeBase64(solicitud.id_solicitud),
          hasFiles:
            solicitud.archivos &&
            JSON.parse(solicitud.archivos).some((a) => a.eliminado === 0),
          created_at: dayjs(solicitud.created_at).format("DD/MM/YYYY"),
        })),
        successMessage: req.flash("successMessage"),
        errorMessage: req.flash("errorMessage"),
      });
    } catch (error) {
      console.error("Error al obtener solicitudes:", error);
      req.flash("errorMessage", "Error al obtener solicitudes.");
      res.redirect("/");
    }
  };

  // Obtener una solicitud por ID
  getSolicitudById = async (req, res) => {
    try {
      const id = decodeBase64(req.params.id);
      const solicitud = await this.solicitudesService.getSolicitudById(id);
      if (!solicitud) {
        req.flash("errorMessage", "Solicitud no encontrada.");
        return res.redirect("/solicitudes");
      }

      solicitud.id = encodeBase64(solicitud.id_solicitud);
      solicitud.archivos = JSON.parse(solicitud.archivos || "[]").filter(
        (archivo) => archivo.eliminado === 0
      );

      res.render("solicitud/detalle", {
        solicitud,
        successMessage: req.flash("successMessage"),
        errorMessage: req.flash("errorMessage"),
      });
    } catch (error) {
      console.error("Error al obtener solicitud:", error);
      req.flash("errorMessage", "Error al obtener solicitud.");
      res.redirect("/solicitudes");
    }
  };

  // Renderizar el formulario de creación
  renderCreateForm = (req, res) => {
    res.render("solicitud/crear", {
      errors: {},
      asunto: "",
      descripcion: "",
      successMessage: req.flash("successMessage"),
      errorMessage: req.flash("errorMessage"),
    });
  };

  // Crear una nueva solicitud
  createSolicitud = async (req, res) => {
    try {
      const { asunto, descripcion } = req.body;
      const archivos = req.files || [];
      const { nombre, apellido, correo } = res.locals.user || {};

      const solicitudData = {
        asunto,
        descripcion,
        archivos: [],
        usuarioSolicitante: `${nombre} ${apellido}`,
        correoSolicitante: correo,
      };

      // Validación de datos de entrada
      const validationErrors =
        this.solicitudesService.validateSolicitudData(solicitudData);
      if (validationErrors) {
        throw { validationErrors };
      }

      // Subir archivos a Azure Blob Storage
      if (archivos.length > 0) {
        const fechaActual = dayjs().format("DDMMYYYY");
        const archivosParaSubir = archivos.map((file) => ({
          blobName: `${idsolicitudencodeado}-${fechaActual}-${file.originalname}`,
          file,
        }));

        const archivosUrls = await AzureBlobService.uploadFilesWithNames(
          archivosParaSubir
        );
        solicitudData.archivos = archivosUrls.map((url) => ({
          url,
          eliminado: 0,
        }));
      }

      // Crear la solicitud en la base de datos
      await this.solicitudesService.createSolicitud(solicitudData);

      req.flash("successMessage", "Solicitud creada con éxito.");
      res.redirect("/solicitudes");
    } catch (error) {
      console.error("Error al crear solicitud:", error);
      if (error.validationErrors) {
        res.render("solicitud/crear", {
          errors: error.validationErrors,
          asunto: req.body.asunto,
          descripcion: req.body.descripcion,
          successMessage: "",
          errorMessage: "Por favor, corrige los errores en el formulario.",
        });
      } else {
        req.flash("errorMessage", "Error al crear la solicitud.");
        res.redirect("/solicitudes");
      }
    }
  };

  // Renderizar el formulario de edición
  renderEditForm = async (req, res) => {
    try {
      const id = decodeBase64(req.params.id);
      const solicitud = await this.solicitudesService.getSolicitudById(id);
      if (!solicitud) {
        req.flash("errorMessage", "Solicitud no encontrada.");
        return res.redirect("/solicitudes");
      }

      // Verificar si la solicitud está en estado 'Abierta' antes de cambiar a 'Editando'
      if (solicitud.estatus.toLowerCase() === "abierta") {
        await this.solicitudesService.updateEstatus(id, "editando");
        solicitud.estatus = "Editando"; // Actualizar el estatus en el objeto solicitud
      }

      solicitud.archivos = JSON.parse(solicitud.archivos || "[]");
      solicitud.id = encodeBase64(solicitud.id_solicitud);

      res.render("solicitud/editar", {
        solicitud,
        errors: {},
        successMessage: req.flash("successMessage"),
        errorMessage: req.flash("errorMessage"),
      });
    } catch (error) {
      console.error("Error al cargar el formulario de edición:", error);
      req.flash("errorMessage", "Error al cargar el formulario de edición.");
      res.redirect("/solicitudes");
    }
  };

  // Actualizar una solicitud existente
  updateSolicitud = async (req, res) => {
    try {
      const id = decodeBase64(req.params.id);
      const { asunto, descripcion, deletedFiles } = req.body;
      const archivosNuevos = req.files || [];

      // Obtener la solicitud existente
      const solicitudExistente = await this.solicitudesService.getSolicitudById(
        id
      );
      if (!solicitudExistente) {
        req.flash("errorMessage", "Solicitud no encontrada.");
        return res.redirect("/solicitudes");
      }

      let archivosActuales = JSON.parse(solicitudExistente.archivos || "[]");

      // Marcar archivos eliminados
      if (deletedFiles) {
        const filesToDelete = JSON.parse(deletedFiles);
        archivosActuales = archivosActuales.map((archivo) => {
          if (filesToDelete.includes(archivo.url)) {
            return { ...archivo, eliminado: 1 };
          }
          return archivo;
        });

        // Eliminar archivos de Azure Blob Storage
        // const deletePromises = archivosActuales
        //   .filter((archivo) => archivo.eliminado === 1)
        //   .map((archivo) =>
        //     AzureBlobService.deleteBlob(archivo.url).catch((err) => {
        //       console.error(`Error al eliminar archivo ${archivo.url}:`, err);
        //     })
        //   );

        // await Promise.all(deletePromises);
      }

      // Subir nuevos archivos
      if (archivosNuevos.length > 0) {
        const fechaActual = dayjs().format("DDMMYYYY");
        const archivosParaSubir = archivosNuevos.map((file) => ({
          blobName: `${encodeBase64(id)}-${fechaActual}-${file.originalname}`,
          file,
        }));

        const archivosUrls = await AzureBlobService.uploadFilesWithNames(
          archivosParaSubir
        );
        const nuevosArchivos = archivosUrls.map((url) => ({
          url,
          eliminado: 0,
        }));

        archivosActuales = [...archivosActuales, ...nuevosArchivos];
      }

      // Actualizar la solicitud
      const solicitudData = {
        asunto,
        descripcion,
        archivos: archivosActuales,
      };

      // Validación de datos de entrada
      const validationErrors =
        this.solicitudesService.validateSolicitudData(solicitudData);
      if (validationErrors) {
        throw { validationErrors };
      }

      await this.solicitudesService.updateSolicitud(id, solicitudData);
      await this.solicitudesService.updateEstatus(id, "abierta");

      req.flash("successMessage", "Solicitud actualizada con éxito.");
      res.redirect("/solicitudes");
    } catch (error) {
      console.error("Error al actualizar la solicitud:", error);
      if (error.validationErrors) {
        res.render("solicitud/editar", {
          solicitud: {
            ...req.body,
            id: req.params.id,
          },
          errors: error.validationErrors,
          successMessage: "",
          errorMessage: "Por favor, corrige los errores en el formulario.",
        });
      } else {
        req.flash("errorMessage", "Error al actualizar la solicitud.");
        res.redirect("/solicitudes");
      }
    }
  };

  cancelarEdicion = async (req, res) => {
    try {
      const id = decodeBase64(req.params.id);
      await this.solicitudesService.updateEstatus(id, 'abierta');
      req.flash("successMessage", "Edición cancelada.");
      res.redirect("/solicitudes");
    } catch (error) {
      console.error("Error al cancelar la edición:", error);
      req.flash("errorMessage", "Error al cancelar la edición.");
      res.redirect("/solicitudes");
    }
  };

  // Renderizar el formulario de eliminación
  renderDeleteForm = async (req, res) => {
    try {
      const id = decodeBase64(req.params.id);
      const solicitud = await this.solicitudesService.getSolicitudById(id);
      if (!solicitud) {
        req.flash("errorMessage", "Solicitud no encontrada.");
        return res.redirect("/solicitudes");
      }

      solicitud.id = encodeBase64(solicitud.id_solicitud);

      res.render("solicitud/eliminar", {
        solicitud,
        errors: {},
        justificacion: "",
        successMessage: req.flash("successMessage"),
        errorMessage: req.flash("errorMessage"),
      });
    } catch (error) {
      console.error("Error al cargar el formulario de eliminación:", error);
      req.flash(
        "errorMessage",
        "Error al cargar el formulario de eliminación."
      );
      res.redirect("/solicitudes");
    }
  };

  // Eliminar una solicitud
  deleteSolicitud = async (req, res) => {
    try {
      const id = decodeBase64(req.params.id);
      const { justificacion } = req.body;

      if (!justificacion || justificacion.trim() === "") {
        const solicitud = await this.solicitudesService.getSolicitudById(id);
        solicitud.id = encodeBase64(solicitud.id_solicitud);
        return res.render("solicitud/eliminar", {
          solicitud,
          errors: { justificacion: "La justificación es requerida." },
          justificacion,
          successMessage: "",
          errorMessage:
            "Debe proporcionar una justificación para eliminar la solicitud.",
        });
      }

      await this.solicitudesService.deleteSolicitud(id, justificacion);
      await this.solicitudesService.updateEstatus(id, "eliminada");

      req.flash("successMessage", "Solicitud eliminada con éxito.");
      res.redirect("/solicitudes");
    } catch (error) {
      console.error("Error al eliminar la solicitud:", error);
      req.flash("errorMessage", "Error al eliminar la solicitud.");
      res.redirect("/solicitudes");
    }
  };

  // Ver los archivos adjuntos de una solicitud
  viewArchivos = async (req, res) => {
    try {
      const id = decodeBase64(req.params.id);
      const solicitud = await this.solicitudesService.getSolicitudById(id);
      if (!solicitud) {
        req.flash("errorMessage", "Solicitud no encontrada.");
        return res.redirect("/solicitudes");
      }

      let archivos = JSON.parse(solicitud.archivos || "[]").filter(
        (archivo) => archivo.eliminado === 0
      );

      res.render("solicitud/archivos", {
        archivos,
        successMessage: req.flash("successMessage"),
        errorMessage: req.flash("errorMessage"),
      });
    } catch (error) {
      console.error("Error al obtener archivos:", error);
      req.flash("errorMessage", "Error al obtener archivos.");
      res.redirect("/solicitudes");
    }
  };
}

export default SolicitudesController;
