import ProveedorService from "../application/proveedorService.js";

class ProveedorController {
  constructor() {
    this.proveedorService = new ProveedorService();
  }

  // Mostrar la lista de Proveedores
  listarProveedores = async (req, res) => {
    try {
      const proveedores =
        await this.proveedorService.obtenerTodosLosProveedores();
      res.render("administracion/proveedor/listar", { proveedores });
    } catch (error) {
      console.error("Error al listar Proveedores:", error);
      res.status(500).send("Error interno del servidor");
    }
  };

  // Mostrar el formulario para crear un nuevo Proveedor
  mostrarFormularioCrear = (req, res) => {
    res.render("administracion/proveedor/crear");
  };

  // Crear un nuevo Proveedor
  crearProveedor = async (req, res) => {
    try {
      const {
        nombre_proveedor,
        documento_proveedor,
        telefono_principal,
        correo_principal,
        estatus_proveedor,
      } = req.body;

      // Validaciones básicas
      if (
        !nombre_proveedor ||
        !documento_proveedor ||
        !telefono_principal ||
        !correo_principal ||
        !estatus_proveedor
      ) {
        return res.render("administracion/proveedor/crear", {
          error: "Todos los campos son obligatorios.",
          data: req.body,
        });
      }

      // Validar formato de correo
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(correo_principal)) {
        return res.render("administracion/proveedor/crear", {
          error: "Ingrese un correo válido.",
          data: req.body,
        });
      }

      await this.proveedorService.crearProveedor({
        nombre_proveedor,
        documento_proveedor,
        telefono_principal,
        correo_principal,
        estatus_proveedor,
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date(),
        eliminado: 0, // Por defecto, no eliminado
      });
      res.redirect("/administracion/proveedor");
    } catch (error) {
      console.error("Error al crear Proveedor:", error);
      res.status(500).send("Error interno del servidor");
    }
  };

  // Mostrar el formulario para editar un Proveedor existente
  mostrarFormularioEditar = async (req, res) => {
    try {
      const id = req.params.id;
      const proveedor = await this.proveedorService.obtenerProveedorPorId(id);
      if (!proveedor) {
        return res.status(404).send("Proveedor no encontrado");
      }
      res.render("administracion/proveedor/editar", { proveedor });
    } catch (error) {
      console.error("Error al mostrar formulario de edición:", error);
      res.status(500).send("Error interno del servidor");
    }
  };

  // Actualizar un Proveedor existente
  actualizarProveedor = async (req, res) => {
    try {
      const id = req.params.id;
      const {
        nombre_proveedor,
        documento_proveedor,
        telefono_principal,
        correo_principal,
        estatus_proveedor,
      } = req.body;

      // Validaciones básicas
      if (
        !nombre_proveedor ||
        !documento_proveedor ||
        !telefono_principal ||
        !correo_principal ||
        !estatus_proveedor
      ) {
        const proveedor = await this.proveedorService.obtenerProveedorPorId(id);
        return res.render("administracion/proveedor/editar", {
          proveedor,
          error: "Todos los campos son obligatorios.",
        });
      }

      estatus_proveedor = estatus_proveedor === "Activo" ? 1 : estatus_proveedor;
      estatus_proveedor = estatus_proveedor === "Inactivo" ? 0 : estatus_proveedor;

      // Validar formato de correo
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(correo_principal)) {
        const proveedor = await this.proveedorService.obtenerProveedorPorId(id);
        return res.render("administracion/proveedor/editar", {
          proveedor,
          error: "Ingrese un correo válido.",
        });
      }

      await this.proveedorService.actualizarProveedor(id, {
        nombre_proveedor,
        documento_proveedor,
        telefono_principal,
        correo_principal,
        estatus_proveedor,
        fecha_actualizacion: new Date(),
      });
      res.redirect("/administracion/proveedor");
    } catch (error) {
      console.error("Error al actualizar Proveedor:", error);
      res.status(500).send("Error interno del servidor");
    }
  };

  // Activar un Proveedor
  activarProveedor = async (req, res) => {
    try {
      const id = req.params.id;
      await this.proveedorService.actualizarEstatus(id, "1");
      res.redirect("/administracion/proveedor");
    } catch (error) {
      console.error("Error al activar Proveedor:", error);
      res.status(500).send("Error interno del servidor");
    }
  };

  // Desactivar un Proveedor
  desactivarProveedor = async (req, res) => {
    try {
      const id = req.params.id;
      await this.proveedorService.actualizarEstatus(id, "0");
      res.redirect("/administracion/proveedor");
    } catch (error) {
      console.error("Error al desactivar Proveedor:", error);
      res.status(500).send("Error interno del servidor");
    }
  };

  // Eliminar (soft delete) un Proveedor
  eliminarProveedor = async (req, res) => {
    try {
      const id = req.params.id;
      await this.proveedorService.eliminarProveedor(id);
      res.redirect("/administracion/proveedor");
    } catch (error) {
      console.error("Error al eliminar Proveedor:", error);
      res.status(500).send("Error interno del servidor");
    }
  };
}

export default ProveedorController;
