// src/application/administracionService.js
import AdministracionRepository from "../adapters/repository/administracionRepository.js";

class AdministracionService {
  constructor() {
    this.administracionRepository = new AdministracionRepository();
    this.tablasPermitidas = [
      "Proveedor",
      "Banco",
      "PlazoPago",
      "Empresa",
      "CentroCosto",
      "TipoOrden",
      "Monedas",
      "Cuentas",
      "Producto",
    ];
  }

  async getTables() {
    const tablasBD = await this.administracionRepository.getTablesFromDB();

    const tablasFiltradas = tablasBD.filter((tabla) =>
      this.tablasPermitidas.includes(tabla.nombre)
    );

    tablasFiltradas.sort((a, b) => a.nombre.localeCompare(b.nombre));

    return tablasFiltradas;
  }

  async obtenerColumnas(tabla) {
    return await this.administracionRepository.obtenerColumnas(tabla);
  }

  async obtenerRegistros(tabla) {
    return await this.administracionRepository.obtenerRegistros(tabla);
  }

  async crearRegistro(tabla, datos) {
    return await this.administracionRepository.crearRegistro(tabla, datos);
  }

  async obtenerRegistroPorId(tabla, id) {
    return await this.administracionRepository.obtenerRegistroPorId(tabla, id);
  }

  async actualizarRegistro(tabla, id, datos) {
    return await this.administracionRepository.actualizarRegistro(
      tabla,
      id,
      datos
    );
  }

  async eliminarRegistro(tabla, id) {
    return await this.administracionRepository.eliminarRegistro(tabla, id);
  }
}

export default AdministracionService;
