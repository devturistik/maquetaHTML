// src/controllers/ordenesController.js
import OrdenesService from "../application/ordenesService.js";
import SolicitudesService from "../application/solicitudesService.js";
import { encodeBase64, decodeBase64 } from "../utils/base64.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import path from "path";
import fs from "fs";
import PDFDocument from "pdfkit";

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
      try {
        solicitud.archivos = JSON.parse(solicitud.archivos || "[]");
      } catch (error) {
        console.error("Error al parsear los archivos de la solicitud:", error);
        solicitud.archivos = [];
      }

      const [
        proveedores,
        plazoPagos,
        empresas,
        tipoOrdenes,
        monedas,
        centroCostos,
        productos,
        detalleTipoOrden,
      ] = await Promise.all([
        this.ordenesService.getProveedores(),
        this.ordenesService.getPlazoPagos(),
        this.ordenesService.getEmpresas(),
        this.ordenesService.getTipoOrdenes(),
        this.ordenesService.getMonedas(),
        this.ordenesService.getCentroCostos(),
        this.ordenesService.getProductos(),
        this.ordenesService.getDetalleTipoOrden(),
      ]);

      const fechaActual = dayjs().tz("America/Santiago").format("YYYY-MM-DD");
      const fechaActualDisplay = dayjs()
        .tz("America/Santiago")
        .format("DD/MM/YYYY");

      res.render("orden/crear", {
        solicitud,
        proveedores,
        plazoPagos,
        empresas,
        tipoOrdenes,
        detalleTipoOrden,
        monedas,
        centroCostos,
        productos,
        cuentasContable: [
          { nombre: 'Caja' },
          { nombre: 'Banco' },
          { nombre: 'Clientes' },
          { nombre: 'Proveedores' },
          { nombre: 'Inventario' },
          { nombre: 'Capital' },
          { nombre: 'Ventas' },
          { nombre: 'Compras' }
      ],
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

      // Generar el código de la orden
      const codigo = generateCodigoOrden();

      // Manejar la subida de archivos
      const archivosPaths = cotizacion.map(
        (file) => `/uploads/${file.filename}`
      );
      const archivosJson = archivosPaths.length
        ? JSON.stringify(archivosPaths)
        : JSON.stringify([]);

      const subtotal = parseFloat(req.body.subtotal) || 0;
      const impuesto = parseFloat(req.body.impuesto) || 0;
      const retencion = parseFloat(req.body.retencion) || 0;
      const propina = parseFloat(req.body.propina) || 0;
      const total = parseFloat(req.body.total) || 0;

      const productos = req.body.producto ? req.body.producto : [];
      const cantidades = req.body.cantidad ? req.body.cantidad : [];
      const precios_unitarios = req.body.precio_unitario
        ? req.body.precio_unitario
        : [];

      const productosOrden = productos.map((id_producto, index) => ({
        id_producto: parseInt(id_producto),
        cantidad: parseInt(cantidades[index]),
        precio_unitario: parseFloat(precios_unitarios[index]),
        total_detalle:
          parseFloat(cantidades[index]) * parseFloat(precios_unitarios[index]),
        cant_x_recibir: parseInt(cantidades[index]),
      }));

      const moneda = await this.ordenesService.getMonedaById(
        parseInt(ordenMoneda)
      );
      const tipo_cambio = moneda ? parseFloat(moneda.CAMBIO) : 1;

      // Calcular fecha de vencimiento basada en plazo de pago
      const fechaVencimientoCalculada = calculateFechaVencimiento(
        parseInt(ordenPlazo)
      );

      const ordenData = {
        codigo: codigo,
        subtotal: subtotal * tipo_cambio,
        total: total * tipo_cambio,
        impuesto: impuesto * tipo_cambio,
        retencion: retencion * tipo_cambio,
        nota_creador: ordenNota,
        documentos_cotizacion: archivosJson,
        usuario_creador: `${nombre} ${apellido}`,
        correo_creador: correo,
        id_moneda: parseInt(ordenMoneda),
        id_solicitud: id_solicitud,
        id_proveedor: parseInt(ordenProveedor),
        id_tipo_orden: parseInt(ordenTipo),
        id_plazo: parseInt(ordenPlazo),
        nivel_aprobacion: 1, // Ajusta según tu lógica
        justificacion_rechazo: null,
        ruta_archivo_pdf: null, // Será actualizado después de generar el PDF
        total_local: total * tipo_cambio,
        creado_por: `${nombre} ${apellido}`,
        fecha_vencimiento: fechaVencimientoCalculada,
        productos: productosOrden,
      };

      const id_orden = await this.ordenesService.createOrden(ordenData);

      const encodedOrdenId = encodeBase64(id_orden);

      req.flash("successMessage", "Orden creada con éxito");
      res.redirect(`/ordenes/${encodedOrdenId}/pdf`);
    } catch (error) {
      if (error.validationErrors) {
        // Manejar errores de validación específicos
        res.render("orden/crear", {
          ...req.body,
          errorMessage: error.message,
          errors: error.validationErrors,
        });
      } else {
        console.error("Error al crear orden:", error.message);
        req.flash("errorMessage", "Error al crear la orden: " + error.message);
        res.redirect(`/ordenes-crear/${req.params.id}`);
      }
    }
  };

  getBancosPorProveedor = async (req, res) => {
    try {
      const { id_proveedor } = req.query;
      if (!id_proveedor) {
        return res.status(400).json({ error: "ID de proveedor es requerido" });
      }

      const bancos = await this.ordenesService.getBancosByProveedor(
        parseInt(id_proveedor)
      );
      res.json(bancos);
    } catch (error) {
      console.error("Error al obtener bancos por proveedor:", error.message);
      res.status(500).json({ error: "Error al obtener bancos por proveedor" });
    }
  };

  getMoneda = async (req, res) => {
    try {
      const { id_moneda } = req.query;
      if (!id_moneda) {
        return res.status(400).json({ error: "ID de moneda es requerido" });
      }

      const moneda = await this.ordenesService.getMonedaById(
        parseInt(id_moneda)
      );
      res.json(moneda);
    } catch (error) {
      console.error("Error al obtener moneda:", error.message);
      res.status(500).json({ error: "Error al obtener moneda" });
    }
  };

  // Método para obtener detalles de un producto
  getProductoDetalle = async (req, res) => {
    try {
      const { id_producto } = req.query;

      if (!id_producto) {
        return res.status(400).json({ error: "ID de producto es requerido." });
      }

      const productoId = parseInt(id_producto, 10);
      if (isNaN(productoId)) {
        return res.status(400).json({ error: "ID de producto inválido." });
      }

      const producto = await this.ordenesService.getProductoById(productoId);

      if (!producto) {
        return res.status(404).json({ error: "Producto no encontrado." });
      }

      res.json({
        ID_PRODUCTO: producto.ID_PRODUCTO,
        DESCRIPCION: producto.DESCRIPCION,
        PRECIO_UNITARIO: parseFloat(producto.PRECIO_UNITARIO).toFixed(2),
        UNIDAD: producto.UNIDAD,
        PRESENTACION: producto.PRESENTACION,
      });
    } catch (error) {
      console.error("Error en getProductoDetalle:", error.message);
      res.status(500).json({ error: "Error interno del servidor." });
    }
  };

  generatePdfOrden = async (req, res) => {
    try {
      const encodedId = req.params.id;
      const id_orden = decodeBase64(encodedId);
      const orden = await this.ordenesService.getOrdenById(id_orden);

      if (!orden) {
        req.flash("errorMessage", "Orden de compra no encontrada.");
        return res.redirect("/ordenes");
      }

      const proveedor = await this.ordenesService.getProveedorById(
        orden.id_proveedor
      );

      const bancos = await this.ordenesService.getBancosByProveedor(
        orden.id_proveedor
      );
      const banco = bancos.length > 0 ? bancos[0] : null;

      const moneda = await this.ordenesService.getMonedaById(orden.id_moneda);
      const productos = await this.ordenesService.getProductosByOrden(id_orden);

      const doc = new PDFDocument();

      const pdfDir = path.join(process.cwd(), "public", "pdfs");
      if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true });
      }
      const pdfPath = path.join(pdfDir, `OrdenCompra_${orden.id_orden}.pdf`);

      const writeStream = fs.createWriteStream(pdfPath);
      doc.pipe(writeStream);

      doc.fontSize(20).text("Orden de Compra", { align: "center" });
      doc.moveDown();

      doc.fontSize(12).text(`Código: ${orden.codigo}`);
      doc.text(
        `Fecha de Creación: ${dayjs(orden.created_at).format("DD/MM/YYYY")}`
      );
      doc.text(
        `Fecha de Vencimiento: ${dayjs(orden.fecha_vencimiento).format(
          "DD/MM/YYYY"
        )}`
      );
      doc.moveDown();

      doc.text(`Proveedor: ${proveedor.NOMBRE_PROVEEDOR}`);
      doc.text(`Documento: ${proveedor.DOCUMENTO_PROVEEDOR}`);
      doc.text(`Teléfono: ${proveedor.TELEFONO_PRINCIAL}`);
      doc.text(`Correo: ${proveedor.CORREO_PRINCIPAL}`);
      doc.moveDown();

      if (banco) {
        doc.text(`Banco: ${banco.NOMBRE_BANCO}`);
        doc.text(`Número de Cuenta: ${banco.NUMERO_CUENTA}`);
        doc.text(`Tipo de Cuenta: ${banco.TIPO_CUENTA}`);
        doc.text(`SWIFT: ${banco.SWIFT_CUENTA || "N/A"}`);
        doc.text(`ABA: ${banco.ABA_CUENTA || "N/A"}`);
        doc.text(`IBAN: ${banco.IBAN_CUENTA || "N/A"}`);
        doc.text(`Correo del Banco: ${banco.CORREO_BANCO || "N/A"}`);
      }
      doc.moveDown();

      doc.fontSize(14).text("Productos:", { underline: true });
      doc.fontSize(12);
      productos.forEach((producto, index) => {
        doc.text(
          `${index + 1}. ${producto.DESCRIPCION} - Cantidad: ${
            producto.cantidad
          } - Precio Unitario: $${producto.precio_unitario.toFixed(
            2
          )} - Total: $${(producto.cantidad * producto.precio_unitario).toFixed(
            2
          )}`
        );
      });
      doc.moveDown();

      doc.text(`Subtotal: $${orden.subtotal.toFixed(2)}`);
      doc.text(`Impuesto (16%): $${orden.impuesto.toFixed(2)}`);
      doc.text(`Retención (5%): $${orden.retencion.toFixed(2)}`);
      doc.text(`Propina (2%): $${orden.propina.toFixed(2)}`);
      doc
        .fontSize(14)
        .text(`Total: $${orden.total.toFixed(2)}`, { underline: true });
      doc.moveDown();

      if (orden.nota_creador) {
        doc.text(`Nota: ${orden.nota_creador}`);
        doc.moveDown();
      }

      doc.end();

      writeStream.on("finish", async () => {
        await this.ordenesService.updateOrden(id_orden, {
          ruta_archivo_pdf: `/pdfs/OrdenCompra_${orden.id_orden}.pdf`,
        });

        res.redirect(`/pdfs/OrdenCompra_${orden.id_orden}.pdf`);
      });

      writeStream.on("error", (err) => {
        console.error("Error al generar PDF:", err);
        req.flash("errorMessage", "Error al generar el PDF de la orden.");
        res.redirect(`/ordenes/${encodedId}`);
      });
    } catch (error) {
      console.error("Error al generar PDF de la orden:", error.message);
      req.flash("errorMessage", "Error al generar el PDF de la orden.");
      res.redirect(`/ordenes`);
    }
  };

  renderEditForm = async (req, res) => {
    try {
      const id = decodeBase64(req.params.id);
      const orden = await this.ordenesService.getOrdenById(id);
      if (!orden) {
        req.flash("errorMessage", "Orden de compra no encontrada.");
        return res.redirect("/ordenes");
      }

      orden.id = encodeBase64(id);

      // Obtener productos de la orden
      const productos = await this.ordenesService.getProductosByOrden(id);

      // Obtener listas necesarias para el formulario
      const [
        proveedores,
        plazoPagos,
        empresas,
        tipoOrdenes,
        monedas,
        centroCostos,
        todosProductos,
      ] = await Promise.all([
        this.ordenesService.getProveedores(),
        this.ordenesService.getPlazoPagos(),
        this.ordenesService.getEmpresas(),
        this.ordenesService.getTipoOrdenes(),
        this.ordenesService.getMonedas(),
        this.ordenesService.getCentroCostos(),
        this.ordenesService.getProductos(),
      ]);

      res.render("orden/editar", {
        orden,
        productos,
        proveedores,
        plazoPagos,
        empresas,
        tipoOrdenes,
        monedas,
        centroCostos,
        todosProductos,
        errors: {},
      });
    } catch (error) {
      console.error("Error al obtener orden para editar:", error.message);
      res.status(500).send("Error al obtener orden para editar");
    }
  };

  updateOrden = async (req, res) => {
    try {
      const id = decodeBase64(req.params.id);
      const {
        subtotal,
        impuesto,
        retencion,
        total,
        ordenProveedor,
        ordenMoneda,
        ordenPlazo,
        ordenTipo,
        ordenSolicitud,
        nota_creador,
      } = req.body;

      const archivos = req.files && req.files.length > 0 ? req.files : [];
      const archivosPaths = archivos.map((file) => `/uploads/${file.filename}`);
      const documentosCotizacion = archivosPaths.length
        ? JSON.stringify(archivosPaths)
        : JSON.stringify([]);

      const { nombre, apellido, correo } = res.locals.user || {};

      const total_local =
        parseFloat(total) * parseFloat(req.body.tipo_cambio || 1);

      const ordenData = {
        subtotal: parseFloat(subtotal) || 0,
        total: parseFloat(total) || 0,
        impuesto: parseFloat(impuesto) || 0,
        retencion: parseFloat(retencion) || 0,
        usuario_creador: `${nombre} ${apellido}`,
        correo_creador: correo,
        nota_creador: nota_creador,
        documentos_cotizacion: documentosCotizacion,
        nivel_aprobacion: 1, // Ajusta según tu lógica
        justificacion_rechazo: null,
        ruta_archivo_pdf: null, // Opcional: si deseas actualizarlo
        total_local: total_local,
        id_moneda: parseInt(ordenMoneda),
        id_solicitud: parseInt(ordenSolicitud),
        id_proveedor: parseInt(ordenProveedor),
        id_tipo_orden: parseInt(ordenTipo),
        id_plazo: parseInt(ordenPlazo),
        creado_por: `${nombre} ${apellido}`,
      };

      await this.ordenesService.updateOrden(id, ordenData);

      req.flash("successMessage", "Orden actualizada con éxito");
      res.redirect(`/ordenes/${encodeBase64(id)}`);
    } catch (error) {
      console.error("Error al actualizar orden:", error.message);
      req.flash(
        "errorMessage",
        "Error al actualizar la orden: " + error.message
      );
      res.redirect(`/ordenes-editar/${req.params.id}`);
    }
  };

  deleteOrden = async (req, res) => {
    try {
      const id = decodeBase64(req.params.id);
      await this.ordenesService.deleteOrden(id);

      req.flash("successMessage", "Orden eliminada con éxito");
      res.redirect("/ordenes");
    } catch (error) {
      console.error("Error al eliminar orden:", error.message);
      req.flash("errorMessage", "Error al eliminar la orden: " + error.message);
      res.redirect("/ordenes");
    }
  };
}

function generateCodigoOrden() {
  const date = dayjs().format("YYYYMMDD");
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `OC-${date}-${randomNum}`;
}

function calculateFechaVencimiento(plazoDias) {
  const fecha = dayjs().tz("America/Santiago").add(plazoDias, "day");
  return fecha.format("YYYY-MM-DD");
}

export default OrdenesController;
