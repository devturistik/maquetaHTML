// src/routes/routesOrdenes.js
import express from "express";
import OrdenesController from "../controllers/ordenesController.js";

const router = express.Router();
const ordenesController = new OrdenesController();

// Ruta para renderizar la lista de ordenes
router.get("/ordenes", ordenesController.getAllOrdenes);

// Ruta para ver una orden específica
router.get("/ordenes/:id", ordenesController.getOrdenById);

// Ruta para renderizar el formulario para crear orden dada una solicitud
router.get("/ordenes-crear/:id", ordenesController.renderCreateForm);

// Ruta para procesar la creación de orden dada una solicitud
router.post("/ordenes-crear/:id", ordenesController.createOrden);

// Ruta para renderizar el formulario para editar una orden
router.get("/ordenes/editar/:id", ordenesController.renderEditForm);

// Ruta para procesar la edición de una orden
router.post("/ordenes/editar/:id", ordenesController.updateOrden);

// Ruta para eliminar una orden
router.post("/ordenes/eliminar/:id", ordenesController.deleteOrden);

export default router;
