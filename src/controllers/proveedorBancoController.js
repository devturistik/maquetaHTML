import ProveedorBancoService from "../application/proveedorBancoService.js";
import ProveedorService from "../application/proveedorService.js";
import BancoService from "../application/bancoService.js";

class ProveedorBancoController {
  constructor() {
    this.proveedorBancoService = new ProveedorBancoService();
    this.proveedorService = new ProveedorService();
    this.bancoService = new BancoService();
  }

  // Mostrar el formulario para asignar un banco a un proveedor
  mostrarFormularioAsignarBanco = async (req, res) => {
    try {
      const proveedorId = req.params.id;
      const proveedor = await this.proveedorService.obtenerProveedorPorId(
        proveedorId
      );
      if (!proveedor) {
        return res.status(404).send("Proveedor no encontrado");
      }
      const bancos = await this.bancoService.obtenerTodosLosBancosActivos();
      res.render("administracion/proveedorBanco/asignarBanco", {
        proveedor,
        bancos,
      });
    } catch (error) {
      console.error("Error al mostrar formulario de asignar banco:", error);
      res.status(500).send("Error interno del servidor");
    }
  };

  // Asignar un banco a un proveedor
  asignarBanco = async (req, res) => {
    try {
      const proveedorId = req.params.id;
      const {
        id_banco,
        numero_cuenta,
        tipo_cuenta,
        swift_cuenta,
        aba_cuenta,
        iban_cuenta,
        correo_banco,
        estatus_banco,
      } = req.body;

      // Validaciones básicas
      if (
        !id_banco ||
        !numero_cuenta ||
        !tipo_cuenta ||
        !swift_cuenta ||
        !aba_cuenta ||
        !iban_cuenta ||
        !correo_banco ||
        !estatus_banco
      ) {
        const proveedor = await this.proveedorService.obtenerProveedorPorId(
          proveedorId
        );
        const bancos = await this.bancoService.obtenerTodosLosBancosActivos();
        return res.render("administracion/proveedorBanco/asignarBanco", {
          proveedor,
          bancos,
          error: "Todos los campos son obligatorios.",
        });
      }

      // Validar formato de correo del banco
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(correo_banco)) {
        const proveedor = await this.proveedorService.obtenerProveedorPorId(
          proveedorId
        );
        const bancos = await this.bancoService.obtenerTodosLosBancosActivos();
        return res.render("administracion/proveedorBanco/asignarBanco", {
          proveedor,
          bancos,
          error: "Ingrese un correo de banco válido.",
        });
      }

      // Crear la relación ProveedorBanco
      await this.proveedorBancoService.asignarBancoAProveedor(proveedorId, {
        id_banco,
        numero_cuenta,
        tipo_cuenta,
        swift_cuenta,
        aba_cuenta,
        iban_cuenta,
        correo_banco,
        estatus_banco,
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date(),
      });

      res.redirect(`/administracion/proveedor/${proveedorId}/bancos`);
    } catch (error) {
      console.error("Error al asignar banco:", error);
      res.status(500).send("Error interno del servidor");
    }
  };

  // Listar los bancos asignados a un proveedor
  listarBancosAsignados = async (req, res) => {
    try {
      const proveedorId = req.params.id;
      const proveedor = await this.proveedorService.obtenerProveedorPorId(
        proveedorId
      );
      if (!proveedor) {
        return res.status(404).send("Proveedor no encontrado");
      }
      const bancosAsignados =
        await this.proveedorBancoService.obtenerBancosAsignados(proveedorId);
      res.render("administracion/proveedorBanco/listarBancosAsignados", {
        proveedor,
        bancosAsignados,
      });
    } catch (error) {
      console.error("Error al listar bancos asignados:", error);
      res.status(500).send("Error interno del servidor");
    }
  };

  // Mostrar el formulario para editar una asignación de banco a proveedor
  mostrarFormularioEditarBancoAsignado = async (req, res) => {
    try {
      const proveedorId = req.params.id;
      const bancoAsignadoId = req.params.id_banco;
      const bancoAsignado =
        await this.proveedorBancoService.obtenerBancoAsignadoPorId(
          proveedorId,
          bancoAsignadoId
        );
      if (!bancoAsignado) {
        return res.status(404).send("Asignación de banco no encontrada");
      }
      const bancos = await this.bancoService.obtenerTodosLosBancosActivos();
      res.render("administracion/proveedorBanco/editarBancoAsignado", {
        proveedorId,
        bancoAsignado,
        bancos,
      });
    } catch (error) {
      console.error(
        "Error al mostrar formulario de edición de banco asignado:",
        error
      );
      res.status(500).send("Error interno del servidor");
    }
  };

  // Actualizar una asignación de banco a proveedor
  actualizarBancoAsignado = async (req, res) => {
    try {
      const proveedorId = req.params.id;
      const bancoAsignadoId = req.params.id_banco;
      const {
        id_banco,
        numero_cuenta,
        tipo_cuenta,
        swift_cuenta,
        aba_cuenta,
        iban_cuenta,
        correo_banco,
        estatus_banco,
      } = req.body;

      // Validaciones básicas
      if (
        !id_banco ||
        !numero_cuenta ||
        !tipo_cuenta ||
        !swift_cuenta ||
        !aba_cuenta ||
        !iban_cuenta ||
        !correo_banco ||
        !estatus_banco
      ) {
        const bancoAsignado =
          await this.proveedorBancoService.obtenerBancoAsignadoPorId(
            proveedorId,
            bancoAsignadoId
          );
        const bancos = await this.bancoService.obtenerTodosLosBancosActivos();
        return res.render("administracion/proveedorBanco/editarBancoAsignado", {
          proveedorId,
          bancoAsignado,
          bancos,
          error: "Todos los campos son obligatorios.",
        });
      }

      // Validar formato de correo del banco
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(correo_banco)) {
        const bancoAsignado =
          await this.proveedorBancoService.obtenerBancoAsignadoPorId(
            proveedorId,
            bancoAsignadoId
          );
        const bancos = await this.bancoService.obtenerTodosLosBancosActivos();
        return res.render("administracion/proveedorBanco/editarBancoAsignado", {
          proveedorId,
          bancoAsignado,
          bancos,
          error: "Ingrese un correo de banco válido.",
        });
      }

      // Actualizar la relación ProveedorBanco
      await this.proveedorBancoService.actualizarBancoAsignado(
        proveedorId,
        bancoAsignadoId,
        {
          id_banco,
          numero_cuenta,
          tipo_cuenta,
          swift_cuenta,
          aba_cuenta,
          iban_cuenta,
          correo_banco,
          estatus_banco,
          fecha_actualizacion: new Date(),
        }
      );

      res.redirect(`/administracion/proveedor/${proveedorId}/bancos`);
    } catch (error) {
      console.error("Error al actualizar banco asignado:", error);
      res.status(500).send("Error interno del servidor");
    }
  };

  // Eliminar una asignación de banco a proveedor (soft delete si es necesario)
  eliminarBancoAsignado = async (req, res) => {
    try {
      const proveedorId = req.params.id;
      const bancoAsignadoId = req.params.id_banco;

      await this.proveedorBancoService.eliminarBancoAsignado(
        proveedorId,
        bancoAsignadoId
      );
      res.redirect(`/administracion/proveedor/${proveedorId}/bancos`);
    } catch (error) {
      console.error("Error al eliminar banco asignado:", error);
      res.status(500).send("Error interno del servidor");
    }
  };
}

export default ProveedorBancoController;
