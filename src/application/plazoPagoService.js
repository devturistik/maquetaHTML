import PlazoPagoRepository from "../adapters/repository/plazoPagoRepository.js";

class PlazoPagoService {
  constructor() {
    this.plazoPagoRepository = new PlazoPagoRepository();
  }

  // Obtener todos los PlazoPagos
  async obtenerTodosLosPlazoPagos() {
    return await this.plazoPagoRepository.getAll();
  }

  // Obtener un PlazoPago por su ID
  async obtenerPlazoPagoPorId(id_forma_pago) {
    return await this.plazoPagoRepository.getById(id_forma_pago);
  }

  // Crear un nuevo PlazoPago
  async crearPlazoPago(datos) {
    return await this.plazoPagoRepository.create(datos);
  }

  // Actualizar un PlazoPago existente
  async actualizarPlazoPago(id_forma_pago, datos) {
    return await this.plazoPagoRepository.update(id_forma_pago, datos);
  }

  // Actualizar el estatus de un PlazoPago (0 o 1)
  async actualizarEstatus(id_forma_pago, estatus_forma_pago) {
    return await this.plazoPagoRepository.actualizarEstatus(
      id_forma_pago,
      estatus_forma_pago
    );
  }
}

export default PlazoPagoService;
