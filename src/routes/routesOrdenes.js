// src/routes/routesOrdenes.js
import express from "express";
import OrdenesController from "../controllers/ordenesController.js";
import upload from "../middlewares/upload.js";

const router = express.Router();
const ordenesController = new OrdenesController();

// Ruta para renderizar la lista de órdenes
router.get("/ordenes", ordenesController.getAllOrdenes);

// Ruta para ver una orden específica
router.get("/ordenes/:id", ordenesController.getOrdenById);

// Ruta para renderizar el formulario para crear orden dada una solicitud
router.get("/ordenes-crear/:id", ordenesController.renderCreateForm);

// Ruta para procesar la creación de orden dada una solicitud
router.post(
  "/ordenes-crear/:id",
  upload.array("cotizacion", 10),
  ordenesController.createOrden
);

// Ruta API para obtener bancos por proveedor
router.get(
  "/api/proveedores/:proveedorId/bancos",
  ordenesController.getBancosPorProveedor
);

// Ruta API para obtener detalles de tipo de orden
router.get(
  "/api/tipos-orden/:tipoOrdenId/detalles",
  ordenesController.getDetallesTipoOrden
);

// Ruta API para obtener los productos
router.get("/api/productos", ordenesController.getProductos);

// Ruta para verificar el estado de los PDFs
router.post("/ordenes/check-pdf-status", ordenesController.checkPdfStatus);

// Ruta para renderizar la confirmación de cancelación
router.get("/ordenes-cancelar/:id", ordenesController.renderCancelConfirm);

// Ruta para cancelar una orden
router.post("/ordenes-cancelar/:id", ordenesController.cancelarOrden);

router.get("/ordenes-archivadas", ordenesController.getOrdenesArchivadas);

router.post("/ordenes-archivar/:id", ordenesController.archivarOrden);

router.post("/ordenes-desarchivar/:id", ordenesController.desarchivarOrden);

export default router;
