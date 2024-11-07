// src/controllers/solicitudesController.js
import SolicitudesService from "../application/solicitudesService.js";
import { encodeBase64, decodeBase64 } from "../utils/base64.js";
import AzureBlobService from "../services/azureBlobService.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

class SolicitudesController {
  constructor() {
    this.solicitudesService = new SolicitudesService();
  }

  // Obtener todas las solicitudes
  getAllSolicitudes = async (req, res) => {
    try {
      const solicitudes = await this.solicitudesService.getAllSolicitudes();
      const estatusList = [
        ...new Set(solicitudes.map((s) => s.estatus)),
      ].sort();
      res.render("solicitudes", {
        solicitudes: solicitudes.map((solicitud) => ({
          ...solicitud,
          id: encodeBase64(solicitud.id_solicitud),
          hasFiles:
            solicitud.archivos &&
            JSON.parse(solicitud.archivos).filter((a) => a.eliminado === 0)
              .length > 0,
        })),
        estatusList,
        successMessage: req.flash("successMessage"),
        errorMessage: req.flash("errorMessage"),
      });
    } catch (error) {
      console.error("Error al obtener solicitudes:", error.message);
      req.flash("errorMessage", "Error al obtener solicitudes.");
      res.redirect("/");
    }
  };

  // Obtener una solicitud por ID
  getSolicitudById = async (req, res) => {
    try {
      const id = decodeBase64(req.params.id);
      const solicitud = await this.solicitudesService.getSolicitudById(id);
      solicitud.id = encodeBase64(solicitud.id_solicitud);

      try {
        solicitud.archivos = JSON.parse(solicitud.archivos).filter(
          (archivo) => archivo.eliminado === 0
        );
      } catch (e) {
        console.error("Error al parsear los archivos:", e);
        solicitud.archivos = [];
      }

      res.render("solicitud/detalle", { solicitud });
    } catch (error) {
      console.error("Error al obtener solicitud:", error.message);
      req.flash("errorMessage", "Error al obtener solicitud.");
      res.redirect("/solicitudes");
    }
  };

  // Renderizar el formulario de creación
  renderCreateForm = (req, res) => {
    res.render("solicitud/crear", {
      errors: {},
      errorMessage: req.flash("errorMessage"),
      successMessage: req.flash("successMessage"),
      asunto: "",
      descripcion: "",
    });
  };

