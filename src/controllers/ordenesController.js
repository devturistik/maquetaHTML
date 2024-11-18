// src/controllers/ordenesController.js
import OrdenesService from "../application/ordenesService.js";
import SolicitudesService from "../application/solicitudesService.js";
import { encodeBase64, decodeBase64 } from "../utils/base64.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import {
  generateCodigoOrden,
  calculateFechaVencimiento,
} from "../utils/helpers.js";
import AzureBlobService from "../services/azureBlobService.js";
import axios from "axios";
import ejs from "ejs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

dayjs.extend(utc);
dayjs.extend(timezone);

class OrdenesController {
  constructor() {
    this.ordenesService = new OrdenesService();
    this.solicitudesService = new SolicitudesService();
  }

  getAllOrdenes = async (req, res) => {
    try {
      const ordenes = await this.ordenesService.getAllOrdenes();
      console.log(ordenes);
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
      const solicitud = await this.solicitudesService.getSolicitudById(
        id_solicitud
      );

      if (!solicitud || solicitud.eliminado) {
        req.flash(
          "errorMessage",
          `La solicitud "${
            solicitud ? solicitud.asunto : "No encontrada"
          }" fue eliminada por el solicitante`
        );
        return res.redirect("/solicitudes");
      }

      await this.solicitudesService.updateEstatus(id_solicitud, "procesada");

      solicitud.id = encodeBase64(solicitud.id_solicitud);

      const [
        proveedores,
        plazosdepago,
        empresas,
        centrosdecosto,
        tiposdeorden,
        monedas,
        productos,
      ] = await Promise.all([
        this.ordenesService.getProveedores(),
        this.ordenesService.getPlazosDePago(),
        this.ordenesService.getEmpresas(),
        this.ordenesService.getCentrosDeCosto(),
        this.ordenesService.getTiposDeOrden(),
        this.ordenesService.getMonedas(),
        this.ordenesService.getProductos(),
      ]);

      return res.render("orden/crear", {
        solicitud,
        proveedores,
        plazosdepago,
        empresas,
        centrosdecosto,
        tiposdeorden,
        monedas,
        productos,
        errors: {},
        successMessage: req.flash("successMessage"),
        errorMessage: req.flash("errorMessage"),
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

  getBancosPorProveedor = async (req, res) => {
    try {
      const proveedorId = parseInt(req.params.proveedorId, 10);
      if (isNaN(proveedorId)) {
        return res.status(400).json({ error: "ID de proveedor inválido" });
      }

      const bancos = await this.ordenesService.getBancosByProveedor(
        proveedorId
      );
      res.json(bancos);
    } catch (error) {
      console.error("Error al obtener bancos por proveedor:", error.message);
      res.status(500).json({ error: "Error al obtener los bancos" });
    }
  };

  getCuentasContablesPorEmpresa = async (req, res) => {
    try {
      const empresaId = parseInt(req.params.empresaId, 10);
      if (isNaN(empresaId)) {
        return res.status(400).json({ error: "ID de empresa inválido" });
      }

      const cuentasContables =
        await this.ordenesService.getCuentasContablesByEmpresa(empresaId);
      res.json(cuentasContables);
    } catch (error) {
      console.error(
        "Error al obtener cuentas contables por empresa:",
        error.message
      );
      res.status(500).json({ error: "Error al obtener las cuentas contables" });
    }
  };

  getDetallesTipoOrden = async (req, res) => {
    try {
      const tipoOrdenId = parseInt(req.params.tipoOrdenId, 10);
      if (isNaN(tipoOrdenId)) {
        return res.status(400).json({ error: "ID de tipo de orden inválido" });
      }

      const detalles = await this.ordenesService.getDetallesTipoOrden(
        tipoOrdenId
      );
      res.json(detalles);
    } catch (error) {
      console.error(
        "Error al obtener detalles del tipo de orden:",
        error.message
      );
      res
        .status(500)
        .json({ error: "Error al obtener los detalles del tipo de orden" });
    }
  };

  createOrden = async (req, res) => {
    try {
      const id_solicitud = decodeBase64(req.params.id);
      const {
        id_proveedor,
        id_banco,
        id_plazoPago,
        id_empresa,
        id_centroCosto,
        id_tipoOrden,
        id_moneda,
        id_cuentaContable,
        Nota,
        subtotal,
        impuesto,
        retencion,
        propina,
        total,
      } = req.body;
      const productos = JSON.parse(req.body.productos || "[]");
      const fechaHoySantiago = dayjs()
        .tz("America/Santiago")
        .format("DD-MM-YYYY");
      const fechaVencimiento = calculateFechaVencimiento(30);

      const creadorOC = `${res.locals.user.nombre} ${res.locals.user.apellido}, ${res.locals.user.correo}`;

      let totalLocal = total;

      let documentosCotizacion = [];
      if (req.files && req.files.length > 0) {
        const archivos = req.files.map((file) => {
          const uniqueSuffix = fechaHoySantiago;
          const blobName = `${uniqueSuffix}_${file.originalname}`;
          return { blobName, file };
        });

        const blobUrls = await AzureBlobService.uploadFilesWithNames(archivos);

        documentosCotizacion = blobUrls.map((url) => ({ url, eliminado: 0 }));
      }

      const [
        Solicitud,
        Proveedor,
        Banco,
        PlazoPago,
        Empresa,
        CentroCosto,
        TipoOrden,
        Moneda,
        CuentaContable,
      ] = await Promise.all([
        this.solicitudesService.getSolicitudById(id_solicitud),
        this.ordenesService.getProveedorById(id_proveedor),
        this.ordenesService.getProveedorBanco(id_banco, id_proveedor),
        this.ordenesService.getPlazoPagoById(id_plazoPago),
        this.ordenesService.getEmpresaById(id_empresa),
        this.ordenesService.getCentroCostoById(id_centroCosto),
        this.ordenesService.getTipoOrdenById(id_tipoOrden),
        this.ordenesService.getMonedaById(id_moneda),
        this.ordenesService.getCuentaContableById(id_cuentaContable),
      ]);

      if (Moneda.ABREV !== "CLP$") {
        totalLocal = Moneda.CAMBIO * total;
      }

      const newOrden = {
        codigo: "",
        subtotal: subtotal,
        total: total,
        impuesto: impuesto,
        retencion: retencion,
        usuario_creador: `${res.locals.user.nombre} ${res.locals.user.apellido}`,
        correo_creador: `${res.locals.user.correo}`,
        nota_creador: Nota,
        ruta_archivo_pdf: null,
        documentos_cotizacion: JSON.stringify(documentosCotizacion),
        nivel_aprobacion: 1,
        justificacion_rechazo: "",
        total_local: totalLocal,
        id_moneda: id_moneda,
        id_empresa: id_empresa,
        id_solicitud: id_solicitud,
        id_proveedor: id_proveedor,
        id_tipo_orden: id_tipoOrden,
        id_plazo: id_plazoPago,
        fecha_vencimiento: fechaVencimiento,
      };

      const id_orden = await this.ordenesService.createOrden(newOrden);

      const codigoOC = generateCodigoOrden(id_orden);
      await this.ordenesService.updateOrdenCodigo(id_orden, codigoOC);

      function defaultText(value, fallback = "SIN DATO") {
        return value && value.trim ? value.trim() : fallback;
      }

      function formatNumber(value, currency) {
        if (value === null || value === 0) {
          return null;
        }
        if (currency === "CLP$" || currency === "UF") {
          return Math.round(value).toLocaleString("es-CL");
        } else {
          return value
            .toFixed(2)
            .replace(".", ",")
            .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        }
      }

      const templateData = {
        codigooc: codigoOC.match(/OC-(\d+)_/)[1],
        creadoroc: creadorOC,
        solicitud: Solicitud,
        proveedor: Proveedor,
        banco: Banco,
        plazopago: PlazoPago,
        empresa: Empresa,
        centrocosto: CentroCosto,
        tipoorden: TipoOrden,
        moneda: Moneda,
        cuentacontable: CuentaContable,
        nota: Nota,
        productos,
        totales: {
          subtotal: parseFloat(subtotal),
          impuesto: parseFloat(impuesto || 0),
          retencion: parseFloat(retencion || 0),
          propina: parseFloat(propina || 0),
          total: parseFloat(total),
        },
        fechaHoy: fechaHoySantiago,
        defaultText,
        formatNumber,
      };

      const templatePath = path.join(
        process.cwd(),
        "src",
        "views",
        "orden",
        "templates",
        "pdfTemplate.ejs"
      );

      const html = await ejs.renderFile(templatePath, templateData, {
        encoding: "utf8",
        async: true,
      });

      try {
        const response = await axios.post(
          process.env.URL_API_CREATE_PDF,
          html,
          {
            headers: {
              "Content-Type": "text/html; charset=utf-8",
            },
            responseType: "arraybuffer",
          }
        );

        const pdfBuffer = Buffer.from(response.data);

        const pdfBlobName = `OC-${id_orden}-${fechaHoySantiago}.pdf`;
        const pdfUrl = await AzureBlobService.uploadBufferWithName(
          pdfBlobName,
          pdfBuffer,
          "application/pdf"
        );

        await this.ordenesService.updateOrdenPdfUrl(id_orden, pdfUrl);

        req.flash("successMessage", "Orden creada exitosamente.");
        res.redirect("/ordenes");
      } catch (postError) {
        console.error("Error al enviar la petición POST:", postError);
        req.flash(
          "errorMessage",
          "Hubo un error al procesar la orden. Por favor, inténtelo nuevamente."
        );
        res.redirect(`/ordenes-crear/${req.params.id}`);
      }
    } catch (error) {
      console.error("Error al crear la orden:", error.message);
      req.flash(
        "errorMessage",
        "Hubo un error al crear la orden. Por favor, inténtelo nuevamente."
      );
      res.redirect(`/ordenes-crear/${req.params.id}`);
    }
  };
}

export default OrdenesController;
