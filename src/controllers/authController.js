// src/controllers/authController.js
import authService from "../application/authService.js";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await authService.login(email, password);

    if (!user) {
      return res.render("login", {
        title: "Login",
        error: "Correo o contraseña incorrectos",
      });
    }

    // Codificación en Base64 para mayor seguridad
    const encodedUserId = Buffer.from(user.id.toString()).toString("base64");

    // Guardado de la sesión
    req.session.user = {
      id: encodedUserId,
      nombre: user.nombre,
      apellido: user.apellido,
      departamento: user.departamento,
      correo: user.correo,
      rol: user.rol || "usuario",
    };

    res.redirect("/dashboard");
  } catch (error) {
    if (error.message === "El usuario no está activado.") {
      return res.render("login", { title: "Login", error: error.message });
    }

    // Otros errores
    console.error("Error al iniciar sesión:", error);
    res.render("login", { title: "Login", error: "Error en el servidor" });
  }
};

export const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).send("Error al cerrar sesión");
    res.redirect("/login");
  });
};
