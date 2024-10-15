// src/application/userService.js
import bcrypt from "bcrypt";
import UserRepository from "../adapters/repository/userRepository.js";

class UserService {
  constructor() {
    this.userRepository = new UserRepository();
  }

  async getAllUsers() {
    return await this.userRepository.getAllUsers();
  }

  async getUserById(decodedId) {
    return await this.userRepository.getUserById(decodedId);
  }

  async createUser(userData) {
    // Hash de la clave del usuario
    const hashedClave = await bcrypt.hash(userData.clave, 10);

    // Reemplaza la clave sin hash por la clave hasheada
    const nuevoUsuario = { ...userData, clave: hashedClave };

    // Llama al repositorio para almacenar el usuario en la base de datos
    return await this.userRepository.createUser(nuevoUsuario);
  }

  async updateUser(decodedId, newUserData) {
    // Hash de la clave del usuario
    if (newUserData.clave) {
      const hashedClave = await bcrypt.hash(newUserData.clave, 10);
      // Reemplaza la clave sin hash por la clave hasheada
      const newUserData = { ...newUserData, clave: hashedClave };
    }

    return await this.userRepository.updateUser(decodedId, newUserData);
  }

  async deleteUser(decodedId) {
    return await this.userRepository.deleteUser(decodedId);
  }
}

export default new UserService();
