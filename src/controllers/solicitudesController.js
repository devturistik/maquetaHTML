// src/controllers/solicitudesController.js
import SolicitudesService from "../application/solicitudesService.js";
import { encodeBase64, decodeBase64 } from "../utils/base64.js";
import AzureBlobService from "../services/azureBlobService.js";
import dayjs from "dayjs";

class SolicitudesController {
  constructor() {
    this.solicitudesService = new SolicitudesService();
  }

  getAllSolicitudes = async (req, res) => {
    try {
      const user = res.locals.user;
      const isSolicitante = user.roles.some(
        (role) => role.rol.toLowerCase() === "solicitante"
      );
      const userEmail = user.correo;

      let solicitudes = await this.solicitudesService.getAllSolicitudes();

      if (isSolicitante) {
        solicitudes = solicitudes.filter(
          (solicitud) => solicitud.correo_solicitante === userEmail
        );
      }

      res.render("solicitudes", {
        solicitudes: solicitudes.map((solicitud) => ({
          ...solicitud,
          nro_solicitud: solicitud.id_solicitud,
          id_solicitud: encodeBase64(solicitud.id_solicitud.toString()),
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
        const nuevosArchivos = archivosUrls.map((url) => ({
          url,
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
          asunto: req.body.asunto,
          descripcion: req.body.descripcion,
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
      req.flash("errorMessage", "Error al cancelar la edición.");
      res.redirect("/solicitudes");
    }
  };

  liberarEdicion = async (req, res) => {
    try {
      const encodedId = req.params.id;
      const id = decodeBase64(encodedId);
      await this.solicitudesService.updateEstatus(id, "abierta");
      res.status(200).json({ message: "Bloqueo liberado." });
    } catch (error) {
      console.error("Error al liberar el bloqueo de edición:", error);
      res
        .status(500)
        .json({ message: "Error al liberar el bloqueo de edición." });
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

      const conteo = {
        pdf: 0,
        imagen: 0,
        word: 0,
        excel: 0,
        ppt: 0,
      };

      archivos = await Promise.all(
        archivos.map(async (archivo) => {
          const extension = archivo.url.split(".").pop().toLowerCase();

          if (extension === "pdf") conteo.pdf++;
          else if (["jpg", "jpeg", "png"].includes(extension)) conteo.imagen++;
          else if (["doc", "docx"].includes(extension)) conteo.word++;
          else if (["xls", "xlsx"].includes(extension)) conteo.excel++;
          else if (["ppt", "pptx"].includes(extension)) conteo.ppt++;

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

      const navbarText = `
        [ PDFs: ${conteo.pdf} ]
        [ Imágenes: ${conteo.imagen} ]
        [ Word: ${conteo.word} ]
        [ Excel: ${conteo.excel} ]
        [ PowerPoint: ${conteo.ppt} ]
      `;

      solicitud.nro_solicitud = solicitud.id_solicitud;
      solicitud.id_solicitud = encodeBase64(solicitud.id_solicitud);

      res.render("solicitud/archivos", {
        solicitud,
        archivos,
        conteo,
        navbarText,
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

      res.redirect(sasUrl);
    } catch (error) {
      console.error("Error al descargar el archivo:", error);
      req.flash("errorMessage", "Error al descargar el archivo.");
      res.redirect("back");
    }
  };
}

export default SolicitudesController;
