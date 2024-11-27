// src/controllers/administracionController.js
import AdministracionService from "../application/administracionService.js";
import { body, validationResult } from "express-validator";

class AdministracionController {
  constructor() {
    this.administracionService = new AdministracionService();
  }

  renderTables = async (req, res) => {
    try {
      const tablas = await this.administracionService.getTables();
      res.render("administracion", {
        tablas,
      });
    } catch (error) {
      console.error("Error al renderizar las tablas de administración:", error);
      res.status(500).send("Error interno del servidor");
    }
  };

  listarRegistros = async (req, res) => {
    const tabla = req.params.tabla;
    try {
      if (!this.administracionService.tablasPermitidas.includes(tabla)) {
        return res.status(403).send("Acceso prohibido.");
      }

      let registros;
      let metadatos = await this.administracionService.obtenerMetadatos(tabla);

      registros = await this.administracionService.obtenerRegistros(tabla);

      const columnasVisibles = metadatos.columns;

      res.render("administracion/lista", {
        tabla,
        registros,
        columnas: columnasVisibles,
        idColumna: metadatos.id,
      });
    } catch (error) {
      console.error(`Error al listar registros de la tabla ${tabla}:`, error);
      res.status(500).send("Error interno del servidor");
    }
  };

  mostrarFormularioCrear = async (req, res) => {
    try {
      const tabla = req.params.tabla;
      if (!this.administracionService.tablasPermitidas.includes(tabla)) {
        return res.status(403).send("Acceso prohibido.");
      }

      const metadatos = await this.administracionService.obtenerMetadatos(
        tabla
      );
      const columnasFormulario = metadatos.columns.filter(
        (col) => col.editable
      );

      let proveedores = [];
      let bancos = [];
      let tiposOrden = [];

      if (tabla === "ProveedorBanco") {
        proveedores = await this.administracionService.obtenerProveedores();
        bancos = await this.administracionService.obtenerBancos();
      } else if (tabla === "DetalleTipoOrden") {
        tiposOrden = await this.administracionService.obtenerTiposOrden();
      }

      res.render("administracion/crear", {
        tabla,
        columnas: columnasFormulario,
        proveedores,
        bancos,
        tiposOrden,
      });
    } catch (error) {
      console.error(
        `Error al mostrar formulario de creación para la tabla ${tabla}:`,
        error
      );
      res.status(500).send("Error interno del servidor");
    }
  };

