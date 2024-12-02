import { sql, poolPromise } from "../../config/database.js";

// Clase UserRepository que contiene los métodos CRUD para usuarios
class UserRepository {
  // Obtener todos los usuarios
  async getAllUsers() {
    try {
      const pool = await poolPromise;
      const result = await pool
        .request()
        .query(
          "SELECT id, nombre, apellido, depto, correo, activo FROM SistemaWebOC.usuarios"
        );
      return result.recordset.map((user) => ({
        id: Buffer.from(user.id.toString()).toString("base64"), // Codifica ID
        nombre: user.nombre,
        apellido: user.apellido,
        departamento: user.depto,
        correo: user.correo,
        activo: user.activo === 1, // Convertir a booleano para claridad
      }));
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
      throw error;
    }
  }

  // Obtener usuario por ID decodificado
  async getUserById(decodedId) {
    try {
      // Conectar al pool y realizar la consulta
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("id", sql.Int, decodedId)
        .query("SELECT * FROM SistemaWebOC.usuarios WHERE id = @id");

      const user = result.recordset[0];

      // Si el usuario no se encuentra, devolver null
      if (!user) return null;

      // Transformar el objeto del usuario a JSON, con id en Base64 y activo como booleano
      const userJson = {
        id: Buffer.from(user.id.toString()).toString("base64"),
        nombre: user.nombre,
        apellido: user.apellido,
        departamento: user.depto,
        correo: user.correo,
        activo: Boolean(user.activo),
      };

      return userJson;
    } catch (error) {
      console.error("Error al obtener usuario por ID:", error);
      throw error;
    }
  }

  // Crear un nuevo usuario
  async createUser({
    nombre,
    apellido,
    departamento,
    correo,
    clave,
    activo,
    usuarioCreador,
  }) {
    try {
      const pool = await poolPromise;

      // Verifica si el correo ya está en uso
      const checkEmail = await pool
        .request()
        .input("correo", sql.NVarChar, correo)
        .query("SELECT id FROM SistemaWebOC.usuarios WHERE correo = @correo");

      if (checkEmail.recordset.length > 0) {
        const error = new Error("El correo ya está en uso");
        error.code = "DUPLICATE_EMAIL";
        throw error;
      }

      // Si no existe el correo, inserta el nuevo usuario
      const result = await pool
        .request()
        .input("nombre", sql.NVarChar, nombre)
        .input("apellido", sql.NVarChar, apellido)
        .input("depto", sql.NVarChar, departamento)
        .input("correo", sql.NVarChar, correo)
        .input("clave", sql.NVarChar, clave)
        .input("activo", sql.Bit, activo)
        .input("usuario_creador", sql.Int, usuarioCreador).query(`
          INSERT INTO SistemaWebOC.usuarios (nombre, apellido, depto, correo, clave, activo, usuario_creador)
          OUTPUT INSERTED.id
          VALUES (@nombre, @apellido, @depto, @correo, @clave, @activo, @usuario_creador)
        `);

      return result.recordset[0];
    } catch (error) {
      console.error("Error al crear usuario:", error);
      throw error;
    }
  }

  // Actualizar un usuario existente
  async updateUser(id, { nombre, apellido, departamento, correo, clave }) {
    try {
      // Obtener el usuario actual usando la función getUserById
      const currentUser = await this.getUserById(id);

      if (!currentUser) {
        throw new Error("Usuario no encontrado");
      }

      // Construir la consulta de actualización solo con los campos modificados
      let query = "UPDATE SistemaWebOC.usuarios SET ";
      const queryFields = [];
      const params = { id };

      // Solo agregar los campos que hayan cambiado
      if (nombre && nombre !== currentUser.nombre) {
        queryFields.push("nombre = @nombre");
        params.nombre = nombre;
      }
      if (apellido && apellido !== currentUser.apellido) {
        queryFields.push("apellido = @apellido");
        params.apellido = apellido;
      }
      if (departamento && departamento !== currentUser.departamento) {
        queryFields.push("depto = @departamento");
        params.departamento = departamento;
      }
      if (correo && correo !== currentUser.correo) {
        queryFields.push("correo = @correo");
        params.correo = correo;
      }
      if (clave && clave !== currentUser.clave) {
        queryFields.push("clave = @clave");
        params.clave = clave;
      }


      // Si no hay cambios, no ejecutar la actualización
      if (!queryFields.length) {
        return false;
      }

      // Completar y ejecutar la consulta
      query += queryFields.join(", ") + " WHERE id = @id";
      const pool = await poolPromise;
      const updateRequest = pool.request();

      // Asignar los valores modificados al request
      Object.keys(params).forEach((key) => {
        updateRequest.input(key, params[key]);
      });

      const result = await updateRequest.query(query);
      return result.rowsAffected[0] > 0;
    } catch (error) {
      console.error("Error al actualizar usuario:", error);
      throw error;
    }
  }

  // Eliminar un usuario
  async deleteUser(id) {
    try {
      const pool = await poolPromise;
      const result = await pool.request().input("id", sql.Int, id).query(`
        DELETE FROM SistemaWebOC.usuarios
        WHERE id = @id
      `);

      // Devuelve `true` si se eliminó una fila, o `false` si no se encontró el usuario
      return result.rowsAffected[0] > 0;
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      throw error;
    }
  }
}

export default UserRepository;
