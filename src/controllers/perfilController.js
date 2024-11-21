// src/controllers/perfilController.js

class PerfilController {
  mostrarPerfil(req, res) {
    try {
      const usuario = res.locals.user;

      if (!usuario) {
        return res.redirect("/login");
      }

      res.render("perfil/datos", { usuario });
    } catch (error) {
      console.error("Error al mostrar el perfil del usuario:", error);
      res.status(500).send("Error interno del servidor");
    }
  }
}

export default PerfilController;
