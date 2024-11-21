// src/adapters/repository/administracionRepository.js
import { sql, poolPromise } from "../../config/database.js";

class AdministracionRepository {
  async getTablesFromDB() {
    try {
      const pool = await poolPromise;
      const result = await pool.request().input("schema", sql.NVarChar, "oc")
        .query(`
          SELECT TABLE_NAME
          FROM INFORMATION_SCHEMA.TABLES
          WHERE TABLE_SCHEMA = @schema AND TABLE_TYPE = 'BASE TABLE'
        `);

      const tablas = result.recordset.map((row) => ({
        nombre: row.TABLE_NAME,
        ruta: `/administracion/${row.TABLE_NAME.toLowerCase()}`,
      }));

      return tablas;
    } catch (error) {
      console.error("Error al obtener las tablas de la base de datos:", error);
      throw error;
    }
  }

  async obtenerRegistros(tabla) {
    try {
      const pool = await poolPromise;
      const result = await pool.request().query(`SELECT * FROM oc.[${tabla}]`);
      return result.recordset;
    } catch (error) {
      console.error(`Error al obtener registros de la tabla ${tabla}:`, error);
      throw error;
    }
  }

  async crearRegistro(tabla, datos) {
    try {
      const pool = await poolPromise;

      const columnas = Object.keys(datos);
      const valores = Object.values(datos);

      const query = `
        INSERT INTO oc.[${tabla}] (${columnas
        .map((col) => `[${col}]`)
        .join(", ")})
        VALUES (${columnas.map((_, idx) => `@param${idx}`).join(", ")})
      `;

      const request = pool.request();
      columnas.forEach((col, idx) => {
        request.input(`param${idx}`, this._getSqlType(datos[col]), datos[col]);
      });

      await request.query(query);
    } catch (error) {
      console.error(`Error al crear registro en la tabla ${tabla}:`, error);
      throw error;
    }
  }

  async obtenerRegistroPorId(tabla, id) {
    try {
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("Id", sql.Int, id)
        .query(`SELECT * FROM oc.[${tabla}] WHERE Id = @Id`);
      return result.recordset[0];
    } catch (error) {
      console.error(`Error al obtener registro de la tabla ${tabla}:`, error);
      throw error;
    }
  }

  async obtenerColumnas(tabla) {
    try {
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("tabla", sql.NVarChar, tabla)
        .input("schema", sql.NVarChar, "oc").query(`
          SELECT
            COLUMN_NAME,
            DATA_TYPE,
            IS_NULLABLE,
            COLUMNPROPERTY(OBJECT_ID(TABLE_SCHEMA + '.' + TABLE_NAME), COLUMN_NAME, 'IsIdentity') AS IS_IDENTITY,
            COLUMNPROPERTY(OBJECT_ID(TABLE_SCHEMA + '.' + TABLE_NAME), COLUMN_NAME, 'IsComputed') AS IS_COMPUTED
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_NAME = @tabla AND TABLE_SCHEMA = @schema
        `);
      return result.recordset;
    } catch (error) {
      console.error(`Error al obtener columnas de la tabla ${tabla}:`, error);
      throw error;
    }
  }

  async actualizarRegistro(tabla, id, datos) {
    try {
      const pool = await poolPromise;

      const setClause = Object.keys(datos)
        .map((col, idx) => `[${col}] = @param${idx}`)
        .join(", ");

      const query = `
        UPDATE oc.[${tabla}] SET ${setClause} WHERE Id = @Id
      `;

      const request = pool.request().input("Id", sql.Int, id);
      Object.keys(datos).forEach((col, idx) => {
        request.input(`param${idx}`, this._getSqlType(datos[col]), datos[col]);
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

  async eliminarRegistro(tabla, id) {
    try {
      const pool = await poolPromise;
      await pool
        .request()
        .input("Id", sql.Int, id)
        .query(`DELETE FROM oc.[${tabla}] WHERE Id = @Id`);
    } catch (error) {
      console.error(`Error al eliminar registro de la tabla ${tabla}:`, error);
      throw error;
    }
  }

  _getSqlType(value) {
    if (typeof value === "number") {
      return sql.Int;
    } else if (typeof value === "string") {
      return sql.NVarChar;
    } else if (value instanceof Date) {
      return sql.DateTime;
    } else {
      return sql.NVarChar;
    }
  }
}

export default AdministracionRepository;
