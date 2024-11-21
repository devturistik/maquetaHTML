// src/routes/routesAdministracion.js
import express from "express";
import AdministracionController from "../controllers/administracionController.js";

const router = express.Router();
const administracionController = new AdministracionController();

router.get("/administracion", administracionController.renderTables);

router.get("/administracion/:tabla", administracionController.listarRegistros);

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
router.post(
  "/administracion/:tabla/eliminar/:id/confirmar",
  administracionController.confirmarEliminarFisico
);

export default router;
