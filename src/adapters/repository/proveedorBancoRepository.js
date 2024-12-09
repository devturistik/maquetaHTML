import { sql, poolPromise } from "../../config/database.js";

class ProveedorBancoRepository {
  constructor() {
    this.tabla = "oc.ProveedorBanco"; // Esquema y tabla
    this.idColumn = "id_proveedor_banco"; // Columna de ID de la tabla intermedia
  }

  // Crear una nueva relación ProveedorBanco
  async create(proveedorId, datos) {
    try {
      const pool = await poolPromise;
      await pool
        .request()
        .input("id_proveedor", sql.Int, proveedorId)
        .input("id_banco", sql.Int, datos.id_banco)
        .input("numero_cuenta", sql.VarChar, datos.numero_cuenta)
        .input("tipo_cuenta", sql.VarChar, datos.tipo_cuenta)
        .input("swift_cuenta", sql.VarChar, datos.swift_cuenta)
        .input("aba_cuenta", sql.VarChar, datos.aba_cuenta)
        .input("iban_cuenta", sql.VarChar, datos.iban_cuenta)
        .input("correo_banco", sql.VarChar, datos.correo_banco)
        .input("estatus_banco", sql.VarChar, datos.estatus_banco)
        .input("fecha_creacion", sql.Date, datos.fecha_creacion)
        .input("fecha_actualizacion", sql.Date, datos.fecha_actualizacion)
        .query(`
          INSERT INTO ${this.tabla} 
            (id_proveedor, id_banco, numero_cuenta, tipo_cuenta, swift_cuenta, aba_cuenta, iban_cuenta, correo_banco, estatus_banco, fecha_creacion, fecha_actualizacion)
          VALUES 
            (@id_proveedor, @id_banco, @numero_cuenta, @tipo_cuenta, @swift_cuenta, @aba_cuenta, @iban_cuenta, @correo_banco, @estatus_banco, @fecha_creacion, @fecha_actualizacion)
        `);
    } catch (error) {
      console.error("Error en ProveedorBancoRepository.create:", error);
      throw error;
    }
  }

  // Obtener todos los bancos asignados a un proveedor
  async getAllByProveedorId(proveedorId) {
    try {
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("id_proveedor", sql.Int, proveedorId).query(`
          SELECT 
            pb.id_proveedor_banco,
            b.nombre_banco,
            pb.numero_cuenta,
            pb.tipo_cuenta,
            pb.swift_cuenta,
            pb.aba_cuenta,
            pb.iban_cuenta,
            pb.correo_banco,
            pb.estatus_banco,
            pb.fecha_creacion,
            pb.fecha_actualizacion
          FROM ${this.tabla} pb
          JOIN oc.Banco b ON pb.id_banco = b.id_banco
          WHERE pb.id_proveedor = @id_proveedor
        `);
      return result.recordset;
    } catch (error) {
      console.error(
        "Error en ProveedorBancoRepository.getAllByProveedorId:",
        error
      );
      throw error;
    }
  }

  // Obtener una asignación específica
  async getById(proveedorId, bancoAsignadoId) {
    try {
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("id_proveedor_banco", sql.Int, bancoAsignadoId)
        .input("id_proveedor", sql.Int, proveedorId).query(`
          SELECT 
            pb.id_proveedor_banco,
            pb.id_proveedor,
            pb.id_banco,
            b.nombre_banco,
            pb.numero_cuenta,
            pb.tipo_cuenta,
            pb.swift_cuenta,
            pb.aba_cuenta,
            pb.iban_cuenta,
            pb.correo_banco,
            pb.estatus_banco,
            pb.fecha_creacion,
            pb.fecha_actualizacion
          FROM ${this.tabla} pb
          JOIN oc.Banco b ON pb.id_banco = b.id_banco
          WHERE pb.id_proveedor_banco = @id_proveedor_banco AND pb.id_proveedor = @id_proveedor
        `);
      return result.recordset[0];
    } catch (error) {
      console.error("Error en ProveedorBancoRepository.getById:", error);
      throw error;
    }
  }

  // Actualizar una asignación existente
  async update(proveedorId, bancoAsignadoId, datos) {
    try {
      const pool = await poolPromise;
      await pool
        .request()
        .input("id_proveedor_banco", sql.Int, bancoAsignadoId)
        .input("id_banco", sql.Int, datos.id_banco)
        .input("numero_cuenta", sql.VarChar, datos.numero_cuenta)
        .input("tipo_cuenta", sql.VarChar, datos.tipo_cuenta)
        .input("swift_cuenta", sql.VarChar, datos.swift_cuenta)
        .input("aba_cuenta", sql.VarChar, datos.aba_cuenta)
        .input("iban_cuenta", sql.VarChar, datos.iban_cuenta)
        .input("correo_banco", sql.VarChar, datos.correo_banco)
        .input("estatus_banco", sql.VarChar, datos.estatus_banco)
        .input("fecha_actualizacion", sql.Date, datos.fecha_actualizacion)
        .query(`
          UPDATE ${this.tabla}
          SET 
            id_banco = @id_banco,
            numero_cuenta = @numero_cuenta,
            tipo_cuenta = @tipo_cuenta,
            swift_cuenta = @swift_cuenta,
            aba_cuenta = @aba_cuenta,
            iban_cuenta = @iban_cuenta,
            correo_banco = @correo_banco,
            estatus_banco = @estatus_banco,
            fecha_actualizacion = @fecha_actualizacion
          WHERE id_proveedor_banco = @id_proveedor_banco AND id_proveedor = @id_proveedor
        `);
    } catch (error) {
      console.error("Error en ProveedorBancoRepository.update:", error);
      throw error;
    }
  }

  // Eliminar una asignación (soft delete si es necesario)
  async delete(proveedorId, bancoAsignadoId) {
    try {
      const pool = await poolPromise;
      await pool.request().input("id_proveedor_banco", sql.Int, bancoAsignadoId)
        .query(`
          DELETE FROM ${this.tabla}
          WHERE id_proveedor_banco = @id_proveedor_banco AND id_proveedor = @id_proveedor
        `);
    } catch (error) {
      console.error("Error en ProveedorBancoRepository.delete:", error);
      throw error;
    }
  }
}

export default ProveedorBancoRepository;
