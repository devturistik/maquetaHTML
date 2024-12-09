import express from "express";
import AdministracionController from "../controllers/administracionController.js";
import BancoController from "../controllers/bancoController.js";
import CentroCostoController from "../controllers/centroCostoController.js";
import CuentaController from "../controllers/cuentaController.js";
import EmpresaController from "../controllers/empresaController.js";
import MonedaController from "../controllers/monedaController.js";
import PlazoPagoController from "../controllers/plazoPagoController.js";
import ProductoController from "../controllers/productoController.js";
import ProveedorController from "../controllers/proveedorController.js";
import ProveedorBancoController from "../controllers/proveedorBancoController.js";
import TipoOrdenController from "../controllers/tipoOrdenController.js";

const router = express.Router();
const administracionController = new AdministracionController();
const bancoController = new BancoController();
const centroCostoController = new CentroCostoController();
const cuentaController = new CuentaController();
const empresaController = new EmpresaController();
const monedaController = new MonedaController();
const plazoPagoController = new PlazoPagoController();
const productoController = new ProductoController();
const proveedorController = new ProveedorController();
const proveedorBancoController = new ProveedorBancoController();
const tipoOrdenController = new TipoOrdenController();

// Ruta principal de administración
router.get("/administracion", administracionController.renderTables);

// Rutas específicas para Banco
router.get("/administracion/bancos", bancoController.listarBancos);
router.get(
  "/administracion/bancos/nuevo",
  bancoController.mostrarFormularioCrear
);
router.post("/administracion/bancos", bancoController.crearBanco);
router.get(
  "/administracion/bancos/:id/editar",
  bancoController.mostrarFormularioEditar
);
router.post("/administracion/bancos/:id", bancoController.actualizarBanco);
router.post("/administracion/bancos/:id/activar", bancoController.activarBanco);
router.post(
  "/administracion/bancos/:id/desactivar",
  bancoController.desactivarBanco
);

// Rutas específicas para CentroCosto
router.get(
  "/administracion/centrocostos",
  centroCostoController.listarCentroCostos
);
router.get(
  "/administracion/centrocostos/nuevo",
  centroCostoController.mostrarFormularioCrear
);
router.post(
  "/administracion/centrocostos",
  centroCostoController.crearCentroCosto
);
router.get(
  "/administracion/centrocostos/:id/editar",
  centroCostoController.mostrarFormularioEditar
);
router.post(
  "/administracion/centrocostos/:id",
  centroCostoController.actualizarCentroCosto
);
router.post(
  "/administracion/centrocostos/:id/activar",
  centroCostoController.activarCentroCosto
);
router.post(
  "/administracion/centrocostos/:id/desactivar",
  centroCostoController.desactivarCentroCosto
);

// Rutas específicas para Cuentas
router.get("/administracion/cuentas", cuentaController.listarCuentas);
router.get(
  "/administracion/cuentas/nuevo",
  cuentaController.mostrarFormularioCrear
);
router.post("/administracion/cuentas", cuentaController.crearCuenta);
router.get(
  "/administracion/cuentas/:id/editar",
  cuentaController.mostrarFormularioEditar
);
router.post("/administracion/cuentas/:id", cuentaController.actualizarCuenta);

// Rutas específicas para Empresa
router.get("/administracion/empresa", empresaController.listarEmpresas);
router.get(
  "/administracion/empresa/nuevo",
  empresaController.mostrarFormularioCrear
);
router.post("/administracion/empresa", empresaController.crearEmpresa);
router.get(
  "/administracion/empresa/:id/editar",
  empresaController.mostrarFormularioEditar
);
router.post("/administracion/empresa/:id", empresaController.actualizarEmpresa);
router.post(
  "/administracion/empresa/:id/activar",
  empresaController.activarEmpresa
);
router.post(
  "/administracion/empresa/:id/desactivar",
  empresaController.desactivarEmpresa
);

