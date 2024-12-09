import { sql, poolPromise } from "../../config/database.js";

class CentroCostoRepository {
  constructor() {
    this.tabla = "oc.CentroCosto";
    this.tablaUsuarios = "centralusuarios.Usuarios";
  }

  // Obtener todos los Centros de Costo, incluyendo los datos del gerente
  async getAll() {
    try {
      const pool = await poolPromise;
      const result = await pool.request().query(`
          SELECT 
            cc.id_centro_costo, 
            cc.codigo_centro_costo, 
            cc.nombre, 
            cc.estatus, 
            cc.id_gerente, 
            u.nombre AS nombre_gerente, 
            u.apellido AS apellido_gerente,
            cc.nivel,
            cc.monto
          FROM ${this.tabla} cc
          LEFT JOIN ${this.tablaUsuarios} u ON cc.id_gerente = u.id
        `);
      return result.recordset;
    } catch (error) {
      console.error("Error en CentroCostoRepository.getAll:", error);
      throw error;
    }
  }

  // Obtener Centros de Costo por estatus, incluyendo los datos del gerente
  async getByEstatus(estatus) {
    try {
      const pool = await poolPromise;
      const result = await pool.request().input("estatus", sql.VarChar, estatus)
        .query(`
          SELECT 
            cc.id_centro_costo, 
            cc.codigo_centro_costo, 
            cc.nombre, 
            cc.estatus, 
            cc.id_gerente, 
            u.nombre AS nombre_gerente, 
            u.apellido AS apellido_gerente,
            cc.nivel,
            cc.monto
          FROM ${this.tabla} cc
          LEFT JOIN ${this.tablaUsuarios} u ON cc.id_gerente = u.id
          WHERE cc.estatus = @estatus
        `);
      return result.recordset;
    } catch (error) {
      console.error("Error en CentroCostoRepository.getByEstatus:", error);
      throw error;
    }
  }

  // Obtener un Centro de Costo por su ID, incluyendo los datos del gerente
  async getById(id) {
    try {
      const pool = await poolPromise;
      const result = await pool.request().input("id_centro_costo", sql.Int, id)
        .query(`
          SELECT 
            cc.id_centro_costo, 
            cc.codigo_centro_costo, 
            cc.nombre, 
            cc.estatus, 
            cc.id_gerente, 
            u.nombre AS nombre_gerente, 
            u.apellido AS apellido_gerente,
            cc.nivel,
            cc.monto
          FROM ${this.tabla} cc
          LEFT JOIN ${this.tablaUsuarios} u ON cc.id_gerente = u.id
          WHERE cc.id_centro_costo = @id_centro_costo
        `);
      return result.recordset[0];
    } catch (error) {
      console.error("Error en CentroCostoRepository.getById:", error);
      throw error;
    }
  }

  // Crear un nuevo Centro de Costo
  async create(datos) {
    try {
      const pool = await poolPromise;
      const monto = datos.monto != null ? datos.monto : 0.0;
      await pool
        .request()
        .input("codigo_centro_costo", sql.NVarChar, datos.codigo_centro_costo)
        .input("nombre", sql.VarChar, datos.nombre)
        .input("estatus", sql.VarChar, datos.estatus)
        .input("id_gerente", sql.Int, datos.id_gerente)
        .input("nivel", sql.Int, datos.nivel)
        .input("monto", sql.Decimal(18, 2), monto).query(`
          INSERT INTO ${this.tabla}
            (codigo_centro_costo, nombre, estatus, id_gerente, create_at, create_update, nivel, monto)
          VALUES
            (@codigo_centro_costo, @nombre, @estatus, @id_gerente, GETDATE(), GETDATE(), @nivel, @monto)
        `);
    } catch (error) {
      console.error("Error en CentroCostoRepository.create:", error);
      throw error;
    }
  }

  // Actualizar un Centro de Costo existente
  async update(id, datos) {
    try {
      const pool = await poolPromise;
      const monto = datos.monto != null ? datos.monto : 0.0; // Valor predeterminado
      await pool
        .request()
        .input("id_centro_costo", sql.Int, id)
        .input("codigo_centro_costo", sql.NVarChar, datos.codigo_centro_costo)
        .input("nombre", sql.VarChar, datos.nombre)
        .input("estatus", sql.VarChar, datos.estatus)
        .input("id_gerente", sql.Int, datos.id_gerente)
        .input("nivel", sql.Int, datos.nivel)
        .input("monto", sql.Decimal(18, 2), monto).query(`
          UPDATE ${this.tabla}
          SET 
            codigo_centro_costo = @codigo_centro_costo,
            nombre = @nombre,
            estatus = @estatus,
            id_gerente = @id_gerente,
            create_update = GETDATE(),
            nivel = @nivel,
            monto = @monto
          WHERE id_centro_costo = @id_centro_costo
        `);
    } catch (error) {
      console.error("Error en CentroCostoRepository.update:", error);
      throw error;
    }
  }

  // Actualizar el estatus de un Centro de Costo
  async actualizarEstatus(id, estatus) {
    try {
      const pool = await poolPromise;
      await pool
        .request()
        .input("id_centro_costo", sql.Int, id)
        .input("estatus", sql.VarChar, estatus).query(`
          UPDATE ${this.tabla}
          SET 
            estatus = @estatus,
            create_update = GETDATE()
          WHERE id_centro_costo = @id_centro_costo
        `);
    } catch (error) {
      console.error("Error en CentroCostoRepository.actualizarEstatus:", error);
      throw error;
    }
  }

  // Obtener la lista de gerentes (nombre y apellido) de la tabla Usuarios
  async getGerentes() {
    try {
      const pool = await poolPromise;
      const result = await pool.request().query(`
          SELECT id, nombre, apellido
          FROM ${this.tablaUsuarios}
          WHERE activo = 1
        `);
      return result.recordset;
    } catch (error) {
      console.error("Error en CentroCostoRepository.getGerentes:", error);
      throw error;
    }
  }
}

export default CentroCostoRepository;
