import CuentaRepository from "../adapters/repository/cuentaRepository.js";

class CuentaService {
  constructor() {
    this.cuentaRepository = new CuentaRepository();
  }

  // Obtener todas las Cuentas
  async obtenerTodasLasCuentas() {
    return await this.cuentaRepository.getAll();
  }

  // Obtener una Cuenta por su ID
  async obtenerCuentaPorId(id) {
    return await this.cuentaRepository.getById(id);
  }

  // Crear una nueva Cuenta
  async crearCuenta(datos) {
    return await this.cuentaRepository.create(datos);
  }

  // Actualizar una Cuenta existente
  async actualizarCuenta(id, datos) {
    return await this.cuentaRepository.update(id, datos);
  }
}

export default CuentaService;
