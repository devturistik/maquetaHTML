// src/application/administracionService.js
import AdministracionRepository from "../adapters/repository/administracionRepository.js";

class AdministracionService {
  constructor() {
    this.administracionRepository = new AdministracionRepository();
  }
}

export default AdministracionService;
