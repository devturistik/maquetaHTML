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
          ORDER BY TABLE_NAME ASC
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
      let query = "";
      const metadatos = columnMetadata[tabla];
      const columnas = metadatos.columns.map((col) => col.nombre.toUpperCase());

      let tableAlias = "";
      if (tabla === "Proveedor") {
        tableAlias = "p";
      } else if (tabla === "TipoOrden") {
        tableAlias = "t";
      }

      const getPrefixedColumn = (columnName) => {
        return tableAlias ? `${tableAlias}.[${columnName}]` : `[${columnName}]`;
      };

      const condiciones = [];

      if (columnas.includes("ELIMINADO")) {
        condiciones.push(`${getPrefixedColumn("ELIMINADO")} = 0`);
      }

      const columnasEstatus = metadatos.columns.filter((col) =>
        col.nombre.toUpperCase().includes("ESTATUS")
      );

      if (columnasEstatus.length > 0) {
        columnasEstatus.forEach((col) => {
          condiciones.push(`${getPrefixedColumn(col.nombre)} != 0`);
        });
      }

      if (tabla === "Proveedor") {
        query = `
          SELECT
            p.*,
            ISNULL(
              STUFF((
                SELECT '; ' + b.NOMBRE_BANCO + ' (NUMERO_CUENTA: ' + pb.NUMERO_CUENTA + ', TIPO_CUENTA: ' + pb.TIPO_CUENTA + ', CORREO_BANCO: ' + pb.CORREO_BANCO + ')'
                FROM oc.ProveedorBanco pb
                INNER JOIN oc.Banco b ON pb.ID_BANCO = b.ID_BANCO
                WHERE pb.ID_PROVEEDOR = p.ID_PROVEEDOR
                FOR XML PATH(''), TYPE
              ).value('.', 'NVARCHAR(MAX)'), 1, 2, ''), 'N/A') AS Bancos_Asociados
          FROM
            oc.Proveedor p
        `;
        if (condiciones.length > 0) {
          query += ` WHERE ${condiciones.join(" AND ")}`;
        }
        query += " ORDER BY p.ID_PROVEEDOR";
      } else if (tabla === "TipoOrden") {
        query = `
          SELECT
            t.*,
            ISNULL(
              STUFF((
                SELECT '; ' + d.NOMBRE_DETALLE + ' (CANTIDAD: ' + CAST(d.CANTIDAD AS VARCHAR) + ', TIPO_DETALLE: ' + d.TIPO_DETALLE + ')'
                FROM oc.DetalleTipoOrden d
                WHERE d.ID_TIPO_ORDEN = t.ID_TIPO
                FOR XML PATH(''), TYPE
              ).value('.', 'NVARCHAR(MAX)'), 1, 2, ''), 'Sin detalles') AS Detalles_Asociados
          FROM
            oc.TipoOrden t
        `;
        if (condiciones.length > 0) {
          query += ` WHERE ${condiciones.join(" AND ")}`;
        }
        query += " ORDER BY t.ID_TIPO";
      } else {
        query = `SELECT * FROM oc.[${tabla}]`;
        if (condiciones.length > 0) {
          query += ` WHERE ${condiciones.join(" AND ")}`;
        }
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
      const metadatos = columnMetadata[tabla];
      const idColumna = metadatos.id;

      if (!idColumna) {
        throw new Error(`No se encontró la columna ID para la tabla ${tabla}`);
      }

      const query = `UPDATE oc.[${tabla}] SET [${columna}] = @valor WHERE [${idColumna}] = @id`;

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
      const metadatos = columnMetadata[tabla];
      const idColumna = metadatos.id;

      if (!idColumna) {
        throw new Error(`No se encontró la columna ID para la tabla ${tabla}`);
      }

      const query = `DELETE FROM oc.[${tabla}] WHERE [${idColumna}] = @id`;

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
          `SELECT ID_PROVEEDOR, NOMBRE_PROVEEDOR FROM oc.[Proveedor] WHERE ELIMINADO = 0 AND ESTATUS_PROVEEDOR = 1`
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
          `SELECT ID_BANCO, NOMBRE_BANCO FROM oc.[Banco] WHERE ESTATUS = 1`
        );
      return result.recordset;
    } catch (error) {
      console.error("Error al obtener bancos:", error);
      throw error;
    }
  }

  async obtenerTiposOrden() {
    try {
      const pool = await poolPromise;
      const result = await pool
        .request()
        .query(
          `SELECT ID_TIPO, NOMBRE FROM oc.[TipoOrden] WHERE ESTATUS_TIPO_ORDEN != 0`
        );
      return result.recordset;
    } catch (error) {
      console.error("Error al obtener tipos de orden:", error);
      throw error;
    }
  }

  async establecerRelacionProveedorBanco(idProveedor, idBanco, data) {
    try {
      const pool = await poolPromise;
      const query = `
        INSERT INTO oc.ProveedorBanco (ID_PROVEEDOR, ID_BANCO, NUMERO_CUENTA, TIPO_CUENTA, CORREO_BANCO)
        VALUES (@idProveedor, @idBanco, @NUMERO_CUENTA, @TIPO_CUENTA, @CORREO_BANCO)
      `;
      await pool
        .request()
        .input("idProveedor", sql.Int, idProveedor)
        .input("idBanco", sql.Int, idBanco)
        .input("NUMERO_CUENTA", sql.VarChar, data.NUMERO_CUENTA)
        .input("TIPO_CUENTA", sql.VarChar, data.TIPO_CUENTA)
        .input("CORREO_BANCO", sql.VarChar, data.CORREO_BANCO)
        .query(query);
    } catch (error) {
      console.error("Error al establecer relación en ProveedorBanco:", error);
      throw error;
    }
  }

  async establecerRelacionTipoOrden(idTipoOrden, data) {
    try {
      const pool = await poolPromise;
      const query = `
        INSERT INTO oc.DetalleTipoOrden (ID_TIPO_ORDEN, NOMBRE_DETALLE, CANTIDAD, TIPO_DETALLE)
        VALUES (@idTipoOrden, @NOMBRE_DETALLE, @CANTIDAD, @TIPO_DETALLE)
      `;
      await pool
        .request()
        .input("idTipoOrden", sql.Int, idTipoOrden)
        .input("NOMBRE_DETALLE", sql.NVarChar, data.NOMBRE_DETALLE)
        .input("CANTIDAD", sql.Decimal(18, 2), data.CANTIDAD)
        .input("TIPO_DETALLE", sql.NVarChar, data.TIPO_DETALLE)
        .query(query);
    } catch (error) {
      console.error("Error al establecer relación en DetalleTipoOrden:", error);
      throw error;
    }
  }

  async obtenerDetallesTipoOrden() {
    try {
      const pool = await poolPromise;
      const result = await pool
        .request()
        .query(
          `SELECT ID_DETALLE_TIPO_ORDEN, NOMBRE_DETALLE FROM oc.DetalleTipoOrden`
        );
      return result.recordset;
    } catch (error) {
      console.error("Error al obtener detalles de tipo de orden:", error);
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
