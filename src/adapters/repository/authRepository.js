// src/adapters/repository/authRepository.js
import sql from "mssql";
import config from "../../config/database.js";
import User from "../../domain/user.js";

export default class AuthRepository {
  constructor() {
    this.poolPromise = sql.connect(config); // Conexión a la BD
  }

  // Obtiene usuario por correo
  async getUserByEmail(email) {
    try {
      const pool = await this.poolPromise;
      const result = await pool
        .request()
        .input("correo", sql.NVarChar, email)
        .query("SELECT * FROM SistemaWebOC.usuarios WHERE correo = @correo");

      const user = result.recordset[0];
      return user ? new User(user) : null;
    } catch (error) {
      console.error("Error fetching user by email:", error);
      throw error;
    }
  }
}
