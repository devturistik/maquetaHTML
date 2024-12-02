// src/controllers/ordenesController.js
import OrdenesService from "../application/ordenesService.js";
import SolicitudesService from "../application/solicitudesService.js";
import { encodeBase64, decodeBase64 } from "../utils/base64.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import { calculateFechaVencimiento } from "../utils/helpers.js";
import AzureBlobService from "../services/azureBlobService.js";
import apiService from "../services/apiService.js";
import ejs from "ejs";
import path from "path";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import puppeteerService from "../services/puppeteerService.js";

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
      res.render("ordenes", {
        ordenes: ordenes.map((orden) => ({
          ...orden,
          oc: orden.codigo.split("-")[1],
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

      const historialAprobaciones =
        await this.ordenesService.getHistorialAprobaciones(orden.codigo);

      const usuarios = await this.ordenesService.getUsuariosAprobadores(
        historialAprobaciones
      );

      orden.id = encodeBase64(orden.id_orden);

      res.render("orden/detalle", { orden, historialAprobaciones, usuarios });
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

      solicitud.nro_solicitud = solicitud.id_solicitud;
      solicitud.id_solicitud = encodeBase64(solicitud.id_solicitud);

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
    console.time("Crear OC en BD");
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
        productos: productosRaw = "[]",
      } = req.body;

      let productosArray;
      try {
        productosArray = JSON.parse(productosRaw);
        if (!Array.isArray(productosArray) || productosArray.length === 0) {
          throw new Error("Debe agregar al menos un producto.");
        }
        productosArray.forEach((producto, index) => {
          const { cantidad, valorUnitario } = producto;
          if (!cantidad || isNaN(cantidad) || parseFloat(cantidad) < 1) {
            throw new Error(
              `La cantidad del producto ${
                index + 1
              } es inválida. Debe ser un número mayor o igual a 1.`
            );
          }
          if (
            !valorUnitario ||
            isNaN(valorUnitario) ||
            parseFloat(valorUnitario) <= 0
          ) {
            throw new Error(
              `El valor unitario del producto ${
                index + 1
              } es inválido. Debe ser un número mayor a 0.`
            );
          }
        });
      } catch (error) {
        req.flash(
          "errorMessage",
          error.message || "Datos de productos inválidos."
        );
        return res.redirect(`/ordenes-crear/${req.params.id}`);
      }

      const fechaHoySantiago = dayjs().tz("America/Santiago");
      const fechaVencimiento = calculateFechaVencimiento(30);
      const formattedFechaHoyForBlob = fechaHoySantiago.format("DDMMYYYY");
      const formattedFechaHoyForTemplate =
        fechaHoySantiago.format("DD-MM-YYYY");
      const fechaCreacionDate = fechaHoySantiago.utc().toDate();
      const creadorOC = `${res.locals.user.nombre} ${res.locals.user.apellido}`;

      const documentosCotizacionPromise =
        req.files && req.files.length > 0
          ? AzureBlobService.uploadFilesWithNames(
              req.files.map((file) => ({
                blobName: `${formattedFechaHoyForBlob}_${file.originalname}`,
                file,
              }))
            )
          : Promise.resolve([]);

      const datosAdicionalesPromise = (async () => {
        try {
          return jwt.verify(tokenDatos, process.env.JWT_SECRET);
        } catch (err) {
          throw new Error("Datos inválidos o sesión expirada.");
        }
      })();

      const [documentosCotizacionURLs, datosAdicionales] = await Promise.all([
        documentosCotizacionPromise,
        datosAdicionalesPromise,
      ]);

      const documentosCotizacion = JSON.stringify(
        documentosCotizacionURLs.map((url) => ({ url, eliminado: 0 }))
      );

      if (!datosAdicionales) {
        req.flash("errorMessage", "Datos inválidos o sesión expirada.");
        return res.redirect(`/ordenes-crear/${req.params.id}`);
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
        Promise.resolve(
          datosAdicionales.proveedores.find(
            (p) => p.id_proveedor == id_proveedor
          )
        ),
        this.ordenesService.getProveedorBanco(id_banco, id_proveedor),
        Promise.resolve(
          datosAdicionales.plazosdepago.find(
            (p) => p.id_forma_pago == id_plazoPago
          )
        ),
        Promise.resolve(
          datosAdicionales.empresas.find((e) => e.id_empresa == id_empresa)
        ),
        Promise.resolve(
          datosAdicionales.centrosdecosto.find(
            (c) => c.id_centro_costo == id_centroCosto
          )
        ),
        Promise.resolve(
          datosAdicionales.tiposdeorden.find((t) => t.id_tipo == id_tipoOrden)
        ),
        Promise.resolve(
          datosAdicionales.monedas.find((m) => m.id_moneda == id_moneda)
        ),
        Promise.resolve(
          datosAdicionales.cuentascontables.find(
            (c) => c.id_cuenta == id_cuentaContable
          )
        ),
      ]);

      const validaciones = [
        { entidad: Proveedor, mensaje: "Proveedor inválido." },
        { entidad: Banco, mensaje: "Banco inválido." },
        { entidad: PlazoPago, mensaje: "Plazo de pago inválido." },
        { entidad: Empresa, mensaje: "Empresa inválida." },
        { entidad: CentroCosto, mensaje: "Centro de costo inválido." },
        { entidad: TipoOrden, mensaje: "Tipo de orden inválido." },
        { entidad: Moneda, mensaje: "Moneda inválida." },
        { entidad: CuentaContable, mensaje: "Cuenta contable inválida." },
      ];

      for (const validacion of validaciones) {
        if (!validacion.entidad) {
          throw new Error(validacion.mensaje);
        }
      }

      const isCLP = Moneda.abrev === "CLP$";

      const parsedSubtotal = isCLP
        ? Math.round(Number(subtotal))
        : parseFloat(subtotal);
      const parsedTotal = isCLP ? Math.round(Number(total)) : parseFloat(total);
      const parsedImpuesto = isCLP
        ? Math.round(Number(impuesto || 0))
        : parseFloat(impuesto || 0);
      const parsedRetencion = isCLP
        ? Math.round(Number(retencion || 0))
        : parseFloat(retencion || 0);
      const parsedPropina = isCLP
        ? Math.round(Number(propina || 0))
        : parseFloat(propina || 0);

      const totalLocal =
        Moneda.abrev !== "CLP$"
          ? Math.round(Moneda.cambio * parsedTotal)
          : Math.round(parsedTotal);

      const newOrden = {
        codigo: "",
        subtotal: parsedSubtotal,
        total: parsedTotal,
        impuesto: parsedImpuesto,
        retencion: parsedRetencion,
        propina: parsedPropina,
        usuario_creador: creadorOC,
        correo_creador: res.locals.user.correo,
        nota_creador: Nota,
        documentos_cotizacion: documentosCotizacion,
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
        fecha_creacion: fechaCreacionDate,
      };

      const { id_orden, codigoOC } =
        await this.ordenesService.createOrdenConDetalles(
          newOrden,
          productosArray,
          id_solicitud
        );

      const codigoOCShort = codigoOC.split("-")[1];

      const templateData = {
        codigooc: codigoOCShort,
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
        productos: productosArray,
        totales: {
          subtotal: parsedSubtotal,
          impuesto: parsedImpuesto,
          retencion: parsedRetencion,
          propina: parsedPropina,
          total: parsedTotal,
        },
        fechaHoy: formattedFechaHoyForTemplate,
        defaultText,
        formatNumber,
      };

      const bodyHtml = await ejs.renderFile(
        path.join(
          process.cwd(),
          "src",
          "views",
          "orden",
          "templates",
          "pdfTemplate.ejs"
        ),
        templateData,
        { encoding: "utf8" }
      );

      const pdfBufferFinal = await puppeteerService.generatePdf(
        bodyHtml,
        codigoOCShort
      );

      const pdfBlobName = `OC-${id_orden}-${formattedFechaHoyForBlob}.pdf`;
      const pdfUrl = await AzureBlobService.uploadBufferWithName(
        pdfBlobName,
        pdfBufferFinal,
        "application/pdf"
      );

      await Promise.all([
        this.ordenesService.updateOrdenPdfUrl(id_orden, pdfUrl),
        this.solicitudesService.updateEstatus(id_solicitud, "procesada"),
      ]);

      apiService
        .enviarAprobacionAPI(codigoOC, process.env.API_USERNAME)
        .catch((error) => {
          console.error(
            "Error al enviar la solicitud de aprobación:",
            error.message
          );
        });

      console.timeEnd("Crear OC en BD");
      req.flash("successMessage", "Orden creada exitosamente.");
      res.redirect("/ordenes");
    } catch (error) {
      console.error("Error al crear la orden:", error.message);
      req.flash(
        "errorMessage",
        error.message ||
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
  const isNegative = value < 0;
  const absoluteValue = Math.abs(value);

  let formatted;
  if (currency === "CLP$" || currency === "UF") {
    formatted = absoluteValue.toLocaleString("es-CL");
  } else {
    formatted = absoluteValue
      .toFixed(2)
      .replace(".", ",")
      .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  return isNegative ? `-${formatted}` : formatted;
}

export default OrdenesController;
