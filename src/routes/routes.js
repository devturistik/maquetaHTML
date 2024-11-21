// src/routes/routes.js
import express from "express";
import routesSolicitudes from "./routesSolicitudes.js";
import routesOrdenes from "./routesOrdenes.js";
import routesAdministracion from "./routesAdministracion.js";
import routesPerfil from "./routesPerfil.js";

const router = express.Router();

// Redirección de la raíz a /dashboard
router.get("/", (req, res) => {
  res.redirect("/dashboard");
});

// Renderizado de /dashboard
router.get("/dashboard", (req, res) => {
  res.render("dashboard");
});

// Rutas protegidas
router.use(routesSolicitudes);
router.use(routesOrdenes);
router.use(routesAdministracion);
router.use(routesPerfil);

export default router;
