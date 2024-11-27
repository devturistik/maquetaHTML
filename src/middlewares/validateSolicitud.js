// src/middlewares/validateSolicitud.js
import { check, validationResult } from "express-validator";

export const validateSolicitud = [
  check("asunto")
    .notEmpty()
    .withMessage("El asunto es requerido.")
    .trim()
    .escape(),
  check("descripcion")
    .notEmpty()
    .withMessage("La descripción es requerida.")
    .trim()
    .escape(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const extractedErrors = {};
      errors.array().forEach((err) => {
        extractedErrors[err.param] = err.msg;
      });

      return res.render("solicitud/crear", {
        errors: extractedErrors,
        asunto: req.body.asunto,
        descripcion: req.body.descripcion,
        successMessage: "",
        errorMessage: "Por favor, corrige los errores en el formulario.",
      });
    }
    next();
  },
];
