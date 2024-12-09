// src/routes/routesSolicitudes.js
import express from "express";
import SolicitudesController from "../controllers/solicitudesController.js";
import { validateSolicitud } from "../middlewares/validateSolicitud.js";
import upload from "../middlewares/upload.js";

const router = express.Router();
const solicitudesController = new SolicitudesController();

router.get("/solicitudes", solicitudesController.getAllSolicitudes);
router.get("/solicitudes/:id", solicitudesController.getSolicitudById);
router.get("/solicitudes/:id/archivos", solicitudesController.viewArchivos);
router.get(
  "/solicitudes/:id/ordenes",
  solicitudesController.viewOrdenesDeSolicitud
);
router.get(
  "/solicitudes/:id/descargar/:filename",
  solicitudesController.downloadArchivo
);
router.get("/solicitudes-crear", solicitudesController.renderCreateForm);

router.post(
  "/solicitudes-crear",
  upload.array("archivos", 10),
  validateSolicitud,
  solicitudesController.createSolicitud
);

router.get("/solicitudes-editar/:id", solicitudesController.renderEditForm);
router.post(
  "/solicitudes-editar/:id",
  upload.array("archivos", 10),
  validateSolicitud,
  solicitudesController.updateSolicitud
);

router.get("/solicitudes-eliminar/:id", solicitudesController.renderDeleteForm);
router.post("/solicitudes-eliminar/:id", solicitudesController.deleteSolicitud);

router.get(
  "/solicitudes-archivadas",
  solicitudesController.getArchivedSolicitudes
);

router.post(
  "/solicitudes-archivar/:id",
  solicitudesController.archiveSolicitud
);

router.post(
  "/solicitudes-desarchivar/:id",
  solicitudesController.desarchiveSolicitud
);

export default router;
