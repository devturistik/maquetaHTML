// src/middlewares/upload.js
import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB por archivo
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      // Documentos de Word
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      // Hojas de cálculo de Excel
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      // Presentaciones de PowerPoint
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      // Archivos PDF
      "application/pdf",
      // Imágenes
      "image/jpeg",
      "image/png",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Tipo de archivo no permitido"), false);
    }
  },
});

export default upload;
