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
          { nombre: "Caja" },
          { nombre: "Banco" },
          { nombre: "Clientes" },
          { nombre: "Proveedores" },
          { nombre: "Inventario" },
          { nombre: "Capital" },
          { nombre: "Ventas" },
          { nombre: "Compras" },
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

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Eliminar archivos subidos si hay errores de validación
        if (req.files && req.files.length > 0) {
          req.files.forEach(file => {
            fs.unlink(file.path, (err) => {
              if (err) console.error("Error al eliminar archivo:", err.message);
            });
          });
        }

        // Renderizar el formulario nuevamente con los errores y los datos ingresados
        const solicitud = await this.solicitudesService.getSolicitudById(id_solicitud);
        const proveedores = await this.ordenesService.getProveedores();
        const plazoPagos = await this.ordenesService.getPlazoPagos();
        const empresas = await this.ordenesService.getEmpresas();
        const centroCostos = await this.ordenesService.getCentroCostos();
        const tipoOrdenes = await this.ordenesService.getTipoOrdenes();
        const monedas = await this.ordenesService.getMonedas();
        const productos = await this.ordenesService.getProductos();
        const detalleTipoOrden = await this.ordenesService.getDetalleTipoOrden();
        const cuentasContable = await this.ordenesService.getCuentasContable();

        return res.status(400).render("ordenes/crear", {
          solicitud,
          proveedores,
          plazoPagos,
          empresas,
          centroCostos,
          tipoOrdenes,
          monedas,
          productos,
          detalleTipoOrden,
          cuentasContable,
          fechaActual: dayjs().tz("America/Santiago").format("YYYY-MM-DD"),
          errors: errors.mapped(),
          errorMessage: "Por favor corrige los errores en el formulario."
        });
      }

      const {
        ordenProveedor,
        ordenBanco,
        ordenPlazo,
        ordenEmpresa,
        ordenCentroCosto,
        ordenTipo,
        ordenMoneda,
        ordenNota
      } = req.body;

      const productosSeleccionados = Array.isArray(req.body.producto) ? req.body.producto : [req.body.producto];
      const cantidades = Array.isArray(req.body.cantidad) ? req.body.cantidad : [req.body.cantidad];
      const preciosUnitarios = Array.isArray(req.body.precio_unitario) ? req.body.precio_unitario : [req.body.precio_unitario];

      if (productosSeleccionados.length === 0 || !productosSeleccionados[0]) {
        req.flash("errorMessage", "Debe agregar al menos un producto a la orden.");
        return res.redirect(`/ordenes-crear/${req.params.id}`);
      }

      let ruta_archivo_pdf = null;
      let documentos_cotizacion = null;
      if (req.files && req.files.length > 0) {
        ruta_archivo_pdf = req.files[0].path;
        if (req.files.length > 1) {
          documentos_cotizacion = req.files.slice(1).map(file => file.path).join(';');
        }
      }

      const detalleTipoOrden = await this.ordenesService.getDetalleTipoOrden();

      let subtotal = 0;
      const detalles = [];
      for (let i = 0; i < productosSeleccionados.length; i++) {
        const id_producto = parseInt(productosSeleccionados[i]);
        const cantidad = parseFloat(cantidades[i]);
        const precio_unitario = parseFloat(preciosUnitarios[i]);

        if (isNaN(id_producto) || isNaN(cantidad) || isNaN(precio_unitario)) {
          req.flash("errorMessage", "Datos de productos inválidos.");
          return res.redirect(`/ordenes-crear/${req.params.id}`);
        }

        const valor_total = cantidad * precio_unitario;
        subtotal += valor_total;

        detalles.push({
          id_solicitud,
          id_producto,
          precio_unitario,
          cantidad,
          valor_total,
          unidad: 'Unidad'
        });
      }

      let impuesto = 0;
      let retencion = 0;
      let propina = 0;

      const detallesFiltrados = detalleTipoOrden.filter(detalle => detalle.id_tipo_orden == ordenTipo && detalle.activo);

      detallesFiltrados.forEach(detalle => {
        const nombre_detalle = detalle.nombre_detalle.trim().toLowerCase();
        const cantidad = parseFloat(detalle.cantidad);
        const tipo_detalle = detalle.tipo_detalle.trim().toLowerCase();

        if (nombre_detalle === 'impuesto') {
          if (tipo_detalle === 'porcentaje' || tipo_detalle === '%') {
            impuesto += subtotal * (cantidad / 100);
          } else {
            impuesto += cantidad;
          }
        }

        if (nombre_detalle === 'retencion') {
          if (tipo_detalle === 'porcentaje' || tipo_detalle === '%') {
            retencion += subtotal * (cantidad / 100);
          } else {
            retencion += cantidad;
          }
        }

        if (nombre_detalle === 'propina') {
          if (tipo_detalle === 'porcentaje' || tipo_detalle === '%') {
            propina += subtotal * (cantidad / 100);
          } else {
            propina += cantidad;
          }
        }
      });

      const total = subtotal + impuesto - retencion + propina;
      const total_local = total;

      const codigoOrden = generateCodigoOrden();

      const fecha_vencimiento = calculateFechaVencimiento(parseInt(ordenPlazo));

      const ordenData = {
        codigo: codigoOrden,
        subtotal: subtotal.toFixed(2),
        total: total.toFixed(2),
        impuesto: impuesto.toFixed(2),
        retencion: retencion.toFixed(2),
        usuario_creador: `${res.locals.user.nombre} ${res.locals.user.apellido}`,
        correo_creador: res.locals.user.correo,
        nota_creador: ordenNota || null,
        ruta_archivo_pdf: ruta_archivo_pdf || null,
        documentos_cotizacion: documentos_cotizacion || null,
        nivel_aprobacion: 1, // Ajusta según tu lógica
        total_local: total_local.toFixed(2),
        id_moneda: parseInt(ordenMoneda),
        id_empresa: ordenEmpresa ? parseInt(ordenEmpresa) : null,
        id_solicitud: id_solicitud,
        id_proveedor: parseInt(ordenProveedor),
        id_tipo_orden: parseInt(ordenTipo),
        id_plazo: parseInt(ordenPlazo),
        creado_por: `${res.locals.user.nombre} ${res.locals.user.apellido}`,
        fecha_vencimiento: fecha_vencimiento
      };

      const id_orden = await this.ordenesService.createOrden(ordenData, detalles, req.files);

      const ordenCreada = await this.ordenesService.getOrdenById(id_orden);

      const [
        Empresa,
        CentroCosto,
        Proveedor,
        Banco,
        PlazoPago,
        productosOrden
      ] = await Promise.all([
        this.ordenesService.getEmpresaById(ordenCreada.id_empresa),
        this.ordenesService.getCentroCostoById(ordenCreada.id_centro_costo),
        this.ordenesService.getProveedorById(ordenCreada.id_proveedor),
        this.ordenesService.getBancoById(ordenCreada.id_banco),
        this.ordenesService.getPlazoPagoById(ordenCreada.id_plazo),
        this.ordenesService.getProductosByOrden(id_orden),
      ]);

      const data = {
        Empresa,
        CentroCosto,
        Proveedor,
        Banco,
        PlazoPago,
        direccionDespacho: 'AV EL CERRO 751, Providencia, Región Metropolitana de Santiago',
        contacto: 'KATHERINNE PEÑA, KPENA@TURISTIK.COM',
        OrdenNota: ordenCreada.nota_creador,
        ordenFecha: dayjs(ordenCreada.created_at).format("DD/MM/YYYY"),
        ordenID: ordenCreada.codigo,
        productos: productosOrden.map(producto => ({
          codigo: producto.codigo || 'N/A',
          descripcion: producto.descripcion,
          cantidad: producto.cantidad,
          unidad: producto.unidad,
          precio_unitario: parseFloat(producto.precio_unitario),
          valor_total: parseFloat(producto.valor_total)
        })),
        subtotal: parseFloat(ordenCreada.subtotal),
        descuento: 0.00,
        cargos: 0.00,
        impuesto: parseFloat(ordenCreada.impuesto),
        retencion: parseFloat(ordenCreada.retencion),
        total: parseFloat(ordenCreada.total),
        monedaSymbol: "US$"
      };

      res.render("orden/templates/pdfTemplate.ejs", data);
    } catch (error) {
      console.error("Error al crear orden:", error.message);

      // Manejo de errores de validación específicos
      if (error.validationErrors) {
        const encodedId = req.params.id;
        const id_solicitud = decodeBase64(encodedId);
        const solicitud = await this.solicitudesService.getSolicitudById(id_solicitud);
        const proveedores = await this.ordenesService.getProveedores();
        const plazoPagos = await this.ordenesService.getPlazoPagos();
        const empresas = await this.ordenesService.getEmpresas();
        const centroCostos = await this.ordenesService.getCentroCostos();
        const tipoOrdenes = await this.ordenesService.getTipoOrdenes();
        const monedas = await this.ordenesService.getMonedas();
        const productos = await this.ordenesService.getProductos();
        const detalleTipoOrden = await this.ordenesService.getDetalleTipoOrden();
        const cuentasContable = await this.ordenesService.getCuentasContable();

        res.render("ordenes/crear", {
          solicitud,
          proveedores,
          plazoPagos,
          empresas,
          centroCostos,
          tipoOrdenes,
          monedas,
          productos,
          detalleTipoOrden,
          cuentasContable,
          fechaActual: dayjs().tz("America/Santiago").format("YYYY-MM-DD"),
          fechaActualDisplay: dayjs().tz("America/Santiago").format("DD/MM/YYYY"),
          errors: error.validationErrors,
          errorMessage: "Por favor corrige los errores en el formulario."
        });
      } else {
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
        nivel_aprobacion: 1,
        justificacion_rechazo: null,
        ruta_archivo_pdf: null,
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

export default OrdenesController;
