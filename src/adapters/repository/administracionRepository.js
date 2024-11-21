// src/adapters/repository/administracionRepository.js
import { sql, poolPromise } from "../../config/database.js";
import columnMetadata from "../../config/columnMetadata.js";

class AdministracionRepository {
  constructor() {
    this.tablasPermitidas = Object.keys(columnMetadata);
  }

  _esTablaPermitida(tabla) {
    return this.tablasPermitidas.includes(tabla);
  }

  _esColumnaPermitida(tabla, columna) {
    const meta = columnMetadata[tabla];
    if (!meta) return false;
    return meta.columns.some((col) => col.nombre === columna);
  }

  columnaEliminado(tabla) {
    const metadatos = this.obtenerMetadatos(tabla);
    if (!metadatos.columns) return null;
    const columna = metadatos.columns.find(
      (col) => col.nombre.toUpperCase() === "ELIMINADO"
    );
    return columna ? columna.nombre : null;
  }

  columnaEstatus(tabla) {
    const metadatos = this.obtenerMetadatos(tabla);
    if (!metadatos.columns) return null;
    const columna = metadatos.columns.find((col) =>
      col.nombre.toUpperCase().includes("ESTATUS")
    );
    return columna ? columna.nombre : null;
  }

  obtenerMetadatos(tabla) {
    const meta = columnMetadata[tabla];
    if (!meta) {
      console.warn(`Metadatos no encontrados para la tabla: ${tabla}`);
      return { id: null, columns: [] };
    }

    const columnasVisibles = meta.columns.filter((col) => col.visible);

    return {
      id: meta.id,
      columns: columnasVisibles,
    };
  }

  async getTablesFromDB() {
    try {
      const pool = await poolPromise;
      const result = await pool.request().input("schema", sql.NVarChar, "oc")
        .query(`
          SELECT TABLE_NAME
          FROM INFORMATION_SCHEMA.TABLES
          WHERE TABLE_SCHEMA = @schema AND TABLE_TYPE = 'BASE TABLE'
        `);

      const tablas = result.recordset
        .filter((row) => this._esTablaPermitida(row.TABLE_NAME))
        .map((row) => ({
          nombre: row.TABLE_NAME,
          ruta: `/administracion/${row.TABLE_NAME}`,
        }));

      return tablas;
    } catch (error) {
      console.error("Error al obtener las tablas de la base de datos:", error);
      throw error;
    }
  }

