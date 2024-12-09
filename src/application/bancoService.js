import BancoRepository from "../adapters/repository/bancoRepository.js";

class BancoService {
  constructor() {
    this.bancoRepository = new BancoRepository();
  }

  // Obtener todos los Bancos activos
  async obtenerTodosLosBancos() {
    return await this.bancoRepository.getAll();
  }

  async obtenerTodosLosBancosActivos() {
    return await this.bancoRepository.obtenerTodosLosBancosActivos();
  }

  // Obtener Bancos por estatus
  async obtenerBancosPorEstatus(estatus) {
    return await this.bancoRepository.getByEstatus(estatus);
  }

  // Obtener un Banco por su ID
  async obtenerBancoPorId(id) {
    return await this.bancoRepository.getById(id);
  }

  // Crear un nuevo Banco
  async crearBanco(datos) {
    return await this.bancoRepository.create(datos);
  }

  // Actualizar un Banco existente
  async actualizarBanco(id, datos) {
    return await this.bancoRepository.update(id, datos);
  }

  // Actualizar el estatus de un Banco
  async actualizarEstatus(id, estatus) {
    return await this.bancoRepository.actualizarEstatus(id, estatus);
  }
}

export default BancoService;
