// src/controllers/administracionController.js
import AdministracionService from "../application/administracionService.js";

class AdministracionController {
  constructor() {
    this.administracionService = new AdministracionService();
  }

  renderTables = async (req, res) => {
    try {
      res.render("administracion");
    } catch (error) {
      console.error("Error al renderizar las tablas de administración:", error);
      res.status(500).send("Error interno del servidor");
    }
  };
}

export default AdministracionController;