  crearRegistro = [
    async (req, res, next) => {
      const tabla = req.params.tabla;
      if (!this.administracionService.tablasPermitidas.includes(tabla)) {
        return res.status(403).send("Acceso prohibido.");
      }

      const metadatos = await this.administracionService.obtenerMetadatos(
        tabla
      );
      const columnas = metadatos.columns.filter((col) => col.editable);
      const validations = columnas.map((col) => {
        switch (col.tipo.toLowerCase()) {
          case "int":
            return body(col.nombre)
              .isInt()
              .withMessage(`${col.nombre} debe ser un número entero.`);
          case "decimal":
            return body(col.nombre)
              .isDecimal()
              .withMessage(`${col.nombre} debe ser un número decimal.`);
          case "varchar":
          case "nvarchar":
            return body(col.nombre)
              .notEmpty()
              .withMessage(`${col.nombre} es obligatorio.`);
          case "date":
          case "datetime":
            return body(col.nombre)
              .isISO8601()
              .toDate()
              .withMessage(`${col.nombre} debe ser una fecha válida.`);
          case "bit":
            return body(col.nombre)
              .isIn(["0", "1"])
              .withMessage(`${col.nombre} debe ser 0 o 1.`);
          default:
            return body(col.nombre)
              .notEmpty()
              .withMessage(`${col.nombre} es obligatorio.`);
        }
      });

      await Promise.all(validations.map((validation) => validation.run(req)));

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const proveedores =
          tabla === "ProveedorBanco"
            ? await this.administracionService.obtenerProveedores()
            : [];
        const bancos =
          tabla === "ProveedorBanco"
            ? await this.administracionService.obtenerBancos()
            : [];
        const tiposOrden =
          tabla === "DetalleTipoOrden"
            ? await this.administracionService.obtenerTiposOrden()
            : [];
        return res.status(400).render("administracion/crear", {
          tabla,
          columnas: columnas,
          errores: errors.array(),
          proveedores,
          bancos,
          tiposOrden,
        });
      }

      next();
    },
    async (req, res) => {
      try {
        const tabla = req.params.tabla;
        const datos = req.body;
        const metadatos = await this.administracionService.obtenerMetadatos(
          tabla
        );
        const columnaCreadoPor = metadatos.columns.find(
          (col) => col.nombre.toUpperCase() === "CREADO_POR"
        );
        if (columnaCreadoPor) {
          const nombreCompleto = `${res.locals.user.nombre} ${res.locals.user.apellido}`;
          datos.CREADO_POR = nombreCompleto;
        }
        await this.administracionService.crearRegistro(tabla, datos);
        res.redirect(`/administracion/${tabla}`);
      } catch (error) {
        console.error(`Error al crear registro en la tabla ${tabla}:`, error);
        res.status(500).send("Error interno del servidor");
      }
    },
  ];

  mostrarFormularioEditar = async (req, res) => {
    try {
      const tabla = req.params.tabla;
      if (!this.administracionService.tablasPermitidas.includes(tabla)) {
        return res.status(403).send("Acceso prohibido.");
      }

      const id = req.params.id;
      const registro = await this.administracionService.obtenerRegistroPorId(
        tabla,
        id
      );
      if (!registro) {
        return res.status(404).send("Registro no encontrado.");
      }

      const metadatos = await this.administracionService.obtenerMetadatos(
        tabla
      );
      const columnasFormulario = metadatos.columns.filter(
        (col) => col.editable
      );

      let proveedores = [];
      let bancos = [];
      let tiposOrden = [];

      if (tabla === "ProveedorBanco") {
        proveedores = await this.administracionService.obtenerProveedores();
        bancos = await this.administracionService.obtenerBancos();
      } else if (tabla === "DetalleTipoOrden") {
        tiposOrden = await this.administracionService.obtenerTiposOrden();
      }

      res.render("administracion/editar", {
        tabla,
        registro,
        columnas: columnasFormulario,
        idColumna: metadatos.id,
        proveedores,
        bancos,
        tiposOrden,
      });
    } catch (error) {
      console.error(`Error al obtener registro de la tabla ${tabla}:`, error);
      res.status(500).send("Error interno del servidor");
    }
  };

  actualizarRegistro = [
    async (req, res, next) => {
      const tabla = req.params.tabla;
      if (!this.administracionService.tablasPermitidas.includes(tabla)) {
        return res.status(403).send("Acceso prohibido.");
      }

      const metadatos = await this.administracionService.obtenerMetadatos(
        tabla
      );
      const columnas = metadatos.columns.filter((col) => col.editable);
      const validations = columnas.map((col) => {
        switch (col.tipo.toLowerCase()) {
          case "int":
            return body(col.nombre)
              .isInt()
              .withMessage(`${col.nombre} debe ser un número entero.`);
          case "decimal":
            return body(col.nombre)
              .isDecimal()
              .withMessage(`${col.nombre} debe ser un número decimal.`);
          case "varchar":
          case "nvarchar":
            return body(col.nombre)
              .notEmpty()
              .withMessage(`${col.nombre} es obligatorio.`);
          case "date":
          case "datetime":
            return body(col.nombre)
              .isISO8601()
              .toDate()
              .withMessage(`${col.nombre} debe ser una fecha válida.`);
          case "bit":
            return body(col.nombre)
              .isIn(["0", "1"])
              .withMessage(`${col.nombre} debe ser 0 o 1.`);
          default:
            return body(col.nombre)
              .notEmpty()
              .withMessage(`${col.nombre} es obligatorio.`);
        }
      });

      await Promise.all(validations.map((validation) => validation.run(req)));

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const registro = await this.administracionService.obtenerRegistroPorId(
          tabla,
          req.params.id
        );
        const proveedores =
          tabla === "ProveedorBanco"
            ? await this.administracionService.obtenerProveedores()
            : [];
        const bancos =
          tabla === "ProveedorBanco"
            ? await this.administracionService.obtenerBancos()
            : [];
        const tiposOrden =
          tabla === "DetalleTipoOrden"
            ? await this.administracionService.obtenerTiposOrden()
            : [];
        return res.status(400).render("administracion/editar", {
          tabla,
          registro,
          columnas: columnas,
          errores: errors.array(),
          idColumna: metadatos.id,
          proveedores,
          bancos,
          tiposOrden,
        });
      }

      next();
    },
    async (req, res) => {
      try {
        const tabla = req.params.tabla;
        const id = req.params.id;
        const datos = req.body;
        await this.administracionService.actualizarRegistro(tabla, id, datos);
        res.redirect(`/administracion/${tabla}`);
      } catch (error) {
        console.error(
          `Error al actualizar registro en la tabla ${tabla}:`,
          error
        );
        res.status(500).send("Error interno del servidor");
      }
    },
  ];

  eliminarRegistro = async (req, res) => {
    const tabla = req.params.tabla;
    const id = req.params.id;

    try {
      if (!this.administracionService.tablasPermitidas.includes(tabla)) {
        return res.status(403).send("Acceso prohibido.");
      }

      const metadatos = await this.administracionService.obtenerMetadatos(
        tabla
      );

      if (!metadatos || !metadatos.columns) {
        return res.status(500).send("Metadatos de la tabla no encontrados.");
      }

      const columnas = metadatos.columns.map((col) => col.nombre.toUpperCase());

      const tieneEliminado = columnas.includes("ELIMINADO");
      const columnasEstatus = metadatos.columns.filter((col) =>
        col.nombre.toUpperCase().includes("ESTATUS")
      );

      if (tieneEliminado) {
        await this.administracionService.eliminarLogico(
          tabla,
          id,
          "ELIMINADO",
          1
        );
        res.redirect(`/administracion/${tabla}`);
      } else if (columnasEstatus.length > 0) {
        for (const col of columnasEstatus) {
          await this.administracionService.eliminarLogico(
            tabla,
            id,
            col.nombre,
            0
          );
        }
        res.redirect(`/administracion/${tabla}`);
      } else {
        res.render("administracion/confirmarEliminacion", {
          tabla,
          id,
        });
      }
    } catch (error) {
      console.error(`Error al eliminar registro de la tabla ${tabla}:`, error);
      res.status(500).send("Error interno del servidor");
    }
  };

  confirmarEliminarFisico = async (req, res) => {
    const tabla = req.params.tabla;
    const id = req.params.id;

    try {
      if (!this.administracionService.tablasPermitidas.includes(tabla)) {
        return res.status(403).send("Acceso prohibido.");
      }

      await this.administracionService.eliminarFisico(tabla, id);
      res.redirect(`/administracion/${tabla}`);
    } catch (error) {
      console.error(
        `Error al eliminar físicamente registro de la tabla ${tabla}:`,
        error
      );
      res.status(500).send("Error interno del servidor");
    }
  };

  mostrarFormularioRelacionar = async (req, res) => {
    const tabla = req.params.tabla;
    try {
      if (!this.administracionService.tablasPermitidas.includes(tabla)) {
        return res.status(403).send("Acceso prohibido.");
      }

      let entidadesPrincipales = [];
      let entidadesRelacionadas = [];

      if (tabla === "Proveedor") {
        entidadesPrincipales =
          await this.administracionService.obtenerProveedores();
        entidadesRelacionadas =
          await this.administracionService.obtenerBancos();
      } else if (tabla === "TipoOrden") {
        entidadesPrincipales =
          await this.administracionService.obtenerTiposOrden();
        entidadesRelacionadas =
          await this.administracionService.obtenerDetallesTipoOrden();
      }

      res.render("administracion/relacionar", {
        tabla,
        entidadesPrincipales,
        entidadesRelacionadas,
      });
    } catch (error) {
      console.error(
        `Error al mostrar formulario de relación para la tabla ${tabla}:`,
        error
      );
      res.status(500).send("Error interno del servidor");
    }
  };

  establecerRelacion = async (req, res) => {
    const tabla = req.params.tabla;
    const { idPrincipal } = req.body;
    try {
      if (!this.administracionService.tablasPermitidas.includes(tabla)) {
        return res.status(403).send("Acceso prohibido.");
      }

      if (tabla === "Proveedor") {
        const { idRelacionado, NUMERO_CUENTA, TIPO_CUENTA, CORREO_BANCO } =
          req.body;
        await this.administracionService.establecerRelacionProveedorBanco(
          idPrincipal,
          idRelacionado,
          {
            NUMERO_CUENTA,
            TIPO_CUENTA,
            CORREO_BANCO,
          }
        );
      } else if (tabla === "TipoOrden") {
        const { NOMBRE_DETALLE, CANTIDAD, TIPO_DETALLE } = req.body;
        await this.administracionService.establecerRelacionTipoOrden(
          idPrincipal,
          {
            NOMBRE_DETALLE,
            CANTIDAD,
            TIPO_DETALLE,
          }
        );
      }

      res.redirect(`/administracion/${tabla}`);
    } catch (error) {
      console.error(
        `Error al establecer relación en la tabla ${tabla}:`,
        error
      );
      res.status(500).send("Error interno del servidor");
    }
  };
}

export default AdministracionController;
