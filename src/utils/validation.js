// src/utils/validation.js
export const validateSolicitudData = ({ asunto, descripcion, archivos }) => {
  const errors = {};

  // Validar el asunto
  if (!asunto || asunto.trim() === "") {
    errors.asunto = "El asunto es requerido.";
  } else if (asunto.length < 3) {
    errors.asunto = "El asunto debe tener al menos 3 caracteres.";
  }

  // Validar la descripción
  if (!descripcion || descripcion.trim() === "") {
    errors.descripcion = "La descripción es requerida.";
  } else if (descripcion.length < 5) {
    errors.descripcion = "La descripción debe tener al menos 5 caracteres.";
  }

  // Validar los archivos
  if (Array.isArray(archivos) && archivos.length > 10) {
    errors.archivos = "No puedes subir más de 10 archivos.";
  }

  const totalSize = Array.isArray(archivos)
    ? archivos.reduce((acc, file) => acc + (file.size || 0), 0)
    : 0;
  if (totalSize > 10 * 1024 * 1024) {
    errors.archivos =
      "El tamaño total de los archivos no puede superar los 10 MB.";
  }

  return Object.keys(errors).length > 0 ? errors : null;
};
