// src/controllers/solicitudesController.js
import SolicitudesService from "../application/solicitudesService.js";
import { encodeBase64, decodeBase64 } from "../utils/base64.js";
import AzureBlobService from "../services/azureBlobService.js";
import dayjs from "dayjs";
import { PassThrough } from "stream";

class SolicitudesController {
  constructor() {
    this.solicitudesService = new SolicitudesService();
  }

  getAllSolicitudes = async (req, res) => {
    try {
      const user = res.locals.user;
      const userRoles = user.roles.map((role) => role.rol.toLowerCase());
      const isSolicitante = userRoles.includes("solicitante");
      const isAdmin = userRoles.includes("admin");
      const userEmail = user.correo;

      let filtros = {};

      if (isSolicitante && !isAdmin) {
        filtros.correo_solicitante = userEmail;
      }

      const solicitudes = await this.solicitudesService.getAllSolicitudes(
        filtros
      );

      const solicitudesProcesadas = solicitudes.map((solicitud) => {
        const archivos = JSON.parse(solicitud.archivos || "[]");
        const hasActiveFiles = archivos.some((file) => file.eliminado !== 1);

        return {
          ...solicitud,
          nro_solicitud: solicitud.id_solicitud,
          id_solicitud: encodeBase64(solicitud.id_solicitud.toString()),
          archivos,
          hasActiveFiles,
          estatusLower: solicitud.estatus.toLowerCase(),
        };
      });

      res.render("solicitudes", {
        solicitudes: solicitudesProcesadas,
        user,
        successMessage: req.flash("successMessage"),
        errorMessage: req.flash("errorMessage"),
      });
    } catch (error) {
      console.error("Error al obtener solicitudes:", error);
      req.flash("errorMessage", "Error al obtener solicitudes.");
      res.redirect("/");
    }
  };

  getSolicitudById = async (req, res) => {
    try {
      const id = decodeBase64(req.params.id);
      const solicitud = await this.solicitudesService.getSolicitudById(id);

      if (!solicitud) {
        req.flash("errorMessage", "Solicitud no encontrada.");
        return res.redirect("/solicitudes");
      }

      const ordenes = Array.isArray(solicitud.ordenes) ? solicitud.ordenes : [];

      const ordenesFormateadas = ordenes.map((orden) => ({
        ...orden,
        id_orden: encodeBase64(orden.id_orden),
        ruta_archivo_pdf: orden.ruta_archivo_pdf?.replace(/^"|"$/g, ""),
        created_at: new Date(orden.created_at).toLocaleString("es-CL", {
          timeZone: "UTC",
          dateStyle: "short",
          timeStyle: "short",
        }),
      }));

      solicitud.nro_solicitud = solicitud.id_solicitud;
      solicitud.id_solicitud = encodeBase64(solicitud.id_solicitud);
      solicitud.archivos = JSON.parse(solicitud.archivos || "[]").filter(
        (archivo) => archivo.eliminado === 0
      );

      res.render("solicitud/detalle", {
        solicitud,
        ordenes: ordenesFormateadas,
        successMessage: req.flash("successMessage"),
        errorMessage: req.flash("errorMessage"),
      });
    } catch (error) {
      console.error("Error al obtener solicitud:", error);
      req.flash("errorMessage", "Error al obtener solicitud.");
      res.redirect("/solicitudes");
    }
  };

