// src/routes/routesSolicitudes.js
import express from "express";
import SolicitudesController from "../controllers/solicitudesController.js";
import multer from "multer";

const router = express.Router();
const solicitudesController = new SolicitudesController();

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB por archivo
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Tipo de archivo no permitido"), false);
    }
  },
});

// Ruta para renderizar la lista de solicitudes
router.get("/solicitudes", solicitudesController.getAllSolicitudes);

// Ruta para ver una solicitud específica
router.get("/solicitudes/:id", solicitudesController.getSolicitudById);

// Ruta para ver los archivos adjuntos de una solicitud específica
router.get("/solicitudes/ver-archivos/:id", solicitudesController.viewArchivos);

// Ruta para renderizar el formulario para crear solicitud
router.get("/solicitudes-crear", solicitudesController.renderCreateForm);

// Ruta para procesar la creación de solicitud
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

// Ruta para mostrar el formulario de justificación de eliminación
router.get("/solicitudes-eliminar/:id", solicitudesController.renderDeleteForm);

// Ruta para eliminar una solicitud
router.post("/solicitudes-eliminar/:id", solicitudesController.deleteSolicitud);

export default router;
