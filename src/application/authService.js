// src/application/authService.js
import AuthRepository from "../adapters/repository/authRepository.js";
import bcrypt from "bcrypt";

const authRepository = new AuthRepository();

const authService = {
  login: async (email, password) => {
    const user = await authRepository.getUserByEmail(email);
    if (!user) {
      return null;
    }

    // Verificar que el usuario esté activo
    if (!user.activo) {
      throw new Error("El usuario no está activado.");
    }

    // Validar la contraseña
    const isPasswordValid = await bcrypt.compare(password, user.clave);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  },
};

export default authService;
