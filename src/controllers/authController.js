// src/controllers/authController.js
import fetch from "node-fetch"; // Usa import en lugar de require

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Obtener el token
    const tokenResponse = await fetch(
      process.env.URL_API_AUTH_TOKEN,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: process.env.API_USERNAME, // Debe estar seguro en variables de entorno
          password: process.env.API_PASSWORD, // Debe estar seguro en variables de entorno
          scope: "OC",
        }),
      }
    );

    if (!tokenResponse.ok) {
      throw new Error("No se pudo obtener el token");
    }

    const tokenData = await tokenResponse.json();
    const token = tokenData.token; // Asegúrate de que el token esté en esta propiedad

    // 2. Autenticar al usuario con el token
    const authResponse = await fetch(
      process.env.URL_API_AUTH_LOGIN,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email, password }),
      }
    );

    const response = await authResponse.json();

    if (!authResponse.ok) {
      return res.render("login", {
        title: "Login",
        error: "Correo o contraseña incorrectos",
      });
    }

    // Codificación en Base64 para mayor seguridad
    //const encodedUserId = Buffer.from(user.id.toString()).toString("base64");
    // Guardado de la sesión
    req.session.user = {
      id: response.user.id,
      nombre: response.user.nombre,
      apellido: response.user.apellido,
      departamento: response.user.departamento,
      correo: response.user.correo,
      activo: response.user.activo,
      sistemas: response.user.sistemas,
      roles: response.user.roles,
    };

    console.log("SESION DE:", req.session.user);

    res.redirect("/dashboard");
  } catch (error) {
    if (error.message === "El usuario no está activado.") {
      return res.render("login", { title: "Login", error: error.message });
    }

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
