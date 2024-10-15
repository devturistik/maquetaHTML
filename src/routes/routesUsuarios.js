// src/routes/routeUsuarios.js
import express from "express";
import userService from "../application/userService.js";
const router = express.Router();

// Ruta para ver la lista de usuarios
router.get("/", async (req, res) => {
  try {
    // Obtener todos los usuarios desde el servicio
    const usuarios = await userService.getAllUsers();
    res.render("usuarios", { usuarios });
  } catch (error) {
    console.error("Error al obtener lista de usuarios:", error);
    res.status(500).render("error", { error: "Error al cargar usuarios" });
  }
});

// Ruta para ver el detalle de un usuario por su ID
router.get("/ver/:encodedId", async (req, res) => {
  try {
    // Decodifica el ID desde Base64
    const decodedId = atob(req.params.encodedId);

    // Obtener usuario específico
    const usuario = await userService.getUserById(decodedId);

    if (!usuario) {
      return res
        .status(404)
        .render("error", { error: "Usuario no encontrado" });
    }

    res.render("usuario/ver", { usuario, error: null });
  } catch (error) {
    console.error("Error al obtener usuario por ID:", error);
  }
});

// Ruta para actualizar un usuario existente
router.get("/editar/:encodedId", async (req, res) => {
  try {
    const decodedId = atob(req.params.encodedId); // Decodificar el ID de Base64
    const usuario = await userService.getUserById(decodedId); // Obtener usuario específico para edición

    if (!usuario) {
      return res
        .status(404)
        .render("error", { error: "Usuario no encontrado" });
    }

    res.render("usuario/editar", {
      usuario,
      success_msg: null,
      error: null,
    });
  } catch (error) {
    console.error("Error al obtener usuario para editar:", error);
    res
      .status(500)
      .render("error", { error: "Error al cargar usuario para edición" });
  }
});
router.post("/editar/:encodedId", async (req, res) => {
  try {
    // Decodificar el ID de Base64
    const decodedId = atob(req.params.encodedId);

    // Extraer datos del cuerpo de la solicitud
    const {
      usuarioNombre,
      usuarioApellido,
      usuarioDepartamento,
      usuarioCorreo,
      usuarioClave,
    } = req.body;

    // Crear un objeto solo con los campos que tienen valores
    const newUserData = {
      ...(usuarioNombre && { nombre: usuarioNombre }),
      ...(usuarioApellido && { apellido: usuarioApellido }),
      ...(usuarioDepartamento && { departamento: usuarioDepartamento }),
      ...(usuarioCorreo && { correo: usuarioCorreo }),
      ...(usuarioClave && { clave: usuarioClave || null }),
    };

    // Verificar que los campos requeridos no estén vacíos
    if (
      !usuarioNombre ||
      !usuarioApellido ||
      !usuarioDepartamento ||
      !usuarioCorreo
    ) {
      return res.render("usuario/editar", {
        usuario: newUserData,
        success_msg: null,
        error: "Todos los campos excepto la clave son obligatorios.",
      });
    }

    // Llamar al servicio de usuario para actualizarlo en la base de datos
    const resultado = await userService.updateUser(decodedId, newUserData);

    if (!resultado) {
      return res.render("usuario/editar", {
        usuario: newUserData,
        error: "No hay cambios a realizar",
      });
    }

    // Redirigir a la vista de edición con mensaje de éxito
    res.render("usuario/editar", {
      usuario: newUserData,
      success_msg: "Usuario actualizado exitosamente",
      error: null,
    });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    res.status(500).render("usuario/editar", {
      usuario: req.body,
      success_msg: null,
      error: "Error al actualizar usuario",
    });
  }
});

// Ruta para agregar un usuario
router.get("/agregar", (req, res) => {
  res.render("usuario/agregar", { error: null, success_msg: null });
});
router.post("/", async (req, res) => {
  try {
    // Extrae los datos del formulario de la solicitud
    const {
      usuarioNombre,
      usuarioApellido,
      usuarioDepartamento,
      usuarioCorreo,
      usuarioClave,
    } = req.body;

    // Validar que los campos no estén vacíos
    if (
      !usuarioNombre ||
      !usuarioApellido ||
      !usuarioDepartamento ||
      !usuarioCorreo ||
      !usuarioClave
    ) {
      return res.status(400).render("usuario/agregar", {
        error: "Todos los campos son obligatorios",
        success_msg: null,
      });
    }

    // Crea un objeto usuario con los datos necesarios
    const nuevoUsuario = {
      nombre: usuarioNombre,
      apellido: usuarioApellido,
      departamento: usuarioDepartamento,
      correo: usuarioCorreo,
      clave: usuarioClave,
      activo: 0,
      usuarioCreador: atob(res.locals.user.id),
    };

    // Llama al servicio para crear el usuario
    await userService.createUser(nuevoUsuario);

    // Redirecciona a la lista de usuarios
    res.render("usuarios", {
      error: null,
      success_msg: "Usuario creado con exito!",
    });
  } catch (error) {
    console.error("Error al agregar usuario:", error);

    // Si el error es de duplicidad de correo, muestra un mensaje específico
    if (error.code === "DUPLICATE_EMAIL") {
      return res.status(400).render("usuario/agregar", {
        error: "El correo ya está en uso. Por favor, elige otro.",
        success_msg: null,
      });
    }

    // Otros errores
    res.status(500).render("usuario/agregar", {
      error: "Error al agregar usuario",
      success_msg: null,
    });
  }
});

// Ruta para eliminar un usuario
router.post("/eliminar/:encodedId", async (req, res) => {
  try {
    // Decodifica el ID desde Base64
    const decodedId = atob(req.params.encodedId);

    // Llama al servicio para eliminar el usuario
    const usuarioEliminado = await userService.deleteUser(decodedId);

    // Verifica si el usuario fue encontrado y eliminado
    if (!usuarioEliminado) {
      return res.render("usuarios", { error: "Usuario no encontrado" });
    }

    // Enviar una respuesta de éxito
    res.render("usuarios", { success_msg: "Usuario eliminado exitosamente" });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);

    // Responder con un mensaje de error
    res.render("usuarios", { error: "Error al eliminar usuario" });
  }
});

export default router;
