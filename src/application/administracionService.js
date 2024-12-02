// src/application/administracionService.js
import AdministracionRepository from "../adapters/repository/administracionRepository.js";

class AdministracionService {
  constructor() {
    this.administracionRepository = new AdministracionRepository();
    this.tablasPermitidas = this.administracionRepository.tablasPermitidas;
  }

  getTables() {
    return this.administracionRepository.getTablesFromDB();
  }

  obtenerMetadatos(tabla) {
    return this.administracionRepository.obtenerMetadatos(tabla);
  }

  obtenerRegistros(tabla) {
    return this.administracionRepository.obtenerRegistros(tabla);
  }

  crearRegistro(tabla, datos) {
    return this.administracionRepository.crearRegistro(tabla, datos);
  }

  obtenerRegistroPorId(tabla, id) {
    return this.administracionRepository.obtenerRegistroPorId(tabla, id);
  }

  actualizarRegistro(tabla, id, datos, nombreUsuario) {
    return this.administracionRepository.actualizarRegistro(tabla, id, datos);
  }

  eliminarLogico(tabla, id, columna, valor, nombreUsuario) {
    return this.administracionRepository.eliminarLogico(
      tabla,
      id,
      columna,
      valor
    );
  }

  eliminarFisico(tabla, id, nombreUsuario) {
    return this.administracionRepository.eliminarFisico(tabla, id);
  }

  obtenerProveedores() {
    return this.administracionRepository.obtenerProveedores();
  }

  obtenerBancos() {
    return this.administracionRepository.obtenerBancos();
  }

  obtenerTiposOrden() {
    return this.administracionRepository.obtenerTiposOrden();
  }

  establecerRelacionTipoOrden(idTipoOrden, data, nombreUsuario) {
    return this.administracionRepository.establecerRelacionTipoOrden(
      idTipoOrden,
      data
    );
  }

  establecerRelacionProveedorBanco(idProveedor, idBanco, data, nombreUsuario) {
    return this.administracionRepository.establecerRelacionProveedorBanco(
      idProveedor,
      idBanco,
      data
    );
  }

  obtenerDetallesTipoOrden() {
    return this.administracionRepository.obtenerDetallesTipoOrden();
  }

  obtenerGerentes() {
    return this.administracionRepository.obtenerGerentes();
  }
}

export default AdministracionService;
