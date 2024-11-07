// src/utils/validation.js

export const validateSolicitudData = (data) => {
  const errors = {};

  // Validar Asunto
  if (!data.asunto || data.asunto.trim() === "") {
    errors.asunto = "El asunto es requerido.";
  } else if (data.asunto.length > 255) {
    errors.asunto = "El asunto no puede exceder 255 caracteres.";
  }

  // Validar Descripción
  if (!data.descripcion || data.descripcion.trim() === "") {
    errors.descripcion = "La descripción es requerida.";
  }

  // Validar Archivos (opcional)
  if (data.archivos) {
    try {
      const archivos = JSON.parse(data.archivos);
      if (!Array.isArray(archivos)) {
        errors.archivos = "Formato de archivos inválido.";
      } else {
        for (const archivo of archivos) {
          if (!archivo.url || typeof archivo.eliminado !== "number") {
            errors.archivos = "Datos de archivos incompletos.";
            break;
          }
        }
      }
    } catch (e) {
      errors.archivos = "Formato de archivos inválido.";
    }
  }

  return Object.keys(errors).length > 0 ? errors : null;
};
