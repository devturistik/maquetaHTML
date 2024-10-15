// src/middleware/auth.js
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.user) {
    // Redirigir al login si no hay sesión
    return res.redirect("/login");
  }
  next();
};

export default requireAuth;
