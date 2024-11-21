// src/routes/routesPerfil.js
import express from "express";
import PerfilController from "../controllers/perfilController.js";

const router = express.Router();
const perfilController = new PerfilController();

// Ruta para mostrar los datos del perfil
router.get("/perfil", perfilController.mostrarPerfil);

export default router;
