import EmpresaRepository from "../adapters/repository/empresaRepository.js";

class EmpresaService {
  constructor() {
    this.empresaRepository = new EmpresaRepository();
  }

  // Obtener todas las Empresas que no están eliminadas
  async obtenerTodasLasEmpresas() {
    return await this.empresaRepository.getAll();
  }

  // Obtener Empresas por estatus (Activo/Inactivo) que no están eliminadas
  async obtenerEmpresasPorEstatus(estatus_empresa) {
    return await this.empresaRepository.getByEstatus(estatus_empresa);
  }

  // Obtener una Empresa por su ID, si no está eliminada
  async obtenerEmpresaPorId(id_empresa) {
    return await this.empresaRepository.getById(id_empresa);
  }

  // Crear una nueva Empresa
  async crearEmpresa(datos) {
    return await this.empresaRepository.create(datos);
  }

  // Actualizar una Empresa existente
  async actualizarEmpresa(id_empresa, datos) {
    return await this.empresaRepository.update(id_empresa, datos);
  }

  // Actualizar el estatus de una Empresa (Activo/Inactivo)
  async actualizarEstatus(id_empresa, estatus_empresa) {
    return await this.empresaRepository.actualizarEstatus(
      id_empresa,
      estatus_empresa
    );
  }

  // (Opcional) Eliminar lógicamente una Empresa
  async eliminarEmpresa(id_empresa) {
    return await this.empresaRepository.softDelete(id_empresa);
  }
}

export default EmpresaService;
