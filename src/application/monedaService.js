import MonedaRepository from "../adapters/repository/monedaRepository.js";

class MonedaService {
  constructor() {
    this.monedaRepository = new MonedaRepository();
  }

  // Obtener todas las Monedas
  async obtenerTodasLasMonedas() {
    return await this.monedaRepository.getAll();
  }

  // Obtener una Moneda por su ID
  async obtenerMonedaPorId(id_moneda) {
    return await this.monedaRepository.getById(id_moneda);
  }

  // Crear una nueva Moneda
  async crearMoneda(datos) {
    return await this.monedaRepository.create(datos);
  }

  // Actualizar una Moneda existente
  async actualizarMoneda(id_moneda, datos) {
    return await this.monedaRepository.update(id_moneda, datos);
  }
}

export default MonedaService;
