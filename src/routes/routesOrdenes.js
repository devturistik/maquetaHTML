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

export default router;
