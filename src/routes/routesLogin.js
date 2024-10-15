// src/routes/routesLogin.js
import express from "express";
import { login, logout } from "../controllers/authController.js";

const router = express.Router();

// Redirige al dashboard si ya está autenticado
router.get("/login", (req, res) => {
  if (req.session.user) {
    return res.redirect("/dashboard");
  }
  res.render("login", { title: "Login", error: null });
});

// Manejo de inicio de sesión
router.post("/login", login);

// Cierre de sesión
router.get("/logout", logout);

export default router;
