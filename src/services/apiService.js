// src/services/apiService.js
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

class ApiService {
  constructor() {
    this.token = null;
    this.tokenExpiry = null;
  }

  /**
   * Obtiene un token de autenticación, reutilizando el existente si aún es válido.
   * @returns {Promise<string>} - Token de autenticación.
   */
  async getToken() {
    const now = Date.now();
    if (this.token && this.tokenExpiry && now < this.tokenExpiry) {
      return this.token;
    }

    const response = await fetch(process.env.URL_API_AUTH_TOKEN, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: process.env.API_USERNAME,
        password: process.env.API_PASSWORD,
        scope: "OC",
      }),
    });

    if (!response.ok) {
      throw new Error("No se pudo obtener el token de autenticación.");
    }

    const data = await response.json();
    this.token = data.token;
    this.tokenExpiry = now + 60 * 60 * 1000;
    return this.token;
  }

  /**
   * Envía una solicitud de aprobación a la API externa.
   * @param {string} codigoOC - Código de la orden de compra.
   * @param {string} apiUsername - Nombre de usuario para la API.
   * @returns {Promise<void>}
   */
  async enviarAprobacionAPI(codigoOC, apiUsername) {
    try {
      const token = await this.getToken();

      const approvalResponse = await fetch(process.env.URL_API_APROBADORES, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          codigo: codigoOC,
          sistema: apiUsername,
        }),
      });

      if (!approvalResponse.ok) {
        throw new Error("No se pudo enviar la solicitud de aprobación.");
      }
    } catch (error) {
      console.error("Error en enviarAprobacionAPI:", error.message);
      throw error;
    }
  }
}

const apiService = new ApiService();
export default apiService;
