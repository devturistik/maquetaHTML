// src/middlewares/validateSolicitud.js
import { body, validationResult } from "express-validator";

export const validateSolicitud = [
  body("asunto")
    .trim()
    .notEmpty()
    .withMessage("El asunto es requerido.")
    .isLength({ max: 100 })
    .withMessage("El asunto no puede exceder 100 caracteres."),

  body("descripcion")
    .trim()
    .notEmpty()
    .withMessage("La descripción es requerida.")
    .isLength({ max: 300 })
    .withMessage("La descripción no puede exceder 300 caracteres."),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const extractedErrors = {};
      errors.array().map((err) => (extractedErrors[err.param] = err.msg));
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