// Rutas específicas para Monedas
router.get("/administracion/monedas", monedaController.listarMonedas);
router.get(
  "/administracion/monedas/nuevo",
  monedaController.mostrarFormularioCrear
);
router.post("/administracion/monedas", monedaController.crearMoneda);
router.get(
  "/administracion/monedas/:id/editar",
  monedaController.mostrarFormularioEditar
);
router.post("/administracion/monedas/:id", monedaController.actualizarMoneda);

// Rutas específicas para PlazoPago
router.get("/administracion/plazopago", plazoPagoController.listarPlazoPagos);
router.get(
  "/administracion/plazopago/nuevo",
  plazoPagoController.mostrarFormularioCrear
);
router.post("/administracion/plazopago", plazoPagoController.crearPlazoPago);
router.get(
  "/administracion/plazopago/:id/editar",
  plazoPagoController.mostrarFormularioEditar
);
router.post(
  "/administracion/plazopago/:id",
  plazoPagoController.actualizarPlazoPago
);
router.post(
  "/administracion/plazopago/:id/activar",
  plazoPagoController.activarPlazoPago
);
router.post(
  "/administracion/plazopago/:id/desactivar",
  plazoPagoController.desactivarPlazoPago
);

// Rutas específicas para Producto
router.get("/administracion/producto", productoController.listarProductos);
router.get(
  "/administracion/producto/nuevo",
  productoController.mostrarFormularioCrear
);
router.post("/administracion/producto", productoController.crearProducto);
router.get(
  "/administracion/producto/:id/editar",
  productoController.mostrarFormularioEditar
);
router.post(
  "/administracion/producto/:id",
  productoController.actualizarProducto
);
router.post(
  "/administracion/producto/:id/activar",
  productoController.activarProducto
);
router.post(
  "/administracion/producto/:id/desactivar",
  productoController.desactivarProducto
);

// Rutas específicas para Proveedor
router.get("/administracion/proveedor", proveedorController.listarProveedores);
router.get(
  "/administracion/proveedor/nuevo",
  proveedorController.mostrarFormularioCrear
);
router.post("/administracion/proveedor", proveedorController.crearProveedor);
router.get(
  "/administracion/proveedor/:id/editar",
  proveedorController.mostrarFormularioEditar
);
router.post(
  "/administracion/proveedor/:id",
  proveedorController.actualizarProveedor
);
router.post(
  "/administracion/proveedor/:id/activar",
  proveedorController.activarProveedor
);
router.post(
  "/administracion/proveedor/:id/desactivar",
  proveedorController.desactivarProveedor
);
router.post(
  "/administracion/proveedor/:id/eliminar",
  proveedorController.eliminarProveedor
);

// Rutas específicas para ProveedorBanco
router.get(
  "/administracion/proveedor/:id/asignarbanco",
  proveedorBancoController.mostrarFormularioAsignarBanco
);
router.post(
  "/administracion/proveedor/:id/asignarbanco",
  proveedorBancoController.asignarBanco
);
router.get(
  "/administracion/proveedor/:id/bancos",
  proveedorBancoController.listarBancosAsignados
);
router.get(
  "/administracion/proveedor/:id/bancos/:id_banco/editar",
  proveedorBancoController.mostrarFormularioEditarBancoAsignado
);
router.post(
  "/administracion/proveedor/:id/bancos/:id_banco/editar",
  proveedorBancoController.actualizarBancoAsignado
);
router.post(
  "/administracion/proveedor/:id/bancos/:id_banco/eliminar",
  proveedorBancoController.eliminarBancoAsignado
);

// Rutas específicas para TipoOrden
router.get("/administracion/tipoorden", tipoOrdenController.listarTiposOrden);
router.get(
  "/administracion/tipoorden/crear",
  tipoOrdenController.mostrarFormularioCrearTipoOrden
);
router.post(
  "/administracion/tipoorden/crear",
  tipoOrdenController.crearTipoOrden
);
router.get(
  "/administracion/tipoorden/:id/detalles",
  tipoOrdenController.listarDetallesPorTipoOrden
);
router.get("/administracion/tipoorden/:id/editar", tipoOrdenController.mostrarFormularioEditarTipoOrden);
router.post("/administracion/tipoorden/:id/editar", tipoOrdenController.actualizarTipoOrden);


export default router;
