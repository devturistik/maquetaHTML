import ProveedorRepository from "../adapters/repository/proveedorRepository.js";

class ProveedorService {
  constructor() {
    this.proveedorRepository = new ProveedorRepository();
  }

  // Obtener todos los Proveedores (no eliminados)
  async obtenerTodosLosProveedores() {
    return await this.proveedorRepository.getAll();
  }

  // Obtener un Proveedor por su ID
  async obtenerProveedorPorId(id_proveedor) {
    return await this.proveedorRepository.getById(id_proveedor);
  }

  // Crear un nuevo Proveedor
  async crearProveedor(datos) {
    return await this.proveedorRepository.create(datos);
  }

  // Actualizar un Proveedor existente
  async actualizarProveedor(id_proveedor, datos) {
    return await this.proveedorRepository.update(id_proveedor, datos);
  }

  // Actualizar el estatus de un Proveedor (Activo/Inactivo)
  async actualizarEstatus(id_proveedor, estatus_proveedor) {
    return await this.proveedorRepository.actualizarEstatus(
      id_proveedor,
      estatus_proveedor
    );
  }

  // Eliminar (soft delete) un Proveedor
  async eliminarProveedor(id_proveedor) {
    return await this.proveedorRepository.eliminar(id_proveedor);
  }
}

export default ProveedorService;
