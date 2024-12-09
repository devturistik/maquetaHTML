import CuentaService from "../application/cuentaService.js";

class CuentaController {
  constructor() {
    this.cuentaService = new CuentaService();
  }

  // Mostrar la lista de Cuentas
  listarCuentas = async (req, res) => {
    try {
      const cuentas = await this.cuentaService.obtenerTodasLasCuentas();
      res.render("administracion/cuentas/listar", { cuentas });
    } catch (error) {
      console.error("Error al listar Cuentas:", error);
      res.status(500).send("Error interno del servidor");
    }
  };

  // Mostrar el formulario para crear una nueva Cuenta
  mostrarFormularioCrear = (req, res) => {
    res.render("administracion/cuentas/crear");
  };

  // Crear una nueva Cuenta
  crearCuenta = async (req, res) => {
    try {
      const { codigo, nombre_cuenta } = req.body;

      // Validación de campos
      if (!codigo || !nombre_cuenta) {
        return res.render("administracion/cuentas/crear", {
          error: "Todos los campos son obligatorios.",
          codigo,
          nombre_cuenta,
        });
      }

      await this.cuentaService.crearCuenta({ codigo, nombre_cuenta });
      res.redirect("/administracion/cuentas");
    } catch (error) {
      console.error("Error al crear Cuenta:", error);
      res.render("administracion/cuentas/crear", {
        error: "Error interno del servidor.",
        codigo: req.body.codigo,
        nombre_cuenta: req.body.nombre_cuenta,
      });
    }
  };

  // Mostrar el formulario para editar una Cuenta existente
  mostrarFormularioEditar = async (req, res) => {
    try {
      const id = req.params.id;
      const cuenta = await this.cuentaService.obtenerCuentaPorId(id);
      if (!cuenta) {
        return res.status(404).send("Cuenta no encontrada");
      }
      res.render("administracion/cuentas/editar", { cuenta });
    } catch (error) {
      console.error("Error al mostrar formulario de edición:", error);
      res.status(500).send("Error interno del servidor");
    }
  };

  // Actualizar una Cuenta existente
  actualizarCuenta = async (req, res) => {
    try {
      const id = req.params.id;
      const { codigo, nombre_cuenta } = req.body;

      // Validación de campos
      if (!codigo || !nombre_cuenta) {
        const cuenta = await this.cuentaService.obtenerCuentaPorId(id);
        return res.render("administracion/cuentas/editar", {
          cuenta,
          error: "Todos los campos son obligatorios.",
        });
      }

      await this.cuentaService.actualizarCuenta(id, { codigo, nombre_cuenta });
      res.redirect("/administracion/cuentas");
    } catch (error) {
      console.error("Error al actualizar Cuenta:", error);
      const cuenta = await this.cuentaService.obtenerCuentaPorId(req.params.id);
      res.render("administracion/cuentas/editar", {
        cuenta,
        error: "Error interno del servidor.",
      });
    }
  };
}

export default CuentaController;
