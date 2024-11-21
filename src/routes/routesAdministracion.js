// src/routes/routesAdministracion.js
import express from "express";
import AdministracionController from "../controllers/administracionController.js";

const router = express.Router();
const administracionController = new AdministracionController();

router.get("/administracion", administracionController.renderTables);

// Ruta genérica para listar registros de cualquier tabla
router.get("/administracion/:tabla", administracionController.listarRegistros);

// Rutas genéricas para CRUD
router.get(
  "/administracion/:tabla/crear",
  administracionController.mostrarFormularioCrear
);
router.post(
  "/administracion/:tabla/crear",
  administracionController.crearRegistro
);
router.get(
  "/administracion/:tabla/editar/:id",
  administracionController.mostrarFormularioEditar
);
router.post(
  "/administracion/:tabla/editar/:id",
  administracionController.actualizarRegistro
);
router.post(
  "/administracion/:tabla/eliminar/:id",
  administracionController.eliminarRegistro
);

export default router;