  viewOrdenesDeSolicitud = async (req, res) => {
    try {
      const id_solicitud = decodeBase64(req.params.id);
      const solicitud = await this.solicitudesService.getSolicitudById(
        id_solicitud
      );
      if (!solicitud) {
        req.flash("errorMessage", "Solicitud no encontrada.");
        return res.redirect("/solicitudes");
      }
      const ordenes = await this.solicitudesService.getOrdenesBySolicitudId(
        id_solicitud
      );
      const ordenesFormateadas = ordenes.map((orden) => ({
        ...orden,
        Encoded_id_orden: encodeBase64(orden.id_orden),
        ruta_archivo_pdf: orden.ruta_archivo_pdf?.replace(/^"|"$/g, ""),
        created_at: new Date(orden.created_at).toLocaleString("es-CL", {
          timeZone: "UTC",
          dateStyle: "short",
          timeStyle: "short",
        }),
      }));

      res.render("solicitud/ordenes", {
        solicitud,
        ordenes: ordenesFormateadas,
        successMessage: req.flash("successMessage"),
        errorMessage: req.flash("errorMessage"),
      });
    } catch (error) {
      console.error(
        "Error al obtener las órdenes de la solicitud:",
        error.message
      );
      req.flash(
        "errorMessage",
        "Error al obtener las órdenes de la solicitud."
      );
      res.redirect("/solicitudes");
    }
  };

  renderCreateForm = (req, res) => {
    res.render("solicitud/crear", {
      errors: {},
      asunto: "",
      descripcion: "",
      successMessage: req.flash("successMessage"),
      errorMessage: req.flash("errorMessage"),
    });
  };

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

      const solicitudCreada = await this.solicitudesService.createSolicitud(
        solicitudData
      );
      const solicitudId = solicitudCreada.id_solicitud;
      const solicitudIdBase64 = encodeBase64(solicitudId.toString());

      let archivosUrls = [];
      if (archivos.length > 0) {
        const fechaActual = dayjs().format("DDMMYYYY");
        const archivosParaSubir = archivos.map((file) => ({
          blobName: `${solicitudIdBase64}-${fechaActual}-${file.originalname}`,
          file,
        }));
        archivosUrls = await AzureBlobService.uploadFilesWithNames(
          archivosParaSubir
        );
      }

      if (archivosUrls.length > 0) {
        const archivosData = archivosUrls.map((url, index) => ({
          url,
          originalFileName: req.files[index].originalname,
          eliminado: 0,
        }));
        await this.solicitudesService.updateArchivosSolicitud(solicitudId, {
          archivos: archivosData,
        });
      }

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

  renderEditForm = async (req, res) => {
    try {
      const encodedId = req.params.id;
      const id = decodeBase64(encodedId);

      const solicitud = await this.solicitudesService.getSolicitudById(id);

      if (!solicitud) {
        req.flash("errorMessage", "Solicitud no encontrada.");
        return res.redirect("/solicitudes");
      }

      solicitud.nro_solicitud = solicitud.id_solicitud;
      solicitud.id_solicitud = encodeBase64(solicitud.id_solicitud);
      solicitud.archivos = JSON.parse(solicitud.archivos || "[]");

      res.render("solicitud/editar", {
        solicitud,
        errors: {},
        asunto: solicitud.asunto,
        descripcion: solicitud.descripcion,
        archivos: solicitud.archivos.filter(
          (archivo) => archivo.eliminado === 0
        ),
        successMessage: req.flash("successMessage"),
        errorMessage: req.flash("errorMessage"),
      });
    } catch (error) {
      console.error("Error al cargar el formulario de edición:", error);
      req.flash("errorMessage", "Error al cargar el formulario de edición.");
      res.redirect("/solicitudes");
    }
  };

