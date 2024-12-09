import BancoService from "../application/bancoService.js";

class BancoController {
  constructor() {
    this.bancoService = new BancoService();
  }

  // Mostrar la lista de Bancos con opción de filtrar por estatus
  listarBancos = async (req, res) => {
    try {
      const { estatus } = req.query; // Obtener el parámetro de estatus si existe
      let bancos;
      if (estatus !== undefined && estatus !== '') {
        bancos = await this.bancoService.obtenerBancosPorEstatus(parseInt(estatus));
      } else {
        bancos = await this.bancoService.obtenerTodosLosBancos();
      }
      res.render("administracion/banco/listar", { bancos, estatus });
    } catch (error) {
      console.error("Error al listar Bancos:", error);
      res.status(500).send("Error interno del servidor");
    }
  };

  // Mostrar el formulario para crear un nuevo Banco
  mostrarFormularioCrear = (req, res) => {
    res.render("administracion/banco/crear");
  };

  // Crear un nuevo Banco
  crearBanco = async (req, res) => {
    try {
      const { nombre_banco, estatus } = req.body;
      const estatusInt = parseInt(estatus);
      await this.bancoService.crearBanco({ nombre_banco, estatus: estatusInt });
      res.redirect("/administracion/bancos");
    } catch (error) {
      console.error("Error al crear Banco:", error);
      res.status(500).send("Error interno del servidor");
    }
  };

  // Mostrar el formulario para editar un Banco existente
  mostrarFormularioEditar = async (req, res) => {
    try {
      const id = req.params.id;
      const banco = await this.bancoService.obtenerBancoPorId(id);
      if (!banco) {
        return res.status(404).send("Banco no encontrado");
      }
      res.render("administracion/banco/editar", { banco });
    } catch (error) {
      console.error("Error al mostrar formulario de edición:", error);
      res.status(500).send("Error interno del servidor");
    }
  };

  // Actualizar un Banco existente
  actualizarBanco = async (req, res) => {
    try {
      const id = req.params.id;
      const { nombre_banco, estatus } = req.body;
      const estatusInt = parseInt(estatus);
      await this.bancoService.actualizarBanco(id, { nombre_banco, estatus: estatusInt });
      res.redirect("/administracion/bancos");
    } catch (error) {
      console.error("Error al actualizar Banco:", error);
      res.status(500).send("Error interno del servidor");
    }
  };

  // Activar un Banco
  activarBanco = async (req, res) => {
    try {
      const id = req.params.id;
      await this.bancoService.actualizarEstatus(id, 1);
      res.redirect("/administracion/bancos");
    } catch (error) {
      console.error("Error al activar Banco:", error);
      res.status(500).send("Error interno del servidor");
    }
  };

  // Desactivar un Banco
  desactivarBanco = async (req, res) => {
    try {
      const id = req.params.id;
      await this.bancoService.actualizarEstatus(id, 0);
      res.redirect("/administracion/bancos");
    } catch (error) {
      console.error("Error al desactivar Banco:", error);
      res.status(500).send("Error interno del servidor");
    }
  };
}

export default BancoController;
