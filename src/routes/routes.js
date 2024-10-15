// src/routes/routes.js
import express from "express";
import routesUsuarios from "./routesUsuarios.js";



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
router.use("/usuarios", routesUsuarios);



export default router;
