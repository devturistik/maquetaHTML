import ProveedorBancoRepository from "../adapters/repository/proveedorBancoRepository.js";

class ProveedorBancoService {
  constructor() {
    this.proveedorBancoRepository = new ProveedorBancoRepository();
  }

  // Asignar un banco a un proveedor
  async asignarBancoAProveedor(proveedorId, datos) {
    return await this.proveedorBancoRepository.create(proveedorId, datos);
  }

  // Obtener todos los bancos asignados a un proveedor
  async obtenerBancosAsignados(proveedorId) {
    return await this.proveedorBancoRepository.getAllByProveedorId(proveedorId);
  }

  // Obtener una asignación específica
  async obtenerBancoAsignadoPorId(proveedorId, bancoAsignadoId) {
    return await this.proveedorBancoRepository.getById(
      proveedorId,
      bancoAsignadoId
    );
  }

  // Actualizar una asignación de banco a proveedor
  async actualizarBancoAsignado(proveedorId, bancoAsignadoId, datos) {
    return await this.proveedorBancoRepository.update(
      proveedorId,
      bancoAsignadoId,
      datos
    );
  }

  // Eliminar una asignación de banco a proveedor
  async eliminarBancoAsignado(proveedorId, bancoAsignadoId) {
    return await this.proveedorBancoRepository.delete(
      proveedorId,
      bancoAsignadoId
    );
  }
}

export default ProveedorBancoService;
