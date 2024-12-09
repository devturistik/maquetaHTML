import MonedaService from "../application/monedaService.js";

class MonedaController {
  constructor() {
    this.monedaService = new MonedaService();
  }

  // Mostrar la lista de Monedas
  listarMonedas = async (req, res) => {
    try {
      const monedas = await this.monedaService.obtenerTodasLasMonedas();
      res.render("administracion/monedas/listar", { monedas });
    } catch (error) {
      console.error("Error al listar Monedas:", error);
      res.status(500).send("Error interno del servidor");
    }
  };

  // Mostrar el formulario para crear una nueva Moneda
  mostrarFormularioCrear = (req, res) => {
    res.render("administracion/monedas/crear");
  };

  // Crear una nueva Moneda
  crearMoneda = async (req, res) => {
    try {
      const { abrev, nombre, cambio } = req.body;

      // Validaciones básicas
      if (!abrev || !nombre || !cambio) {
        return res.render("administracion/monedas/crear", {
          error: "Todos los campos son obligatorios.",
          data: req.body,
        });
      }

      // Validar formato de cambio (números y decimales)
      const cambioRegex = /^\d+(\.\d{1,2})?$/;
      if (!cambioRegex.test(cambio)) {
        return res.render("administracion/monedas/crear", {
          error:
            "Ingrese un valor de cambio válido (números con hasta 2 decimales).",
          data: req.body,
        });
      }

      await this.monedaService.crearMoneda({
        abrev,
        nombre,
        cambio,
        fecha_creacion: new Date(),
      });
      res.redirect("/administracion/monedas");
    } catch (error) {
      console.error("Error al crear Moneda:", error);
      res.status(500).send("Error interno del servidor");
    }
  };

  // Mostrar el formulario para editar una Moneda existente
  mostrarFormularioEditar = async (req, res) => {
    try {
      const id = req.params.id;
      const moneda = await this.monedaService.obtenerMonedaPorId(id);
      if (!moneda) {
        return res.status(404).send("Moneda no encontrada");
      }
      res.render("administracion/monedas/editar", { moneda });
    } catch (error) {
      console.error("Error al mostrar formulario de edición:", error);
      res.status(500).send("Error interno del servidor");
    }
  };

  // Actualizar una Moneda existente
  actualizarMoneda = async (req, res) => {
    try {
      const id = req.params.id;
      const { abrev, nombre, cambio } = req.body;

      // Validaciones básicas
      if (!abrev || !nombre || !cambio) {
        const moneda = await this.monedaService.obtenerMonedaPorId(id);
        return res.render("administracion/monedas/editar", {
          moneda,
          error: "Todos los campos son obligatorios.",
        });
      }

      // Validar formato de cambio (números y decimales)
      const cambioRegex = /^\d+(\.\d{1,2})?$/;
      if (!cambioRegex.test(cambio)) {
        const moneda = await this.monedaService.obtenerMonedaPorId(id);
        return res.render("administracion/monedas/editar", {
          moneda,
          error:
            "Ingrese un valor de cambio válido (números con hasta 2 decimales).",
        });
      }

      await this.monedaService.actualizarMoneda(id, {
        abrev,
        nombre,
        cambio,
        fecha_actualizacion: new Date(),
      });
      res.redirect("/administracion/monedas");
    } catch (error) {
      console.error("Error al actualizar Moneda:", error);
      const moneda = await this.monedaService.obtenerMonedaPorId(req.params.id);
      res.render("administracion/monedas/editar", {
        moneda,
        error: "Error interno del servidor.",
      });
    }
  };
}

export default MonedaController;
