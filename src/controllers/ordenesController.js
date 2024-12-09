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

      const ordenesConCancelacion = ordenes.map((orden) => ({
        ...orden,
        oc: orden.codigo.split("-")[1],
        nro_solicitud: orden.id_solicitud,
        id_orden_encoded: encodeBase64(orden.id_orden),
        id_orden: orden.id_orden,
        ruta_archivo_pdf: orden.ruta_archivo_pdf?.replace(/^"|"$/g, ""),
        created_at: new Date(orden.created_at).toLocaleString("es-CL", {
          timeZone: "UTC",
          dateStyle: "short",
          timeStyle: "short",
        }),
        puedeCancelar: orden.nivel_actual < 1,
      }));

      res.render("ordenes", {
        ordenes: ordenesConCancelacion,
        successMessage: req.flash("successMessage")[0] || "",
        errorMessage: req.flash("errorMessage")[0] || "",
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

      orden.id_orden = encodeBase64(orden.id_orden);

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
        cuentascontables,
      ] = await Promise.all([
        this.ordenesService.getProveedores(),
        this.ordenesService.getPlazosDePago(),
        this.ordenesService.getEmpresas(),
        this.ordenesService.getCentrosDeCosto(),
        this.ordenesService.getTiposDeOrden(),
        this.ordenesService.getMonedas(),
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
        proveedores,
        plazosdepago,
        empresas,
        centrosdecosto,
        tiposdeorden,
        monedas,
        cuentascontables,
        tokenDatos,
        errors: {},
        successMessage: req.flash("successMessage")[0] || "",
        errorMessage: req.flash("errorMessage")[0] || "",
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
    let id_orden, codigoOC;
    let creadorOC;
    let formattedFechaHoyForBlob;
    let formattedFechaHoyForTemplate;
    let Solicitud;
    let parsedSubtotal,
      parsedImpuesto,
      parsedRetencion,
      parsedPropina,
      parsedTotal;
    let productosArray;
    let Moneda;
    let datosAdicionales;
    let fechaVencimiento;
    let fechaCreacionDate;
    let proveedor,
      banco,
      plazoPago,
      empresa,
      centroCosto,
      tipoOrden,
      cuentaContable;
    let Nota;
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
        Nota: nota,
        subtotal,
        impuesto,
        retencion,
        propina,
        total,
        tokenDatos,
        productos: productosRaw = "[]",
      } = req.body;
      Nota = nota;

      try {
        await this.solicitudesService.updateEstatus(id_solicitud, "Procesada");
      } catch (error) {
        req.flash(
          "errorMessage",
          "Error al actualizar el estatus de la solicitud. Intente nuevamente."
        );
        return res.redirect(`/ordenes-crear/${req.params.id}`);
      }

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
      formattedFechaHoyForBlob = fechaHoySantiago.format("DDMMYYYY");
      formattedFechaHoyForTemplate = fechaHoySantiago.format("DD-MM-YYYY");
      fechaVencimiento = calculateFechaVencimiento(30);
      fechaCreacionDate = fechaHoySantiago.utc().toDate();
      creadorOC = `${res.locals.user.nombre} ${res.locals.user.apellido}`;

      try {
        datosAdicionales = jwt.verify(tokenDatos, process.env.JWT_SECRET);
      } catch (err) {
        req.flash("errorMessage", "Datos inválidos o sesión expirada.");
        return res.redirect(`/ordenes-crear/${req.params.id}`);
      }

      const [
        solicitud,
        proveedorData,
        bancoData,
        plazoPagoData,
        empresaData,
        centroCostoData,
        tipoOrdenData,
        monedaData,
        cuentaContableData,
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

      Solicitud = solicitud;
      Moneda = monedaData;
      proveedor = proveedorData;
      banco = bancoData;
      plazoPago = plazoPagoData;
      empresa = empresaData;
      centroCosto = centroCostoData;
      tipoOrden = tipoOrdenData;
      cuentaContable = cuentaContableData;

      const validaciones = [
        { entidad: proveedor, mensaje: "Proveedor inválido." },
        { entidad: banco, mensaje: "Banco inválido." },
        { entidad: plazoPago, mensaje: "Plazo de pago inválido." },
        { entidad: empresa, mensaje: "Empresa inválida." },
        { entidad: centroCosto, mensaje: "Centro de costo inválido." },
        { entidad: tipoOrden, mensaje: "Tipo de orden inválida." },
        { entidad: Moneda, mensaje: "Moneda inválida." },
        { entidad: cuentaContable, mensaje: "Cuenta contable inválida." },
      ];

      for (const validacion of validaciones) {
        if (!validacion.entidad) {
          throw new Error(validacion.mensaje);
        }
      }

      const isCLP = Moneda.abrev === "CLP$";

      parsedSubtotal = isCLP
        ? Math.round(Number(subtotal))
        : parseFloat(subtotal);
      parsedTotal = isCLP ? Math.round(Number(total)) : parseFloat(total);
      parsedImpuesto = isCLP
        ? Math.round(Number(impuesto || 0))
        : parseFloat(impuesto || 0);
      parsedRetencion = isCLP
        ? Math.round(Number(retencion || 0))
        : parseFloat(retencion || 0);
      parsedPropina = isCLP
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
        documentos_cotizacion: "[]",
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

      const result = await this.ordenesService.createOrdenConDetalles(
        newOrden,
        productosArray,
        id_solicitud
      );
      id_orden = result.id_orden;
      codigoOC = result.codigoOC;

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
    } finally {
      if (id_orden && codigoOC) {
        (async () => {
          const tasks = [];

          tasks.push(
            (async () => {
              try {
                const codigoOCShort = codigoOC.split("-")[1];
                const templateData = {
                  codigooc: codigoOCShort,
                  creadoroc: creadorOC,
                  solicitud: Solicitud,
                  proveedor: proveedor,
                  banco: banco,
                  plazopago: plazoPago,
                  empresa: empresa,
                  centrocosto: centroCosto,
                  tipoorden: tipoOrden,
                  moneda: Moneda,
                  cuentacontable: cuentaContable,
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

                await this.ordenesService.updateOrdenPdfUrl(id_orden, pdfUrl);
              } catch (error) {
                console.error(
                  "Error en generación y subida de PDF:",
                  error.message
                );
              }
            })()
          );

          tasks.push(
            (async () => {
              try {
                const documentosCotizacionURLs =
                  req.files && req.files.length > 0
                    ? await AzureBlobService.uploadFilesWithNames(
                        req.files.map((file) => ({
                          blobName: `${formattedFechaHoyForBlob}_${file.originalname}`,
                          file,
                        }))
                      )
                    : [];

                const documentosCotizacion = JSON.stringify(
                  documentosCotizacionURLs.map((url, index) => ({
                    url,
                    originalFileName: req.files[index].originalname,
                    eliminado: 0,
                  }))
                );

                await this.ordenesService.updateOrdenDocumentosCotizacion(
                  id_orden,
                  documentosCotizacion
                );
              } catch (error) {
                console.error(
                  "Error en subida de documentos de cotización:",
                  error.message
                );
              }
            })()
          );

          tasks.push(
            (async () => {
              try {
                await apiService.enviarAprobacionAPI(
                  codigoOC,
                  process.env.API_USERNAME
                );
              } catch (error) {
                console.error(
                  "Error al enviar la solicitud de aprobación:",
                  error.message
                );
              }
            })()
          );

          await Promise.allSettled(tasks);
        })();
      } else {
        console.error(
          "No se pudo iniciar el proceso en segundo plano debido a que faltan datos."
        );
      }
    }
  };

  getProductos = async (req, res) => {
    try {
      const productos = await this.ordenesService.getProductos();
      res.json(productos);
    } catch (error) {
      console.error("Error al obtener productos:", error.message);
      res.status(500).json({ message: "Error al obtener productos" });
    }
  };

  renderCancelConfirm = async (req, res) => {
    try {
      const encodedId = req.params.id;
      const id_orden = decodeBase64(encodedId);
      const orden = await this.ordenesService.getOrdenById(id_orden);

      if (!orden) {
        req.flash("errorMessage", "Orden de compra no encontrada.");
        return res.redirect("/ordenes");
      }

      const estatusLower = orden.estatus.toLowerCase();
      let estatusClass = "";
      let estatusDisplay = orden.estatus;
      if (estatusLower === "pendiente") {
        estatusClass = "bg-warning";
      } else if (estatusLower === "aprobada") {
        estatusClass = "bg-success";
      } else if (estatusLower === "rechazada") {
        estatusClass = "bg-danger";
      } else if (estatusLower === "pagada") {
        estatusClass = "bg-primary";
      } else if (estatusLower === "cerrada") {
        estatusClass = "bg-secondary";
      } else if (estatusLower === "eliminada") {
        estatusClass = "bg-dark";
      }

      res.render("orden/cancelar", {
        orden: {
          ...orden,
          Encoded_id_orden: encodeBase64(orden.id_orden),
          Encoded_id_solicitud: encodeBase64(orden.id_solicitud),
          ruta_archivo_pdf: orden.ruta_archivo_pdf?.replace(/^"|"$/g, ""),
          created_at: new Date(orden.created_at).toLocaleString("es-CL", {
            timeZone: "UTC",
            dateStyle: "short",
            timeStyle: "short",
          }),
        },
        estatusClass,
        estatusDisplay,
        successMessage: req.flash("successMessage")[0] || "",
        errorMessage: req.flash("errorMessage")[0] || "",
      });
    } catch (error) {
      console.error(
        "Error al renderizar la confirmación de cancelación:",
        error.message
      );
      req.flash(
        "errorMessage",
        "Error al cargar la confirmación de cancelación."
      );
      res.redirect("/ordenes");
    }
  };

  cancelarOrden = async (req, res) => {
    try {
      const encodedId = req.params.id;
      const id_orden = decodeBase64(encodedId);
      const { justificacion } = req.body;

      if (!justificacion || justificacion.trim().length === 0) {
        req.flash(
          "errorMessage",
          "Debe proporcionar una justificación para cancelar la orden."
        );
        return res.redirect(`/ordenes-cancelar/${encodedId}`);
      }

      const orden = await this.ordenesService.getOrdenById(id_orden);

      if (!orden) {
        req.flash("errorMessage", "Orden de compra no encontrada.");
        return res.redirect("/ordenes");
      }

      const estatusActual = orden.estatus.toLowerCase();
      const estatusCancelable = ["pendiente"];

      if (!estatusCancelable.includes(estatusActual)) {
        req.flash(
          "errorMessage",
          `La orden no se puede cancelar porque su estado es "${orden.estatus}".`
        );
        return res.redirect("/ordenes");
      }

      if (orden.nivel_actual >= 1) {
        req.flash(
          "errorMessage",
          "No se puede cancelar la orden porque ya ha iniciado el proceso de aprobación."
        );
        return res.redirect("/ordenes");
      }

      await this.ordenesService.cancelarOrden(id_orden, justificacion);

      req.flash("successMessage", "Orden de compra cancelada exitosamente.");
      res.redirect("/ordenes");
    } catch (error) {
      console.error("Error al cancelar la orden de compra:", error.message);
      req.flash(
        "errorMessage",
        "Hubo un error al cancelar la orden de compra."
      );
      res.redirect("/ordenes");
    }
  };

  getOrdenesArchivadas = async (req, res) => {
    try {
      const ordenesArchivadas =
        await this.ordenesService.getOrdenesArchivadas();

      const ordenesConDetalle = ordenesArchivadas.map((orden) => ({
        ...orden,
        oc: orden.codigo.split("-")[1],
        nro_solicitud: orden.id_solicitud,
        id_orden: encodeBase64(orden.id_orden),
        id_solicitud: encodeBase64(orden.id_solicitud),
        ruta_archivo_pdf: orden.ruta_archivo_pdf?.replace(/^"|"$/g, ""),
        created_at: new Date(orden.created_at).toLocaleString("es-CL", {
          timeZone: "UTC",
          dateStyle: "short",
          timeStyle: "short",
        }),
      }));

      res.render("ordenes-archivadas", {
        ordenes: ordenesConDetalle,
        successMessage: req.flash("successMessage")[0] || "",
        errorMessage: req.flash("errorMessage")[0] || "",
      });
    } catch (error) {
      console.error("Error al obtener órdenes archivadas:", error.message);
      res.status(500).send("Error al obtener órdenes archivadas");
    }
  };

  archivarOrden = async (req, res) => {
    try {
      const id_orden = decodeBase64(req.params.id);
      await this.ordenesService.archivarOrden(id_orden);
      res.json({ successMessage: "Orden archivada exitosamente." });
    } catch (error) {
      console.error("Error al archivar la orden:", error.message);
      res
        .status(500)
        .json({ errorMessage: "Hubo un error al archivar la orden." });
    }
  };

  desarchivarOrden = async (req, res) => {
    try {
      const encodedId = req.params.id;
      const id_orden = decodeBase64(encodedId);

      const orden = await this.ordenesService.getOrdenById(id_orden);

      if (!orden) {
        const errorMsg = "Orden de compra no encontrada.";
        if (req.xhr || req.headers.accept.indexOf("json") > -1) {
          return res.status(404).json({ errorMessage: errorMsg });
        }
        req.flash("errorMessage", errorMsg);
        return res.redirect("/ordenes");
      }

      if (!orden.archivado) {
        const errorMsg = "La orden no está archivada.";
        if (req.xhr || req.headers.accept.indexOf("json") > -1) {
          return res.status(400).json({ errorMessage: errorMsg });
        }
        req.flash("errorMessage", errorMsg);
        return res.redirect("/ordenes");
      }

      await this.ordenesService.desarchivarOrden(id_orden);

      const successMsg = "Orden de compra desarchivada exitosamente.";

      if (req.xhr || req.headers.accept.indexOf("json") > -1) {
        return res.json({ successMessage: successMsg });
      }

      req.flash("successMessage", successMsg);
      res.redirect("/ordenes-archivadas");
    } catch (error) {
      console.error("Error al desarchivar la orden de compra:", error.message);
      const errorMsg = "Hubo un error al desarchivar la orden de compra.";
      if (req.xhr || req.headers.accept.indexOf("json") > -1) {
        return res.status(500).json({ errorMessage: errorMsg });
      }
      req.flash("errorMessage", errorMsg);
      res.redirect("/ordenes");
    }
  };

  checkPdfStatus = async (req, res) => {
    try {
      const { ordenes } = req.body;
      if (!Array.isArray(ordenes)) {
        return res.status(400).json({ error: "Datos inválidos" });
      }

      const ordenesData = await this.ordenesService.getOrdenesByIds(ordenes);

      const response = ordenesData.map((orden) => ({
        id_orden: orden.id_orden,
        ruta_archivo_pdf: orden.ruta_archivo_pdf
          ? orden.ruta_archivo_pdf.replace(/^"|"$/g, "")
          : null,
      }));

      res.json(response);
    } catch (error) {
      res.status(500).json({ error: "Error interno del servidor" });
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
