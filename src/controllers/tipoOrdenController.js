import TipoOrdenService from "../application/tipoOrdenService.js";

class TipoOrdenController {
  constructor() {
    this.tipoOrdenService = new TipoOrdenService();
  }

  // Mostrar formulario para crear Tipo de Orden
  mostrarFormularioCrearTipoOrden = (req, res) => {
    res.render("administracion/tipoOrden/crearTipoOrden");
  };

  // Crear Tipo de Orden con detalles
  crearTipoOrden = async (req, res) => {
    try {
      const { nombre, estatus_tipo_orden, detalles } = req.body;
      const datosTipoOrden = {
        nombre,
        estatus_tipo_orden: estatus_tipo_orden === "on",
        created_at: new Date(),
        creado_por: res.locals.user.nombre,
      };

      const parsedDetalles = JSON.parse(detalles);
      await this.tipoOrdenService.crearTipoOrdenConDetalles(
        datosTipoOrden,
        parsedDetalles
      );

      res.redirect("/administracion/tipoorden");
    } catch (error) {
      console.error("Error al crear Tipo de Orden:", error);
      res.status(400).send(error.message);
    }
  };

  // Listar Tipos de Orden
  listarTiposOrden = async (req, res) => {
    try {
      const tiposOrden = await this.tipoOrdenService.obtenerTiposOrden();
      res.render("administracion/tipoOrden/listarTipoOrden", { tiposOrden });
    } catch (error) {
      console.error("Error al listar Tipos de Orden:", error);
      res.status(500).send("Error interno del servidor");
    }
  };

  // Mostrar detalles de un Tipo de Orden
  listarDetallesPorTipoOrden = async (req, res) => {
    try {
      const id_tipo = req.params.id;
      const detalles = await this.tipoOrdenService.obtenerDetallesPorTipoOrden(
        id_tipo
      );
      res.render("administracion/tipoOrden/listarDetallesTipoOrden", {
        detalles,
      });
    } catch (error) {
      console.error("Error al listar detalles:", error);
      res.status(500).send("Error interno del servidor");
    }
  };

  // Mostrar formulario para editar Tipo de Orden
  mostrarFormularioEditarTipoOrden = async (req, res) => {
    try {
      const id = req.params.id;
      const tipoOrden = await this.tipoOrdenService.obtenerTipoOrdenPorId(id);
      const detalles = await this.tipoOrdenService.obtenerDetallesPorTipoOrden(
        id
      );

      if (!tipoOrden) {
        return res.status(404).send("Tipo de Orden no encontrado.");
      }

      res.render("administracion/tipoOrden/editarTipoOrden", {
        tipoOrden,
        detalles,
      });
    } catch (error) {
      console.error("Error al mostrar formulario de edición:", error);
      res.status(500).send("Error interno del servidor.");
    }
  };

  // Actualizar un Tipo de Orden
  actualizarTipoOrden = async (req, res) => {
    try {
      const id = req.params.id;
      const { nombre, estatus_tipo_orden, detalles } = req.body;

      const datosActualizados = {
        nombre,
        estatus_tipo_orden: estatus_tipo_orden === "on" ? true : false,
      };

      await this.tipoOrdenService.actualizarTipoOrden(
        id,
        datosActualizados,
        JSON.parse(detalles)
      );
      res.redirect("/administracion/tipoorden");
    } catch (error) {
      console.error("Error al actualizar Tipo de Orden:", error);
      res.status(500).send("Error interno del servidor.");
    }
  };
}

export default TipoOrdenController;
