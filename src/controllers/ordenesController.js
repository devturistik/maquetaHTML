// src/controllers/ordenesController.js
import OrdenesService from "../application/ordenesService.js";
import SolicitudesRepository from "../adapters/repository/solicitudesRepository.js";
import { encodeBase64, decodeBase64 } from "../utils/base64.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

class OrdenesController {
  constructor() {
    this.ordenesService = new OrdenesService();
    this.solicitudesRepository = new SolicitudesRepository();
  }

  getAllOrdenes = async (req, res) => {
    try {
      const ordenes = await this.ordenesService.getAllOrdenes();
      res.render("ordenes", {
        ordenes: ordenes.map((orden) => ({
          ...orden,
          id: encodeBase64(orden.id_orden),
        })),
      });
    } catch (error) {
      console.error("Error al obtener ordenes:", error.message);
      res.status(500).send("Error al obtener ordenes");
    }
  };

  getOrdenById = async (req, res) => {
    try {
      const encodedId = req.params.id;
      const id_orden = decodeBase64(encodedId);
      const orden = await this.ordenesService.getOrdenById(id_orden);

      if (!orden) {
        req.flash("errorMessage", "Orden de compra no encontrada.");
        return res.redirect("/ordenes");
      }

      orden.id = encodeBase64(orden.id_orden);

      res.render("orden/detalle", { orden });
    } catch (error) {
      console.error("Error al obtener orden:", error.message);
      req.flash("errorMessage", "Error al obtener la orden de compra.");
      res.redirect("/ordenes");
    }
  };

  renderCreateForm = async (req, res) => {
    try {
      const id_solicitud = decodeBase64(req.params.id);
      const solicitud = await this.solicitudesRepository.getById(id_solicitud);
      if (solicitud.eliminado) {
        req.flash(
          "errorMessage",
          `La solicitud "${solicitud.asunto}" fue eliminada por el solicitante`
        );
        return res.redirect("/solicitudes");
      }

      solicitud.id = encodeBase64(solicitud.id_solicitud);

      const [
        proveedores,
        bancos,
        plazoPagos,
        empresas,
        tipoOrdenes,
        monedas,
        categorias,
        productos,
      ] = await Promise.all([
        this.ordenesService.getProveedores(),
        this.ordenesService.getBancos(),
        this.ordenesService.getPlazoPagos(),
        this.ordenesService.getEmpresas(),
        this.ordenesService.getTipoOrdenes(),
        this.ordenesService.getMonedas(),
        this.ordenesService.getCategorias(),
        this.ordenesService.getProductos(),
      ]);

      const fechaActual = dayjs().tz("America/Santiago").format("YYYY-MM-DD");
      const fechaActualDisplay = dayjs()
        .tz("America/Santiago")
        .format("DD/MM/YYYY");

      res.render("orden/crear", {
        solicitud,
        proveedores,
        bancos,
        plazoPagos,
        empresas,
        tipoOrdenes,
        monedas,
        categorias,
        productos,
        fechaActual,
        fechaActualDisplay,
        errors: {},
      });
    } catch (error) {
      console.error(
        "Error al obtener solicitud para crear orden:",
        error.message
      );
      req.flash(
        "errorMessage",
        "Error al cargar el formulario de creación de orden."
      );
      res.redirect("/ordenes");
    }
  };

