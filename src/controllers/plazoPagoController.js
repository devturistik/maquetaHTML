import PlazoPagoService from "../application/plazoPagoService.js";

class PlazoPagoController {
  constructor() {
    this.plazoPagoService = new PlazoPagoService();
  }

  // Mostrar la lista de PlazoPagos
  listarPlazoPagos = async (req, res) => {
    try {
      const plazoPagos =
        await this.plazoPagoService.obtenerTodosLosPlazoPagos();

      res.render("administracion/plazopago/listar", { plazoPagos });
    } catch (error) {
      console.error("Error al listar PlazoPagos:", error);
      res.status(500).send("Error interno del servidor");
    }
  };

  // Mostrar el formulario para crear un nuevo PlazoPago
  mostrarFormularioCrear = (req, res) => {
    res.render("administracion/plazopago/crear");
  };

  // Crear un nuevo PlazoPago
  crearPlazoPago = async (req, res) => {
    try {
      const { nombre } = req.body;

      // Validaciones básicas
      if (!nombre) {
        return res.render("administracion/plazopago/crear", {
          error: "Todos los campos son obligatorios.",
          data: req.body,
        });
      }

      await this.plazoPagoService.crearPlazoPago({
        nombre,
        estatus_forma_pago: 1, // Por defecto, activo
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date(),
      });
      res.redirect("/administracion/plazopago");
    } catch (error) {
      console.error("Error al crear PlazoPago:", error);
      res.status(500).send("Error interno del servidor");
    }
  };

  // Mostrar el formulario para editar un PlazoPago existente
  mostrarFormularioEditar = async (req, res) => {
    try {
      const id = req.params.id;
      const plazoPago = await this.plazoPagoService.obtenerPlazoPagoPorId(id);
      if (!plazoPago) {
        return res.status(404).send("PlazoPago no encontrado");
      }
      res.render("administracion/plazopago/editar", { plazoPago });
    } catch (error) {
      console.error("Error al mostrar formulario de edición:", error);
      res.status(500).send("Error interno del servidor");
    }
  };

  // Actualizar un PlazoPago existente
  actualizarPlazoPago = async (req, res) => {
    try {
      const id = req.params.id;
      const { nombre, estatus_forma_pago } = req.body;

      // Validaciones básicas
      if (!nombre || estatus_forma_pago === undefined) {
        const plazoPago = await this.plazoPagoService.obtenerPlazoPagoPorId(id);
        return res.render("administracion/plazopago/editar", {
          plazoPago,
          error: "Todos los campos son obligatorios.",
        });
      }

      await this.plazoPagoService.actualizarPlazoPago(id, {
        nombre,
        estatus_forma_pago: estatus_forma_pago === "1" ? 1 : 0,
        fecha_actualizacion: new Date(),
      });
      res.redirect("/administracion/plazopago");
    } catch (error) {
      console.error("Error al actualizar PlazoPago:", error);
      res.status(500).send("Error interno del servidor");
    }
  };

  // Activar un PlazoPago
  activarPlazoPago = async (req, res) => {
    try {
      const id = req.params.id;
      await this.plazoPagoService.actualizarEstatus(id, 1); // Estatus 1 para Activo
      res.redirect("/administracion/plazopago");
    } catch (error) {
      console.error("Error al activar PlazoPago:", error);
      res.status(500).send("Error interno del servidor");
    }
  };

  // Desactivar un PlazoPago
  desactivarPlazoPago = async (req, res) => {
    try {
      const id = req.params.id;
      await this.plazoPagoService.actualizarEstatus(id, 0); // Estatus 0 para Inactivo
      res.redirect("/administracion/plazopago");
    } catch (error) {
      console.error("Error al desactivar PlazoPago:", error);
      res.status(500).send("Error interno del servidor");
    }
  };
}

export default PlazoPagoController;
