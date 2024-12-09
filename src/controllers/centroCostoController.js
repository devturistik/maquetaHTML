import CentroCostoService from "../application/centroCostoService.js";

class CentroCostoController {
  constructor() {
    this.centroCostoService = new CentroCostoService();
  }

  // Mostrar la lista de Centros de Costo con opción de filtrar por estatus
  listarCentroCostos = async (req, res) => {
    try {
      const { estatus } = req.query;
      let centrosCostos;
      if (estatus !== undefined && estatus !== "") {
        centrosCostos =
          await this.centroCostoService.obtenerCentroCostosPorEstatus(
            parseInt(estatus)
          );
      } else {
        centrosCostos =
          await this.centroCostoService.obtenerTodosLosCentroCostos();
      }
      res.render("administracion/centroCosto/listar", {
        centrosCostos,
        estatus,
      });
    } catch (error) {
      console.error("Error al listar Centros de Costo:", error);
      res.status(500).send("Error interno del servidor");
    }
  };

  // Mostrar el formulario para crear un nuevo Centro de Costo
  mostrarFormularioCrear = async (req, res) => {
    try {
      // Obtener la lista de gerentes para el dropdown
      const gerentes = await this.centroCostoService.obtenerGerentes();
      res.render("administracion/centroCosto/crear", { gerentes });
    } catch (error) {
      console.error("Error al mostrar formulario de creación:", error);
      res.status(500).send("Error interno del servidor");
    }
  };

  // Crear un nuevo Centro de Costo
  crearCentroCosto = async (req, res) => {
    try {
      const { codigo_centro_costo, nombre, estatus, id_gerente, nivel, monto } =
        req.body;
      const estatusInt = parseInt(estatus);
      const nivelInt = parseInt(nivel);
      const montoDecimal = parseFloat(monto);

      // Validación de monto
      if (isNaN(montoDecimal) || montoDecimal < 0) {
        return res.status(400).send("Monto inválido.");
      }

      await this.centroCostoService.crearCentroCosto({
        codigo_centro_costo,
        nombre,
        estatus: estatusInt,
        id_gerente,
        nivel: nivelInt,
        monto: montoDecimal,
      });
      res.redirect("/administracion/centrocostos");
    } catch (error) {
      console.error("Error al crear Centro de Costo:", error);
      res.status(500).send("Error interno del servidor");
    }
  };

  // Mostrar el formulario para editar un Centro de Costo existente
  mostrarFormularioEditar = async (req, res) => {
    try {
      const id = req.params.id;
      const centroCosto = await this.centroCostoService.obtenerCentroCostoPorId(
        id
      );
      if (!centroCosto) {
        return res.status(404).send("Centro de Costo no encontrado");
      }
      // Obtener la lista de gerentes para el dropdown
      const gerentes = await this.centroCostoService.obtenerGerentes();
      res.render("administracion/centroCosto/editar", {
        centroCosto,
        gerentes,
      });
    } catch (error) {
      console.error("Error al mostrar formulario de edición:", error);
      res.status(500).send("Error interno del servidor");
    }
  };

  // Actualizar un Centro de Costo existente
  actualizarCentroCosto = async (req, res) => {
    try {
      const id = req.params.id;
      const { codigo_centro_costo, nombre, estatus, id_gerente, nivel, monto } =
        req.body;
      const estatusInt = parseInt(estatus);
      const nivelInt = parseInt(nivel);
      const montoDecimal = parseFloat(monto);

      // Validación de monto
      if (isNaN(montoDecimal) || montoDecimal < 0) {
        return res.status(400).send("Monto inválido.");
      }

      await this.centroCostoService.actualizarCentroCosto(id, {
        codigo_centro_costo,
        nombre,
        estatus: estatusInt,
        id_gerente,
        nivel: nivelInt,
        monto: montoDecimal,
      });
      res.redirect("/administracion/centrocostos");
    } catch (error) {
      console.error("Error al actualizar Centro de Costo:", error);
      res.status(500).send("Error interno del servidor");
    }
  };

  // Activar un Centro de Costo
  activarCentroCosto = async (req, res) => {
    try {
      const id = req.params.id;
      await this.centroCostoService.actualizarEstatus(id, "1");
      res.redirect("/administracion/centrocostos");
    } catch (error) {
      console.error("Error al activar Centro de Costo:", error);
      res.status(500).send("Error interno del servidor");
    }
  };

  // Desactivar un Centro de Costo
  desactivarCentroCosto = async (req, res) => {
    try {
      const id = req.params.id;
      await this.centroCostoService.actualizarEstatus(id, "0");
      res.redirect("/administracion/centrocostos");
    } catch (error) {
      console.error("Error al desactivar Centro de Costo:", error);
      res.status(500).send("Error interno del servidor");
    }
  };
}

export default CentroCostoController;
