// src/routes/routesSolicitudes.js
import express from "express";
import SolicitudesController from "../controllers/solicitudesController.js";

const router = express.Router();
const solicitudesController = new SolicitudesController();

// Ruta para renderizar la lista de solicitudes
router.get("/solicitudes", solicitudesController.getAllSolicitudes);

// Ruta para ver una solicitud específica
router.get("/solicitudes/:id", solicitudesController.getSolicitudById);

// Ruta para renderizar el formulario para crear solicitud
router.get("/solicitudes-crear", solicitudesController.renderCreateForm);

// Ruta para procesar la creación de solicitud
router.post("/solicitudes-crear", solicitudesController.createSolicitud);

// Ruta para renderizar el formulario para editar una solicitud
router.get("/solicitudes-editar/:id", solicitudesController.renderEditForm);

// Ruta para procesar la edición de una solicitud
router.post("/solicitudes-editar/:id", solicitudesController.updateSolicitud);

// Ruta para mostrar el formulario de justificación de eliminación
router.get("/solicitudes-eliminar/:id", solicitudesController.renderDeleteForm);

// Ruta para eliminar una solicitud
router.post("/solicitudes-eliminar/:id", solicitudesController.deleteSolicitud);

export default router;