  updateSolicitud = async (req, res) => {
    try {
      const id = decodeBase64(req.params.id);
      const { asunto, descripcion, deletedFiles } = req.body;
      const archivosNuevos = req.files || [];

      const solicitudExistente = await this.solicitudesService.getSolicitudById(
        id
      );
      if (!solicitudExistente) {
        req.flash("errorMessage", "Solicitud no encontrada.");
        return res.redirect("/solicitudes");
      }

      let archivosActuales = JSON.parse(solicitudExistente.archivos || "[]");

      if (deletedFiles) {
        const filesToDelete = JSON.parse(deletedFiles);
        archivosActuales = archivosActuales.map((archivo) => {
          if (filesToDelete.includes(archivo.url)) {
            return { ...archivo, eliminado: 1 };
          }
          return archivo;
        });
      }

      if (archivosNuevos.length > 0) {
        const fechaActual = dayjs().format("DDMMYYYY");
        const archivosParaSubir = archivosNuevos.map((file) => ({
          blobName: `${encodeBase64(id)}-${fechaActual}-${file.originalname}`,
          file,
        }));
        const archivosUrls = await AzureBlobService.uploadFilesWithNames(
          archivosParaSubir
        );

        const nuevosArchivos = archivosUrls.map((url, index) => ({
          url,
          originalFileName: archivosNuevos[index].originalname,
          eliminado: 0,
        }));
        archivosActuales = [...archivosActuales, ...nuevosArchivos];
      }

      const solicitudData = {
        asunto,
        descripcion,
        archivos: archivosActuales,
      };

      await this.solicitudesService.updateSolicitud(id, solicitudData);

      req.flash("successMessage", "Solicitud actualizada con éxito.");
      res.redirect("/solicitudes");
    } catch (error) {
      console.error("Error al actualizar la solicitud:", error);

      try {
        const id = decodeBase64(req.params.id);
        const solicitud = await this.solicitudesService.getSolicitudById(id);
        solicitud.nro_solicitud = solicitud.id_solicitud;
        solicitud.id_solicitud = encodeBase64(solicitud.id_solicitud);
        solicitud.archivos = JSON.parse(solicitud.archivos || "[]");

        res.render("solicitud/editar", {
          solicitud,
          errors: error.validationErrors || {},
          asunto: req.body.asunto,
          descripcion: req.body.descripcion,
          archivos: solicitud.archivos.filter(
            (archivo) => archivo.eliminado === 0
          ),
          successMessage: "",
          errorMessage: "Por favor, corrige los errores en el formulario.",
        });
      } catch (innerError) {
        console.error(
          "Error al manejar el error de actualización:",
          innerError
        );
        req.flash("errorMessage", "Error al actualizar la solicitud.");
        res.redirect("/solicitudes");
      }
    }
  };

