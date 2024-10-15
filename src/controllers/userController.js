import userService from "../application/userService.js";

// Obtener todos los usuarios
export const getAllUsers = async (req, res) => {
  try {
    const usuarios = await userService.getAllUsers();
    return usuarios;
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Error al obtener los usuarios" });
  }
};

// Obtener un usuario por ID
export const getUserById = async (req, res) => {
  try {
    // Decodifica el ID del usuario
    const decodedId = Buffer.from(req.session.user.id, "base64").toString(
      "utf-8"
    );
    // Usa el ID decodificado para buscar en la base de datos
    const user = await userService.getUserById(decodedId);

    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    return res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Error al obtener el usuario" });
  }
};

// Crear un usuario
export const createUser = async (req, res) => {
  try {
    const {
      usuarioClave,
      usuarioNombre,
      usuarioApellido,
      usuarioDepartamento,
      usuarioCorreo,
    } = req.body;
    const usuarioCreador = req.session.userId;

    if (
      !usuarioClave ||
      !usuarioNombre ||
      !usuarioApellido ||
      !usuarioCorreo ||
      !usuarioDepartamento
    ) {
      return res.render("usuario-agregar", {
        error: "Faltan campos obligatorios.",
        success_msg: null,
      });
    }

    await userService.createUser(
      usuarioClave,
      usuarioNombre,
      usuarioDepartamento,
      usuarioCorreo,
      usuarioApellido,
      usuarioCreador
    );
    return res.render("usuario-agregar", {
      error: null,
      success_msg: "Usuario creado exitosamente.",
    });
  } catch (error) {
    console.error("Error creating user:", error);
    if (error.message === "El email ya está registrado.") {
      return res.render("usuario-agregar", {
        error: error.message,
        success_msg: null,
      });
    }
    return res.render("usuario-agregar", {
      error: "Error al crear el usuario",
      success_msg: null,
    });
  }
};

// Actualizar un usuario
export const updateUserById = async (req, res) => {
  try {
    const {
      usuarioNombre,
      usuarioApellido,
      usuarioDepartamento,
      usuarioCorreo,
      usuarioClave,
    } = req.body;
    const userUpdateData = {
      nombre: usuarioNombre,
      apellido: usuarioApellido,
      depto: usuarioDepartamento,
      correo: usuarioCorreo,
    };
    if (usuarioClave) userUpdateData.clave = usuarioClave;

    const updatedUser = await userService.updateUserById(
      req.params.id,
      userUpdateData
    );
    if (!updatedUser)
      return res.status(404).json({ error: "Usuario no encontrado" });
    return res.json({ message: "Usuario actualizado correctamente" });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Error al actualizar el usuario" });
  }
};

// Eliminar un usuario
export const deleteUser = async (req, res) => {
  try {
    const deletedUser = await userService.deleteUser(req.params.id);
    if (!deletedUser)
      return res.status(404).json({ error: "Usuario no encontrado" });
    return res.json({ message: "Usuario eliminado correctamente" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Error al eliminar el usuario" });
  }
};
