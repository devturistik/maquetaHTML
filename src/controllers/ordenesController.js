// src/controllers/ordenesController.js
import OrdenesService from "../application/ordenesService.js";
import SolicitudesService from "../application/solicitudesService.js";
import { encodeBase64, decodeBase64 } from "../utils/base64.js";
import dayjs from "dayjs";
import { calculateFechaVencimiento } from "../utils/helpers.js";
import AzureBlobService from "../services/azureBlobService.js";
import axios from "axios";
import ejs from "ejs";
import path from "path";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

class OrdenesController {
  constructor() {
    this.ordenesService = new OrdenesService();
    this.solicitudesService = new SolicitudesService();
  }

  getAllOrdenes = async (req, res) => {
    try {
      const ordenes = await this.ordenesService.getAllOrdenes();
      res.render("ordenes", {
        ordenes: ordenes.map((orden) => ({
          ...orden,
          Encoded_id_orden: encodeBase64(orden.id_orden),
          Encoded_id_solicitud: encodeBase64(orden.id_solicitud),
          ruta_archivo_pdf: orden.ruta_archivo_pdf?.replace(/^"|"$/g, ""),
          created_at: new Date(orden.created_at).toLocaleString("es-CL", {
            timeZone: "UTC",
            dateStyle: "short",
            timeStyle: "short",
          }),
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

      const lockTimeoutMinutes = 10;
      const now = dayjs();
      const lockedAt = dayjs(solicitud.locked_at);
      const estatusLower = solicitud.estatus.toLowerCase();

      if (
        (estatusLower === "editando" || estatusLower === "procesando") &&
        now.diff(lockedAt, "minute") < lockTimeoutMinutes
      ) {
        req.flash(
          "errorMessage",
          "La solicitud está siendo procesada por otro usuario."
        );
        return res.redirect("/solicitudes");
      }

      await this.solicitudesService.updateEstatus(
        id_solicitud,
        "procesando",
        new Date()
      );

      solicitud.id = encodeBase64(solicitud.id_solicitud);

      const [
        proveedores,
        plazosdepago,
        empresas,
        centrosdecosto,
        tiposdeorden,
        monedas,
        productos,
        cuentascontables,
      ] = await Promise.all([
        this.ordenesService.getProveedores(),
        this.ordenesService.getPlazosDePago(),
        this.ordenesService.getEmpresas(),
        this.ordenesService.getCentrosDeCosto(),
        this.ordenesService.getTiposDeOrden(),
        this.ordenesService.getMonedas(),
        this.ordenesService.getProductos(),
        this.ordenesService.getCuentasContables(),
      ]);

      const datosAdicionales = {
        proveedores,
        plazosdepago,
        empresas,
        centrosdecosto,
        tiposdeorden,
        monedas,
        cuentascontables,
      };

      const tokenDatos = jwt.sign(datosAdicionales, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      return res.render("orden/crear", {
        solicitud,
        productos,
        proveedores,
        plazosdepago,
        empresas,
        centrosdecosto,
        tiposdeorden,
        monedas,
        cuentascontables,
        tokenDatos,
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
        tokenDatos,
      } = req.body;
      const productos = JSON.parse(req.body.productos || "[]");
      const fechaHoySantiago = dayjs().tz("America/Santiago").toDate();
      const fechaVencimiento = calculateFechaVencimiento(30);

      const creadorOC = `${res.locals.user.nombre} ${res.locals.user.apellido}, ${res.locals.user.correo}`;

      let totalLocal = total;

      let documentosCotizacion = [];
      if (req.files && req.files.length > 0) {
        const archivos = req.files.map((file) => {
          const uniqueSuffix = dayjs(fechaHoySantiago).format("DD-MM-YYYY");
          const blobName = `${uniqueSuffix}_${file.originalname}`;
          return { blobName, file };
        });

        const blobUrls = await AzureBlobService.uploadFilesWithNames(archivos);

        documentosCotizacion = blobUrls.map((url) => ({ url, eliminado: 0 }));
      }

      let datosAdicionales;
      try {
        datosAdicionales = jwt.verify(tokenDatos, process.env.JWT_SECRET);
      } catch (err) {
        req.flash("errorMessage", "Datos inválidos o sesión expirada.");
        return res.redirect(`/ordenes-crear/${req.params.id}`);
      }

      const Solicitud = await this.solicitudesService.getSolicitudById(
        id_solicitud
      );

      const Proveedor = datosAdicionales.proveedores.find(
        (p) => p.id_proveedor == id_proveedor
      );
      if (!Proveedor) {
        req.flash("errorMessage", "Proveedor inválido.");
        return res.redirect(`/ordenes-crear/${req.params.id}`);
      }

      const Banco = await this.ordenesService.getProveedorBanco(
        id_banco,
        id_proveedor
      );
      if (!Banco) {
        req.flash("errorMessage", "Banco inválido.");
        return res.redirect(`/ordenes-crear/${req.params.id}`);
      }

      const PlazoPago = datosAdicionales.plazosdepago.find(
        (p) => p.id_forma_pago == id_plazoPago
      );
      if (!PlazoPago) {
        req.flash("errorMessage", "Plazo de pago inválido.");
        return res.redirect(`/ordenes-crear/${req.params.id}`);
      }

      const Empresa = datosAdicionales.empresas.find(
        (e) => e.id_empresa == id_empresa
      );
      if (!Empresa) {
        req.flash("errorMessage", "Empresa inválida.");
        return res.redirect(`/ordenes-crear/${req.params.id}`);
      }

      const CentroCosto = datosAdicionales.centrosdecosto.find(
        (c) => c.id_centro_costo == id_centroCosto
      );
      if (!CentroCosto) {
        req.flash("errorMessage", "Centro de costo inválido.");
        return res.redirect(`/ordenes-crear/${req.params.id}`);
      }

      const TipoOrden = datosAdicionales.tiposdeorden.find(
        (t) => t.id_tipo == id_tipoOrden
      );
      if (!TipoOrden) {
        req.flash("errorMessage", "Tipo de orden inválido.");
        return res.redirect(`/ordenes-crear/${req.params.id}`);
      }

      const Moneda = datosAdicionales.monedas.find(
        (m) => m.id_moneda == id_moneda
      );
      if (!Moneda) {
        req.flash("errorMessage", "Moneda inválida.");
        return res.redirect(`/ordenes-crear/${req.params.id}`);
      }

      const CuentaContable = datosAdicionales.cuentascontables.find(
        (c) => c.id_cuenta == id_cuentaContable
      );
      if (!CuentaContable) {
        req.flash("errorMessage", "Cuenta contable inválida.");
        return res.redirect(`/ordenes-crear/${req.params.id}`);
      }

      if (Moneda.abrev !== "CLP$") {
        totalLocal = Moneda.cambio * total;
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
        documentos_cotizacion: JSON.stringify(documentosCotizacion),
        nivel_aprobacion: 0,
        total_local: totalLocal,
        id_centro_costo: id_centroCosto,
        id_moneda: id_moneda,
        id_empresa: id_empresa,
        id_solicitud: id_solicitud,
        id_proveedor: id_proveedor,
        id_tipo_orden: id_tipoOrden,
        id_plazo: id_plazoPago,
        id_cuenta_contable: id_cuentaContable,
        fecha_vencimiento: fechaVencimiento,
        fecha_creacion: fechaHoySantiago,
      };

      const { id_orden, codigoOC } =
        await this.ordenesService.createOrdenConDetalles(
          newOrden,
          productos,
          id_solicitud
        );

      const templateData = {
        codigooc: codigoOC.split("-")[1],
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
        fechaHoy: dayjs(fechaHoySantiago).format("DD-MM-YYYY"),
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
        console.time("Tiempo de ejecución api html a pdf");
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

        const pdfBlobName = `OC-${id_orden}-${dayjs(fechaHoySantiago).format(
          "DD-MM-YYYY"
        )}.pdf`;
        const pdfUrl = await AzureBlobService.uploadBufferWithName(
          pdfBlobName,
          pdfBuffer,
          "application/pdf"
        );
        console.timeEnd("Tiempo de ejecución api html a pdf");
        await this.ordenesService.updateOrdenPdfUrl(id_orden, pdfUrl);
        await this.solicitudesService.updateEstatus(id_solicitud, "procesada");

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

  liberarProcesamiento = async (req, res) => {
    try {
      const encodedId = req.params.id;
      const id_solicitud = decodeBase64(encodedId);
      await this.solicitudesService.updateEstatus(id_solicitud, "abierta");
      res.status(200).json({ message: "Bloqueo de procesamiento liberado." });
    } catch (error) {
      console.error("Error al liberar el bloqueo de procesamiento:", error);
      res
        .status(500)
        .json({ message: "Error al liberar el bloqueo de procesamiento." });
    }
  };

  cancelarProcesamiento = async (req, res) => {
    try {
      const encodedId = req.params.id;
      const id_solicitud = decodeBase64(encodedId);
      await this.solicitudesService.updateEstatus(id_solicitud, "abierta");
      req.flash("successMessage", "Procesamiento cancelado.");
      res.redirect("/solicitudes");
    } catch (error) {
      console.error("Error al cancelar el procesamiento:", error);
      req.flash("errorMessage", "Error al cancelar el procesamiento.");
      res.redirect("/solicitudes");
    }
  };
}

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

export default OrdenesController;
