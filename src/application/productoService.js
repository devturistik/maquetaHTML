import ProductoRepository from "../adapters/repository/productoRepository.js";

class ProductoService {
  constructor() {
    this.productoRepository = new ProductoRepository();
  }

  // Obtener todos los Productos
  async obtenerTodosLosProductos() {
    return await this.productoRepository.getAll();
  }

  // Obtener un Producto por su ID
  async obtenerProductoPorId(id_producto) {
    return await this.productoRepository.getById(id_producto);
  }

  // Crear un nuevo Producto
  async crearProducto(datos) {
    return await this.productoRepository.create(datos);
  }

  // Actualizar un Producto existente
  async actualizarProducto(id_producto, datos) {
    return await this.productoRepository.update(id_producto, datos);
  }

  // Actualizar el estatus de un Producto (0 o 1)
  async actualizarEstatus(id_producto, estatus_producto) {
    return await this.productoRepository.actualizarEstatus(
      id_producto,
      estatus_producto
    );
  }
}

export default ProductoService;