  async obtenerRegistros(tabla) {
    if (!this._esTablaPermitida(tabla)) {
      throw new Error("Tabla no permitida.");
    }

    try {
      const pool = await poolPromise;
      let query = `SELECT * FROM oc.[${tabla}]`;

      const columnaEliminado = this.columnaEliminado(tabla);
      const columnaEstatus = this.columnaEstatus(tabla);

      const conditions = [];

      if (columnaEliminado) {
        conditions.push(`${columnaEliminado} = 0`);
      }

      if (columnaEstatus) {
        conditions.push(`${columnaEstatus} != 0`);
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(" AND ")}`;
      }

      const result = await pool.request().query(query);
      return result.recordset;
    } catch (error) {
      console.error(`Error al obtener registros de la tabla ${tabla}:`, error);
      throw error;
    }
  }

  async crearRegistro(tabla, datos) {
    if (!this._esTablaPermitida(tabla)) {
      throw new Error("Tabla no permitida.");
    }

    try {
      const pool = await poolPromise;

      const columnas = Object.keys(datos).filter((col) =>
        this._esColumnaPermitida(tabla, col)
      );
      const valores = columnas.map((col, idx) => `@param${idx}`).join(", ");
      const columnasSanitizadas = columnas.map((col) => `[${col}]`).join(", ");

      const query = `
        INSERT INTO oc.[${tabla}] (${columnasSanitizadas})
        VALUES (${valores})
      `;

      const request = pool.request();
      columnas.forEach((col, idx) => {
        const columnaMeta = columnMetadata[tabla].columns.find(
          (c) => c.nombre === col
        );
        request.input(
          `param${idx}`,
          this._getSqlType(columnaMeta.tipo),
          datos[col]
        );
      });

      await request.query(query);
    } catch (error) {
      console.error(`Error al crear registro en la tabla ${tabla}:`, error);
      throw error;
    }
  }

  async obtenerRegistroPorId(tabla, id) {
    if (!this._esTablaPermitida(tabla)) {
      throw new Error("Tabla no permitida.");
    }

    try {
      const pool = await poolPromise;
      const idColumna = columnMetadata[tabla].id;
      const result = await pool
        .request()
        .input("Id", sql.Int, id)
        .query(`SELECT * FROM oc.[${tabla}] WHERE ${idColumna} = @Id`);
      return result.recordset[0];
    } catch (error) {
      console.error(`Error al obtener registro de la tabla ${tabla}:`, error);
      throw error;
    }
  }

  async actualizarRegistro(tabla, id, datos) {
    if (!this._esTablaPermitida(tabla)) {
      throw new Error("Tabla no permitida.");
    }

    try {
      const pool = await poolPromise;

      const columnas = Object.keys(datos).filter((col) =>
        this._esColumnaPermitida(tabla, col)
      );
      const setClause = columnas
        .map((col, idx) => `[${col}] = @param${idx}`)
        .join(", ");

      const query = `
        UPDATE oc.[${tabla}] SET ${setClause} WHERE ${columnMetadata[tabla].id} = @Id
      `;

      const request = pool.request().input("Id", sql.Int, id);
      columnas.forEach((col, idx) => {
        const columnaMeta = columnMetadata[tabla].columns.find(
          (c) => c.nombre === col
        );
        request.input(
          `param${idx}`,
          this._getSqlType(columnaMeta.tipo),
          datos[col]
        );
      });

      await request.query(query);
    } catch (error) {
      console.error(
        `Error al actualizar registro en la tabla ${tabla}:`,
        error
      );
      throw error;
    }
  }

  async eliminarLogico(tabla, id, columna, valor) {
    try {
      const pool = await poolPromise;
      const metadatos = this.obtenerMetadatos(tabla);
      const idColumna = metadatos.id;

      if (!idColumna) {
        throw new Error(`No se encontró la columna ID para la tabla ${tabla}`);
      }

      const query = `UPDATE oc.[${tabla}] SET ${columna} = @valor WHERE ${idColumna} = @id`;

      await pool
        .request()
        .input("valor", sql.Int, valor)
        .input("id", sql.Int, id)
        .query(query);
    } catch (error) {
      console.error(
        `Error al realizar eliminación lógica en la tabla ${tabla}:`,
        error
      );
      throw error;
    }
  }

  async eliminarFisico(tabla, id) {
    try {
      const pool = await poolPromise;
      const metadatos = this.obtenerMetadatos(tabla);
      const idColumna = metadatos.id;

      if (!idColumna) {
        throw new Error(`No se encontró la columna ID para la tabla ${tabla}`);
      }

      const query = `DELETE FROM oc.[${tabla}] WHERE ${idColumna} = @id`;

      await pool.request().input("id", sql.Int, id).query(query);
    } catch (error) {
      console.error(
        `Error al eliminar físicamente registro de la tabla ${tabla}:`,
        error
      );
      throw error;
    }
  }

  async obtenerProveedores() {
    try {
      const pool = await poolPromise;
      const result = await pool
        .request()
        .query(
          `SELECT ID_PROVEEDOR, NOMBRE_PROVEEDOR FROM oc.[Proveedor] WHERE ELIMINADO = 0`
        );
      return result.recordset;
    } catch (error) {
      console.error("Error al obtener proveedores:", error);
      throw error;
    }
  }

  async obtenerBancos() {
    try {
      const pool = await poolPromise;
      const result = await pool
        .request()
        .query(
          `SELECT ID_BANCO, NOMBRE_BANCO FROM oc.[Banco] WHERE ELIMINADO = 0`
        );
      return result.recordset;
    } catch (error) {
      console.error("Error al obtener bancos:", error);
      throw error;
    }
  }

  _getSqlType(tipo) {
    switch (tipo.toLowerCase()) {
      case "int":
        return sql.Int;
      case "varchar":
      case "nvarchar":
        return sql.NVarChar;
      case "date":
      case "datetime":
        return sql.DateTime;
      case "bit":
        return sql.Bit;
      case "timestamp":
        return sql.Timestamp;
      default:
        return sql.NVarChar;
    }
  }
}

export default AdministracionRepository;
