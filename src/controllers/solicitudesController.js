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
      const ordenes = await this.solicitudesService.getOrdenesBySolicitudId(id);
      const ordenesFormateadas = ordenes.map((orden) => ({
        ...orden,
        Encoded_id_orden: encodeBase64(orden.ID_ORDEN),
        codigo: orden.CODIGO.match(/(?<=OC-)\d+/)[0],
        ruta_archivo_pdf: orden.RUTA_ARCHIVO_PDF?.replace(/^"|"$/g, ""),
        created_at: new Date(orden.CREATED_AT).toLocaleString("es-CL", {
          timeZone: "UTC",
          dateStyle: "short",
          timeStyle: "short",
        }),
        estatus: orden.ESTATUS,
      }));

      solicitud.id = encodeBase64(solicitud.id_solicitud);
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
        Encoded_id_orden: encodeBase64(orden.ID_ORDEN),
        codigo: orden.CODIGO.match(/(?<=OC-)\d+/)[0],
        ruta_archivo_pdf: orden.RUTA_ARCHIVO_PDF?.replace(/^"|"$/g, ""),
        created_at: new Date(orden.CREATED_AT).toLocaleString("es-CL", {
          timeZone: "UTC",
          dateStyle: "short",
          timeStyle: "short",
        }),
        estatus: orden.ESTATUS,
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

      const validationErrors =
        this.solicitudesService.validateSolicitudData(solicitudData);
      if (validationErrors) {
        throw { validationErrors };
      }

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
        const archivosData = archivosUrls.map((url) => ({
          url,
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

  // Renderizar el formulario de edición
  renderEditForm = async (req, res) => {
    try {
      const encodedId = req.params.id;
      const id = decodeBase64(encodedId);
      const solicitud = await this.solicitudesService.getSolicitudById(id);

      if (!solicitud) {
        req.flash("errorMessage", "Solicitud no encontrada.");
        return res.redirect("/solicitudes");
      }

      if (solicitud.estatus.toLowerCase() === "editando") {
        req.flash(
          "errorMessage",
          "La solicitud está siendo editada por otro usuario."
        );
        return res.redirect("/solicitudes");
      }

      await this.solicitudesService.updateEstatus(id, "editando");

      solicitud.estatus = "editando";
      solicitud.locked_at = dayjs().format();

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
      await this.solicitudesService.updateEstatus(id, "abierta");
      req.flash("successMessage", "Edición cancelada.");
      res.redirect("/solicitudes");
    } catch (error) {
      console.error("Error al cancelar la edición:", error);
      req.flash("errorMessage", "Error al cancelar la edición.");
      res.redirect("/solicitudes");
    }
  };

  liberarEdicion = async (req, res) => {
    try {
      const encodedId = req.params.id;
      const id = decodeBase64(encodedId);
      await this.solicitudesService.releaseLock(id);
      res.status(200).json({ message: "Bloqueo liberado." });
    } catch (error) {
      console.error("Error al liberar el bloqueo de edición:", error);
      res
        .status(500)
        .json({ message: "Error al liberar el bloqueo de edición." });
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

      archivos = await Promise.all(
        archivos.map(async (archivo) => {
          const extension = archivo.url.split(".").pop().toLowerCase();
          const isPreviewable = [
            "pdf",
            "jpg",
            "jpeg",
            "png",
            "doc",
            "docx",
            "xls",
            "xlsx",
            "ppt",
            "pptx",
          ].includes(extension);

          if (isPreviewable) {
            const url = new URL(archivo.url);
            const blobName = decodeURIComponent(url.pathname.split("/").pop());

            const sasUrl = AzureBlobService.generateSasUrl(blobName);

            return {
              ...archivo,
              sasUrl,
            };
          } else {
            return archivo;
          }
        })
      );

      res.render("solicitud/archivos", {
        solicitudId: encodeBase64(solicitud.id_solicitud),
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
      const solicitudId = decodeBase64(req.params.id);
      const filenameEncoded = req.params.filename;
      const filename = decodeURIComponent(filenameEncoded);
      const blobName = filename;

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

      const blobParts = blobName.split("-");
      if (blobParts.length < 3) {
        req.flash("errorMessage", "Nombre de archivo inválido.");
        return res.status(400).redirect("back");
      }
      const originalFilename = blobParts.slice(2).join("-");

      const sasUrl = AzureBlobService.generateSasUrl(
        blobName,
        originalFilename
      );

      if (!sasUrl) {
        req.flash(
          "errorMessage",
          "No se pudo generar la descarga del archivo."
        );
        return res.redirect("back");
      }

      // Redirigir al usuario a la URL SAS para iniciar la descarga
      res.redirect(sasUrl);
    } catch (error) {
      console.error("Error al descargar el archivo:", error);
      req.flash("errorMessage", "Error al descargar el archivo.");
      res.redirect("back");
    }
  };
}

export default SolicitudesController;