  // Crear una nueva solicitud
  createSolicitud = async (req, res) => {
    try {
      const { asunto, descripcion } = req.body;
      const archivos = req.files || [];
      const { nombre, apellido, correo } = res.locals.user || {};

      const solicitudDataInitial = {
        asunto,
        descripcion,
        archivos: JSON.stringify([]),
        usuarioSolicitante: `${nombre} ${apellido}`,
        correoSolicitante: correo,
      };

      const insertedSolicitud = await this.solicitudesService.createSolicitud(
        solicitudDataInitial
      );
      const idSolicitud = insertedSolicitud[0].id_solicitud;
      const idsolicitudencodeado = encodeBase64(idSolicitud);

      let archivosAdjuntos = [];
      if (archivos.length > 0) {
        const fechaActual = dayjs().format("DDMMYYYY");
        const archivosParaSubir = archivos.map((file) => ({
          blobName: `${idsolicitudencodeado}-${fechaActual}-${file.originalname}`,
          file,
        }));

        const archivosUrls = await AzureBlobService.uploadFilesWithNames(
          archivosParaSubir
        );
        archivosAdjuntos = archivosUrls.map((url) => ({
          url,
          eliminado: 0,
        }));
      }

      const archivosJson = JSON.stringify(archivosAdjuntos);

      const solicitudDataUpdate = {
        asunto,
        descripcion,
        archivos: archivosJson,
      };

      await this.solicitudesService.updateSolicitud(
        idSolicitud,
        solicitudDataUpdate
      );

      req.flash("successMessage", "Solicitud creada con éxito");
      res.redirect("/solicitudes");
    } catch (error) {
      console.error("Error al crear solicitud:", error.message);
      if (error.validationErrors) {
        res.render("solicitud/crear", {
          errors: error.validationErrors,
          errorMessage: "Por favor, corrige los errores en el formulario.",
          successMessage: "",
          asunto: req.body.asunto,
          descripcion: req.body.descripcion,
        });
      } else if (error.message === "Tipo de archivo no permitido") {
        res.render("solicitud/crear", {
          errors: { archivos: error.message },
          errorMessage: error.message,
          successMessage: "",
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

  // Renderizar el formulario de edición
  renderEditForm = async (req, res) => {
    try {
      const id = decodeBase64(req.params.id);
      const solicitud = await this.solicitudesService.getSolicitudById(id);
      solicitud.id = encodeBase64(solicitud.id_solicitud);
      res.render("solicitud/editar", {
        solicitud,
        errors: {},
        errorMessage: req.flash("errorMessage"),
        successMessage: req.flash("successMessage"),
      });
    } catch (error) {
      console.error("Error al obtener solicitud para editar:", error.message);
      req.flash("errorMessage", "Error al obtener solicitud para editar.");
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
      const solicitud = await this.solicitudesService.getSolicitudById(id);
      let archivosExistentes = [];
      try {
        archivosExistentes = JSON.parse(solicitud.archivos);
      } catch (e) {
        console.error("Error al parsear los archivos existentes:", e);
        archivosExistentes = [];
      }

      // Marcar archivos eliminados
      let archivosActualizados = archivosExistentes.map((archivo) => {
        if (deletedFiles && JSON.parse(deletedFiles).includes(archivo.url)) {
          return { ...archivo, eliminado: 1 };
        }
        return archivo;
      });

      const archivosParaEliminar = archivosExistentes.filter(
        (archivo) =>
          deletedFiles && JSON.parse(deletedFiles).includes(archivo.url)
      );

      const deletePromises = archivosParaEliminar.map((archivo) =>
        AzureBlobService.deleteBlob(archivo.url).catch((error) => {
          console.error(
            `Error al eliminar el archivo ${archivo.url}:`,
            error.message
          );
        })
      );

      await Promise.all(deletePromises);

      // Subir nuevos archivos
      let nuevosArchivosAdjuntos = [];
      if (archivosNuevos.length > 0) {
        const fechaActual = dayjs().format("DDMMYYYY");
        const archivosParaSubir = archivosNuevos.map((file) => ({
          blobName: `${encodeBase64(id)}-${fechaActual}-${file.originalname}`,
          file,
        }));

        const archivosUrls = await AzureBlobService.uploadFilesWithNames(
          archivosParaSubir
        );
        nuevosArchivosAdjuntos = archivosUrls.map((url) => ({
          url,
          eliminado: 0,
        }));
      }

      // Combinar archivos existentes (no eliminados) con nuevos archivos
      const archivosFinales = [
        ...archivosActualizados.filter((archivo) => archivo.eliminado === 0),
        ...nuevosArchivosAdjuntos,
      ];

      const archivosJson = JSON.stringify(archivosFinales);

      // Actualizar la solicitud
      const solicitudData = {
        asunto,
        descripcion,
        archivos: archivosJson,
      };

      await this.solicitudesService.updateSolicitud(id, solicitudData);

      req.flash("successMessage", "Solicitud actualizada con éxito");
      res.redirect("/solicitudes");
    } catch (error) {
      console.error("Error al actualizar la solicitud:", error.message);
      if (error.validationErrors) {
        const id = decodeBase64(req.params.id);
        const solicitud = await this.solicitudesService.getSolicitudById(id);
        solicitud.id = encodeBase64(solicitud.id_solicitud);
        solicitud.asunto = req.body.asunto;
        solicitud.descripcion = req.body.descripcion;
        solicitud.archivos = req.body.archivos || "[]";
        res.render("solicitud/editar", {
          solicitud,
          errors: error.validationErrors,
          errorMessage: "Por favor, corrige los errores en el formulario.",
          successMessage: "",
        });
      } else if (error.message === "Tipo de archivo no permitido") {
        res.render("solicitud/editar", {
          solicitud: {
            ...req.body,
            id: req.params.id,
          },
          errors: { archivos: error.message },
          errorMessage: error.message,
          successMessage: "",
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

  // Renderizar el formulario de eliminación
  renderDeleteForm = async (req, res) => {
    try {
      const id = decodeBase64(req.params.id);
      const solicitud = await this.solicitudesService.getSolicitudById(id);
      solicitud.id = encodeBase64(solicitud.id_solicitud);
      res.render("solicitud/eliminar", {
        solicitud,
        errors: {},
        errorMessage: req.flash("errorMessage"),
        successMessage: req.flash("successMessage"),
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

  // Eliminar una solicitud
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

      const solicitud = await this.solicitudesService.getSolicitudById(id);
      let archivos = [];
      try {
        archivos = JSON.parse(solicitud.archivos).filter(
          (archivo) => archivo.eliminado === 0
        );
      } catch (e) {
        console.error("Error al parsear los archivos:", e);
        archivos = [];
      }

      const deletePromises = archivos.map((archivo) =>
        AzureBlobService.deleteBlob(archivo.url)
          .then(() => ({ status: "fulfilled", archivo }))
          .catch((error) => ({ status: "rejected", archivo, error }))
      );

      const results = await Promise.all(deletePromises);

      const failedDeletes = results.filter(
        (result) => result.status === "rejected"
      );

      if (failedDeletes.length > 0) {
        const successfulDeletes = results.filter(
          (result) => result.status === "fulfilled"
        );

        const rollbackPromises = successfulDeletes.map((result) =>
          AzureBlobService.uploadFile({
            originalname: result.archivo.url.split("/").pop(),
            buffer: Buffer.from([]),
          }).catch((error) => {
            console.error(
              `Error al intentar rollback del blob ${result.archivo.url}:`,
              error.message
            );
          })
        );

        await Promise.all(rollbackPromises);

        req.flash(
          "errorMessage",
          `Error al eliminar algunos archivos: ${failedDeletes
            .map((fd) => fd.archivo.url)
            .join(", ")}. La solicitud no fue eliminada.`
        );
        return res.redirect("/solicitudes");
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

  // Ver los archivos adjuntos de una solicitud
  viewArchivos = async (req, res) => {
    try {
      const id = decodeBase64(req.params.id);
      const solicitud = await this.solicitudesService.getSolicitudById(id);

      if (!solicitud.archivos) {
        req.flash(
          "errorMessage",
          "No hay archivos adjuntos para esta solicitud."
        );
        return res.redirect("/solicitudes");
      }

      let archivos = [];
      try {
        archivos = JSON.parse(solicitud.archivos).filter(
          (archivo) => archivo.eliminado === 0
        );
      } catch (e) {
        console.error("Error al parsear los archivos:", e);
        archivos = [];
      }

      res.render("solicitud/archivos", { archivos });
    } catch (error) {
      console.error("Error al obtener archivos:", error.message);
      req.flash("errorMessage", "Error al obtener archivos.");
      res.redirect("/solicitudes");
    }
  };

  // Eliminar un archivo de una solicitud
  eliminarArchivo = async (req, res) => {
    try {
      const idSolicitud = decodeBase64(req.params.id);
      const { urlArchivo } = req.body;

      if (!urlArchivo) {
        req.flash("errorMessage", "URL del archivo no proporcionada.");
        return res.redirect(`/solicitudes/${req.params.id}`);
      }

      await AzureBlobService.deleteBlob(urlArchivo);

      await this.solicitudesService.marcarArchivoComoEliminado(
        idSolicitud,
        urlArchivo
      );

      req.flash("successMessage", "Archivo eliminado con éxito.");
      res.redirect(`/solicitudes/${req.params.id}`);
    } catch (error) {
      console.error("Error al eliminar archivo:", error.message);
      req.flash("errorMessage", "Error al eliminar el archivo.");
      res.redirect(`/solicitudes/${req.params.id}`);
    }
  };
}

export default SolicitudesController;