  createOrden = async (req, res) => {
    try {
      const encodedId = req.params.id;
      const id_solicitud = decodeBase64(encodedId);
      const {
        ordenNumero,
        ordenProveedor,
        ordenBanco,
        ordenPlazo,
        ordenEmpresa,
        ordenCentroCosto,
        ordenTipo,
        ordenMoneda,
        ordenFecha,
        ordenNota,
      } = req.body;
      const cotizacion = req.files && req.files.length > 0 ? req.files : [];
      const { nombre, apellido, correo } = res.locals.user || {};

      const archivosPaths = cotizacion.map((file) => file.originalname);
      const archivosJson = archivosPaths.length
        ? JSON.stringify(archivosPaths)
        : JSON.stringify([]);

      const subtotal = parseFloat(req.body.subtotal) || 0;
      const impuesto = parseFloat(req.body.impuesto) || 0;
      const retencion = parseFloat(req.body.retencion) || 0;
      const propina = parseFloat(req.body.propina) || 0;
      const total = parseFloat(req.body.total) || 0;

      const ordenData = {
        codigo: ordenNumero,
        subtotal,
        total,
        impuesto,
        retencion,
        nota_creador: ordenNota,
        archivos: archivosJson,
        usuario_creador: `${nombre} ${apellido}`,
        correo_creador: correo,
        id_moneda: ordenMoneda,
        id_solicitud: id_solicitud,
        id_proveedor: ordenProveedor,
        id_tipo_orden: ordenTipo,
        id_plazo: ordenPlazo,
        id_empresa: ordenEmpresa,
        id_centro_costo: ordenCentroCosto,
        nivel_aprobacion: 1,
        justificacion_rechazo: null,
        ruta_archivo_pdf: null,
        documentos_cotizacion: archivosJson,
        total_local: total,
        creado_por: `${nombre} ${apellido}`,
      };

      await this.ordenesService.createOrden(ordenData);

      req.flash("successMessage", "Orden creada con éxito");
      res.redirect("/ordenes");
    } catch (error) {
      if (error.validationErrors) {
        const encodedId = req.params.id;
        const id_solicitud = decodeBase64(encodedId);
        const solicitud = await this.solicitudesRepository.getById(
          id_solicitud
        );
        solicitud.id = encodeBase64(solicitud.id_solicitud);

        const [
          proveedores,
          bancos,
          plazoPagos,
          empresas,
          tipoOrdenes,
          monedas,
          categorias,
          productos,
        ] = await Promise.all([
          this.ordenesService.getProveedores(),
          this.ordenesService.getBancos(),
          this.ordenesService.getPlazoPagos(),
          this.ordenesService.getEmpresas(),
          this.ordenesService.getTipoOrdenes(),
          this.ordenesService.getMonedas(),
          this.ordenesService.getCategorias(),
          this.ordenesService.getProductos(),
        ]);

        res.render("orden/crear", {
          solicitud,
          proveedores,
          bancos,
          plazoPagos,
          empresas,
          tipoOrdenes,
          monedas,
          categorias,
          productos,
          errors: error.validationErrors,
          errorMessage: "Por favor, corrige los errores en el formulario.",
        });
      } else {
        console.error("Error al crear orden:", error.message);
        req.flash("errorMessage", "Error al crear la orden: " + error.message);
        res.redirect("/ordenes");
      }
    }
  };

  renderEditForm = async (req, res) => {
    try {
      const id = decodeBase64(req.params.id);
      const orden = await this.ordenesService.getOrdenById(id);
      orden["id"] = encodeBase64(id);
      res.render("orden/editar", { orden, errors: {} });
    } catch (error) {
      console.error("Error al obtener orden para editar:", error.message);
      res.status(500).send("Error al obtener orden para editar");
    }
  };

  updateOrden = async (req, res) => {
    try {
      const id = decodeBase64(req.params.id);
      const { asunto, descripcion } = req.body;
      const archivos = req.files && req.files.length > 0 ? req.files : [];
      const archivosPaths = archivos.map((file) => file.originalname);
      const archivosJson = archivosPaths.length
        ? JSON.stringify(archivosPaths)
        : JSON.stringify([]);

      await this.ordenesService.updateOrden(id, {
        asunto,
        descripcion,
        archivos: archivosJson,
      });

      const ordenes = await this.ordenesService.getAllOrdenes();
      res.render("ordenes", {
        ordenes: ordenes.map((orden) => ({
          ...orden,
          id: encodeBase64(orden.id),
        })),
        successMessage: "Orden actualizada con éxito",
      });
    } catch (error) {
      res.status(500).json({
        message: "Error al actualizar la orden",
        error: error.message,
      });
    }
  };

  deleteOrden = async (req, res) => {
    try {
      const id = decodeBase64(req.params.id);
      await this.ordenesService.deleteOrden(id);

      const ordenes = await this.ordenesService.getAllOrdenes();
      res.render("ordenes", {
        ordenes: ordenes.map((orden) => ({
          ...orden,
          id: encodeBase64(orden.id),
        })),
        successMessage: "Orden eliminada con éxito",
      });
    } catch (error) {
      res.status(500).json({
        message: "Error al eliminar la orden",
        error: error.message,
      });
    }
  };
}

export default OrdenesController;
