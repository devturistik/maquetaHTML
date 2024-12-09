import TipoOrdenRepository from "../adapters/repository/tipoOrdenRepository.js";

class TipoOrdenService {
  constructor() {
    this.tipoOrdenRepository = new TipoOrdenRepository();
    this.validDetalleNombres = ["Impuesto", "Propina", "Retencion"];
    this.validTiposDetalle = ["%", "fijo"];
  }

  // Validar detalle antes de crear
  validarDetalle(detalle) {
    if (!this.validDetalleNombres.includes(detalle.nombre_detalle)) {
      throw new Error(
        "El nombre del detalle debe ser Impuesto, Propina o Retencion."
      );
    }
    if (!this.validTiposDetalle.includes(detalle.tipo_detalle)) {
      throw new Error("El tipo de detalle debe ser '%' o 'fijo'.");
    }
    if (
      detalle.tipo_detalle === "%" &&
      (detalle.cantidad < 1 || detalle.cantidad > 100)
    ) {
      throw new Error("La cantidad debe estar entre 1 y 100 para el tipo '%'.");
    }
    if (detalle.tipo_detalle === "fijo" && detalle.cantidad < 0) {
      throw new Error(
        "La cantidad debe ser un número positivo para el tipo 'fijo'."
      );
    }
  }

  async crearTipoOrdenConDetalles(datosTipoOrden, detalles) {
    const id_tipo = await this.tipoOrdenRepository.crearTipoOrden(
      datosTipoOrden
    );

    for (const detalle of detalles) {
      this.validarDetalle(detalle);
      await this.tipoOrdenRepository.crearDetalleTipoOrden(id_tipo, detalle);
    }

    return id_tipo;
  }

  async obtenerTiposOrden() {
    return await this.tipoOrdenRepository.obtenerTiposOrden();
  }

  async obtenerDetallesPorTipoOrden(id_tipo) {
    return await this.tipoOrdenRepository.obtenerDetallesPorTipoOrden(id_tipo);
  }

  async obtenerTipoOrdenPorId(id) {
    return await this.tipoOrdenRepository.obtenerPorId(id);
  }

  async obtenerDetallesPorTipoOrden(id) {
    return await this.tipoOrdenRepository.obtenerDetallesPorTipoOrden(id);
  }

  async actualizarTipoOrden(id, datos, detalles) {
    await this.tipoOrdenRepository.actualizarTipoOrden(id, datos);
    await this.tipoOrdenRepository.actualizarDetallesTipoOrden(id, detalles);
  }
}

export default TipoOrdenService;