  renderDeleteForm = async (req, res) => {
    try {
      const id = decodeBase64(req.params.id);
      const solicitud = await this.solicitudesService.getSolicitudById(id);

      if (!solicitud) {
        req.flash("errorMessage", "Solicitud no encontrada.");
        return res.redirect("/solicitudes");
      }

      solicitud.nro_solicitud = solicitud.id_solicitud;
      solicitud.id_solicitud = encodeBase64(solicitud.id_solicitud);

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

  deleteSolicitud = async (req, res) => {
    try {
      const id = decodeBase64(req.params.id);
      const { justificacion } = req.body;

      if (!justificacion || justificacion.trim() === "") {
        const solicitud = await this.solicitudesService.getSolicitudById(id);
        solicitud.id_solicitud = encodeBase64(solicitud.id_solicitud);
        return res.render("solicitud/eliminar", {
          solicitud,
          errors: { justificacion: "La justificación es requerida." },
          justificacion,
          successMessage: "",
          errorMessage:
            "Debe proporcionar una justificación para eliminar la solicitud.",
        });
      }

      const wordCount = justificacion
        .trim()
        .split(/\s+/)
        .filter((word) => word).length;

      if (wordCount < 5) {
        req.flash(
          "errorMessage",
          "La justificación debe tener al menos 5 palabras."
        );
        return res.redirect(`/solicitudes-eliminar/${req.params.id_solicitud}`);
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

      archivos = archivos.map((archivo) => {
        const extension = archivo.url.split(".").pop().toLowerCase();
        let iconClass = "fas fa-file text-secondary";
        let isPreviewable = false;
        let originalFileName = archivo.originalFileName || "archivo";

        if (extension === "pdf") {
          iconClass = "fas fa-file-pdf text-danger";
          isPreviewable = true;
        } else if (["jpg", "jpeg", "png"].includes(extension)) {
          iconClass = "fas fa-file-image text-info";
          isPreviewable = true;
        } else if (["doc", "docx"].includes(extension)) {
          iconClass = "fas fa-file-word text-primary";
          isPreviewable = true;
        } else if (["xls", "xlsx"].includes(extension)) {
          iconClass = "fas fa-file-excel text-success";
          isPreviewable = true;
        } else if (["ppt", "pptx"].includes(extension)) {
          iconClass = "fas fa-file-powerpoint text-danger";
          isPreviewable = true;
        }

        let sasUrl = "";
        if (isPreviewable) {
          const blobName = decodeURIComponent(archivo.url.split("/").pop());
          sasUrl = AzureBlobService.generateSasUrl(
            blobName,
            originalFileName,
            "inline"
          );
        }

        return {
          ...archivo,
          extension,
          iconClass,
          isPreviewable,
          sasUrl,
          originalFileName,
          blobName: decodeURIComponent(archivo.url.split("/").pop()),
        };
      });

      solicitud.nro_solicitud = solicitud.id_solicitud;
      solicitud.id_solicitud = encodeBase64(solicitud.id_solicitud);

      res.render("solicitud/archivos", {
        solicitud,
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

  downloadArchivo = async (req, res) => {
    try {
      const solicitudIdEncoded = req.params.id;
      const solicitudId = decodeBase64(solicitudIdEncoded);
      const blobNameEncoded = req.params.filename;
      const blobName = decodeURIComponent(blobNameEncoded);

      const usuarioActual = res.locals.user;
      if (!usuarioActual) {
        req.flash(
          "errorMessage",
          "Debes estar autenticado para descargar archivos."
        );
        return res.status(401).redirect("back");
      }

      const solicitud = await this.solicitudesService.getSolicitudById(
        solicitudId
      );
      if (!solicitud) {
        req.flash("errorMessage", "Solicitud no encontrada.");
        return res.status(404).redirect("back");
      }

      const archivos = JSON.parse(solicitud.archivos || "[]").filter(
        (archivo) => archivo.eliminado === 0
      );

      const archivoEncontrado = archivos.find(
        (archivo) =>
          decodeURIComponent(archivo.url.split("/").pop()) === blobName
      );

      if (!archivoEncontrado) {
        req.flash("errorMessage", "Archivo no encontrado en la solicitud.");
        return res.status(404).redirect("back");
      }

      const originalFilename = archivoEncontrado.originalFileName || "archivo";

      const blockBlobClient = AzureBlobService.getBlobClient(blobName);

      const exists = await blockBlobClient.exists();
      if (!exists) {
        req.flash(
          "errorMessage",
          "Archivo no encontrado en el almacenamiento."
        );
        return res.status(404).redirect("back");
      }

      const downloadOptions = {
        blobHTTPHeaders: {
          blobContentType:
            archivoEncontrado.mimetype || "application/octet-stream",
          blobContentDisposition: `attachment; filename="${originalFilename}"`,
        },
      };

      const downloadStream = await blockBlobClient.download(0);

      res.setHeader("Content-Length", downloadStream.contentLength);
      res.setHeader(
        "Content-Type",
        archivoEncontrado.mimetype || "application/octet-stream"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${originalFilename}"`
      );

      const passThrough = new PassThrough();
      downloadStream.readableStreamBody.pipe(passThrough).pipe(res);
    } catch (error) {
      console.error("Error al descargar el archivo:", error);
      req.flash("errorMessage", "Error al descargar el archivo.");
      res.redirect("back");
    }
  };

  getArchivedSolicitudes = async (req, res) => {
    try {
      const user = res.locals.user;
      const userRoles = user.roles.map((role) => role.rol.toLowerCase());
      const isSolicitante = userRoles.includes("solicitante");
      const isAdmin = userRoles.includes("admin");
      const userEmail = user.correo;

      let filtros = {};

      if (isSolicitante && !isAdmin) {
        filtros.correo_solicitante = userEmail;
      }

      const solicitudes = await this.solicitudesService.getArchivedSolicitudes(
        filtros
      );

      const solicitudesProcesadas = solicitudes.map((solicitud) => {
        const archivos = JSON.parse(solicitud.archivos || "[]");
        const hasActiveFiles = archivos.some((file) => file.eliminado !== 1);
        const estatusLower = solicitud.estatus.toLowerCase();

        let estatusClass = "";
        let estatusDisplay = solicitud.estatus;

        switch (estatusLower) {
          case "archivada":
            estatusClass = "badge-archived";
            break;
          case "abierta":
            estatusClass = "badge-open";
            break;
          case "procesada":
            estatusClass = "badge-processed";
            break;
          case "editando":
          case "procesando":
            estatusClass = "badge-editing";
            estatusDisplay =
              estatusLower.charAt(0).toUpperCase() + estatusLower.slice(1);
            break;
          case "eliminada":
            estatusClass = "badge-eliminated";
            break;
          default:
            estatusClass = "badge-secondary";
        }

        const canDesarchivar = isAdmin || isSolicitante;

        return {
          ...solicitud,
          nro_solicitud: solicitud.id_solicitud,
          id_solicitud: encodeBase64(solicitud.id_solicitud.toString()),
          archivos,
          hasActiveFiles,
          estatusLower,
          estatusClass,
          estatusDisplay,
          canDesarchivar,
        };
      });

      res.render("solicitudes-archivadas", {
        solicitudes: solicitudesProcesadas,
        user,
        successMessage: req.flash("successMessage"),
        errorMessage: req.flash("errorMessage"),
      });
    } catch (error) {
      console.error("Error al obtener solicitudes archivadas:", error);
      req.flash("errorMessage", "Error al obtener solicitudes archivadas.");
      res.redirect("/");
    }
  };

  archiveSolicitud = async (req, res) => {
    try {
      const encodedId = req.params.id;
      const id = decodeBase64(encodedId);

      const solicitud = await this.solicitudesService.getSolicitudById(id);

      if (!solicitud) {
        req.flash("errorMessage", "Solicitud no encontrada.");
        return res.redirect("/solicitudes");
      }

      if (solicitud.archivado === true) {
        req.flash("errorMessage", "La solicitud ya está archivada.");
        return res.redirect("/solicitudes");
      }

      await this.solicitudesService.archiveSolicitud(id);

      req.flash("successMessage", "Solicitud archivada con éxito.");
      res.redirect("/solicitudes");
    } catch (error) {
      console.error("Error al archivar la solicitud:", error);
      req.flash("errorMessage", "Error al archivar la solicitud.");
      res.redirect("/solicitudes");
    }
  };

  desarchiveSolicitud = async (req, res) => {
    try {
      const encodedId = req.params.id;
      const id = decodeBase64(encodedId);

      const solicitud = await this.solicitudesService.getSolicitudById(id);
      if (!solicitud) {
        req.flash("errorMessage", "Solicitud no encontrada.");
        return res.redirect("/solicitudes-archivadas");
      }

      if (solicitud.archivado === 0) {
        req.flash("errorMessage", "La solicitud ya está activa.");
        return res.redirect("/solicitudes-archivadas");
      }

      await this.solicitudesService.desarchiveSolicitud(id);

      req.flash("successMessage", "Solicitud desarchivada con éxito.");
      res.redirect("/solicitudes-archivadas");
    } catch (error) {
      console.error("Error al desarchivar la solicitud:", error);
      req.flash("errorMessage", "Error al desarchivar la solicitud.");
      res.redirect("/solicitudes-archivadas");
    }
  };
}

export default SolicitudesController;
