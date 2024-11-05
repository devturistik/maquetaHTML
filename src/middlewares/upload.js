// src/middlewares/upload.js
import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limite de 10 MB por archivo
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|pdf|docx/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      file.originalname.toLowerCase().split(".").pop()
    );

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Error: Tipo de archivo no permitido!"));
  },
});

export default upload;
