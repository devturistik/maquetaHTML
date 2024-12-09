import EmpresaService from "../application/empresaService.js";

class EmpresaController {
  constructor() {
    this.empresaService = new EmpresaService();
  }

  // Mostrar la lista de Empresas con opción de filtrar por estatus y no eliminadas
  listarEmpresas = async (req, res) => {
    try {
      const { estatus_empresa } = req.query; // Obtener el parámetro de estatus si existe
      let empresas;
      if (estatus_empresa !== undefined && estatus_empresa !== "") {
        empresas = await this.empresaService.obtenerEmpresasPorEstatus(
          estatus_empresa
        );
      } else {
        empresas = await this.empresaService.obtenerTodasLasEmpresas();
      }
      res.render("administracion/empresa/listar", {
        empresas,
        estatus_empresa,
      });
    } catch (error) {
      console.error("Error al listar Empresas:", error);
      res.status(500).send("Error interno del servidor");
    }
  };

  // Mostrar el formulario para crear una nueva Empresa
  mostrarFormularioCrear = (req, res) => {
    res.render("administracion/empresa/crear");
  };

  // Crear una nueva Empresa
  crearEmpresa = async (req, res) => {
    try {
      const {
        nombre,
        documento,
        giro,
        direccion,
        telefono,
        correo,
        encargado,
        estatus_empresa,
      } = req.body;

      // Validaciones básicas
      if (
        !nombre ||
        !documento ||
        !giro ||
        !direccion ||
        !telefono ||
        !correo ||
        !encargado ||
        !estatus_empresa
      ) {
        return res.render("administracion/empresa/crear", {
          error: "Todos los campos son obligatorios.",
          data: req.body,
        });
      }

      await this.empresaService.crearEmpresa({
        nombre,
        documento,
        giro,
        direccion,
        telefono,
        correo,
        encargado,
        estatus_empresa,
        eliminado: 0, // Por defecto, no eliminado
      });
      res.redirect("/administracion/empresa");
    } catch (error) {
      console.error("Error al crear Empresa:", error);
      res.render("administracion/empresa/crear", {
        error: "Error interno del servidor.",
        data: req.body,
      });
    }
  };

  // Mostrar el formulario para editar una Empresa existente
  mostrarFormularioEditar = async (req, res) => {
    try {
      const id = req.params.id;
      const empresa = await this.empresaService.obtenerEmpresaPorId(id);
      if (!empresa) {
        return res.status(404).send("Empresa no encontrada");
      }
      res.render("administracion/empresa/editar", { empresa });
    } catch (error) {
      console.error("Error al mostrar formulario de edición:", error);
      res.status(500).send("Error interno del servidor");
    }
  };

  // Actualizar una Empresa existente
  actualizarEmpresa = async (req, res) => {
    try {
      const id = req.params.id;
      const {
        nombre,
        documento,
        giro,
        direccion,
        telefono,
        correo,
        encargado,
        estatus_empresa,
      } = req.body;

      // Validaciones básicas
      if (
        !nombre ||
        !documento ||
        !giro ||
        !direccion ||
        !telefono ||
        !correo ||
        !encargado ||
        !estatus_empresa
      ) {
        const empresa = await this.empresaService.obtenerEmpresaPorId(id);
        return res.render("administracion/empresa/editar", {
          empresa,
          error: "Todos los campos son obligatorios.",
        });
      }

      await this.empresaService.actualizarEmpresa(id, {
        nombre,
        documento,
        giro,
        direccion,
        telefono,
        correo,
        encargado,
        estatus_empresa,
      });
      res.redirect("/administracion/empresa");
    } catch (error) {
      console.error("Error al actualizar Empresa:", error);
      const empresa = await this.empresaService.obtenerEmpresaPorId(
        req.params.id
      );
      res.render("administracion/empresa/editar", {
        empresa,
        error: "Error interno del servidor.",
      });
    }
  };

  // Activar una Empresa
  activarEmpresa = async (req, res) => {
    try {
      const id = req.params.id;
      await this.empresaService.actualizarEstatus(id, "1");
      res.redirect("/administracion/empresa");
    } catch (error) {
      console.error("Error al activar Empresa:", error);
      res.status(500).send("Error interno del servidor");
    }
  };

  // Desactivar una Empresa
  desactivarEmpresa = async (req, res) => {
    try {
      const id = req.params.id;
      await this.empresaService.actualizarEstatus(id, "0");
      res.redirect("/administracion/empresa");
    } catch (error) {
      console.error("Error al desactivar Empresa:", error);
      res.status(500).send("Error interno del servidor");
    }
  };
}

export default EmpresaController;
