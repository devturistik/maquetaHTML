// src/controllers/administracionController.js
import AdministracionService from "../application/administracionService.js";

class AdministracionController {
  constructor() {
    this.administracionService = new AdministracionService();
  }

  renderTables = async (req, res) => {
    try {
      const tablas = await this.administracionService.getTables();
      res.render("administracion", {
        tablas,
      });
    } catch (error) {
      console.error("Error al renderizar las tablas de administración:", error);
      res.status(500).send("Error interno del servidor");
    }
  };

  listarRegistros = async (req, res) => {
    try {
      const tabla = req.params.tabla;
      const registros = await this.administracionService.obtenerRegistros(
        tabla
      );
      res.render("administracion/lista", {
        tabla,
        registros,
      });
    } catch (error) {
      console.error(`Error al listar registros de la tabla ${tabla}:`, error);
      res.status(500).send("Error interno del servidor");
    }
  };

  mostrarFormularioCrear = async (req, res) => {
    try {
      const tabla = req.params.tabla;
      const columnas = await this.administracionService.obtenerColumnas(tabla);
      res.render("administracion/crear", {
        tabla,
        columnas,
      });
    } catch (error) {
      console.error(
        `Error al mostrar formulario de creación para la tabla ${tabla}:`,
        error
      );
      res.status(500).send("Error interno del servidor");
    }
  };

  crearRegistro = async (req, res) => {
    try {
      const tabla = req.params.tabla;
      const datos = req.body;
      await this.administracionService.crearRegistro(tabla, datos);
      res.redirect(`/administracion/${tabla}`);
    } catch (error) {
      console.error(`Error al crear registro en la tabla ${tabla}:`, error);
      res.status(500).send("Error interno del servidor");
    }
  };

  mostrarFormularioEditar = async (req, res) => {
    try {
      const tabla = req.params.tabla;
      const id = req.params.id;
      const registro = await this.administracionService.obtenerRegistroPorId(
        tabla,
        id
      );
      res.render("administracion/editar", {
        tabla,
        registro,
      });
    } catch (error) {
      console.error(`Error al obtener registro de la tabla ${tabla}:`, error);
      res.status(500).send("Error interno del servidor");
    }
  };

  actualizarRegistro = async (req, res) => {
    try {
      const tabla = req.params.tabla;
      const id = req.params.id;
      const datos = req.body;
      await this.administracionService.actualizarRegistro(tabla, id, datos);
      res.redirect(`/administracion/${tabla}`);
    } catch (error) {
      console.error(
        `Error al actualizar registro en la tabla ${tabla}:`,
        error
      );
      res.status(500).send("Error interno del servidor");
    }
  };

  eliminarRegistro = async (req, res) => {
    try {
      const tabla = req.params.tabla;
      const id = req.params.id;
      await this.administracionService.eliminarRegistro(tabla, id);
      res.redirect(`/administracion/${tabla}`);
    } catch (error) {
      console.error(`Error al eliminar registro de la tabla ${tabla}:`, error);
      res.status(500).send("Error interno del servidor");
    }
  };
}

export default AdministracionController;
