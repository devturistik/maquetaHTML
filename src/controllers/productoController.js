import ProductoService from "../application/productoService.js";

class ProductoController {
  constructor() {
    this.productoService = new ProductoService();
  }

  // Mostrar la lista de Productos
  listarProductos = async (req, res) => {
    try {
      const productos = await this.productoService.obtenerTodosLosProductos();
      res.render("administracion/producto/listar", { productos });
    } catch (error) {
      console.error("Error al listar Productos:", error);
      res.status(500).send("Error interno del servidor");
    }
  };

  // Mostrar el formulario para crear un nuevo Producto
  mostrarFormularioCrear = (req, res) => {
    res.render("administracion/producto/crear");
  };

  // Crear un nuevo Producto
  crearProducto = async (req, res) => {
    try {
      const { descripcion, unidad, presentacion } = req.body;

      // Validaciones básicas
      if (!descripcion || !unidad || !presentacion) {
        return res.render("administracion/producto/crear", {
          error: "Todos los campos son obligatorios.",
          data: req.body,
        });
      }

      await this.productoService.crearProducto({
        descripcion,
        unidad,
        presentacion,
        estatus_producto: 1, // Por defecto, activo
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date(),
      });
      res.redirect("/administracion/producto");
    } catch (error) {
      console.error("Error al crear Producto:", error);
      res.status(500).send("Error interno del servidor");
    }
  };

  // Mostrar el formulario para editar un Producto existente
  mostrarFormularioEditar = async (req, res) => {
    try {
      const id = req.params.id;
      const producto = await this.productoService.obtenerProductoPorId(id);
      if (!producto) {
        return res.status(404).send("Producto no encontrado");
      }
      res.render("administracion/producto/editar", { producto });
    } catch (error) {
      console.error("Error al mostrar formulario de edición:", error);
      res.status(500).send("Error interno del servidor");
    }
  };

  // Actualizar un Producto existente
  actualizarProducto = async (req, res) => {
    try {
      const id = req.params.id;
      const { descripcion, unidad, presentacion, estatus_producto } = req.body;

      // Validaciones básicas
      if (
        !descripcion ||
        !unidad ||
        !presentacion ||
        estatus_producto === undefined
      ) {
        const producto = await this.productoService.obtenerProductoPorId(id);
        return res.render("administracion/producto/editar", {
          producto,
          error: "Todos los campos son obligatorios.",
        });
      }

      await this.productoService.actualizarProducto(id, {
        descripcion,
        unidad,
        presentacion,
        estatus_producto: estatus_producto === "1" ? 1 : 0,
        fecha_actualizacion: new Date(),
      });
      res.redirect("/administracion/producto");
    } catch (error) {
      console.error("Error al actualizar Producto:", error);
      res.status(500).send("Error interno del servidor");
    }
  };

  // Activar un Producto
  activarProducto = async (req, res) => {
    try {
      const id = req.params.id;
      await this.productoService.actualizarEstatus(id, 1); // Estatus 1 para Activo
      res.redirect("/administracion/producto");
    } catch (error) {
      console.error("Error al activar Producto:", error);
      res.status(500).send("Error interno del servidor");
    }
  };

  // Desactivar un Producto
  desactivarProducto = async (req, res) => {
    try {
      const id = req.params.id;
      await this.productoService.actualizarEstatus(id, 0); // Estatus 0 para Inactivo
      res.redirect("/administracion/producto");
    } catch (error) {
      console.error("Error al desactivar Producto:", error);
      res.status(500).send("Error interno del servidor");
    }
  };
}

export default ProductoController;
