// src/routes/routesSolicitudes.js
import express from "express";
import SolicitudesController from "../controllers/solicitudesController.js";
import upload from "../middlewares/upload.js";

const router = express.Router();
const solicitudesController = new SolicitudesController();

// Ruta para renderizar la lista de solicitudes
router.get("/solicitudes", solicitudesController.getAllSolicitudes);

// Ruta para ver una solicitud específica
router.get("/solicitudes/:id", solicitudesController.getSolicitudById);

// Ruta para ver los archivos de una solicitud específica
router.get("/solicitudes/ver-archivos/:id", solicitudesController.viewArchivos);

// Ruta para renderizar el formulario para crear una solicitud
router.get("/solicitudes-crear", solicitudesController.renderCreateForm);

// Ruta para procesar la creación de una solicitud
router.post(
  "/solicitudes-crear",
  upload.array("archivos", 10),
  solicitudesController.createSolicitud
);

// Ruta para renderizar el formulario para editar una solicitud
router.get("/solicitudes-editar/:id", solicitudesController.renderEditForm);

// Ruta para procesar la edición de una solicitud
router.post(
  "/solicitudes-editar/:id",
  upload.array("archivos", 10),
  solicitudesController.updateSolicitud
);

// Rutas para cancelar la edicion de una solicitud específica
router.get(
  "/solicitudes-cancelar-edicion/:id",
  solicitudesController.cancelarEdicion
);
router.post(
  "/solicitudes-cancelar-edicion/:id",
  solicitudesController.cancelarEdicion
);

// Rutas para eliminar una solicitud específica
router.get("/solicitudes-eliminar/:id", solicitudesController.renderDeleteForm);
router.post("/solicitudes-eliminar/:id", solicitudesController.deleteSolicitud);

export default router;
