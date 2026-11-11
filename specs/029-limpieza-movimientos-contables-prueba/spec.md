# Spec 029 — Depuración y Limpieza de Movimientos Contables de Prueba

## 1. Contexto y Problema
El usuario solicitó: *"Borrar todos los movimientos contables generados para las pruebas del sistema. Solamente preservar los que se generan por la operacion normales de compra y venta de poleras. Preservar tambien los movimientos contables del usuario. Usar metodologia sdd para su desarrollo."*

Durante las fases de desarrollo y verificación de las funcionalidades contables (Módulo de Contabilidad Spec 018, Asientos de Pedidos Spec 019, Transferencias Spec 023, Reflejo de Movimientos Spec 024 y Filtros Spec 025/028), se generaron diversos registros manuales y de muestra (transferencias de ensayo, gastos ficticios de prueba, pedidos/compras de test o demo) que pueblan el Libro Diario de Movimientos.

El usuario necesita una depuración limpia y controlada que:
1. **Elimine todos los movimientos de prueba:** Gastos, transferencias, pedidos y compras creados para verificar el sistema (identificados por patrones como `"prueba"`, `"test"`, `"demo"`, `"ensayo"`, `"ORD-TEST"`, `"CMP-TEST"`, `"TRF-TEST"`, `"EXP-TEST"`, o correlativos iniciales de demostración como `NP-20261101-001` y `CMP-20261028-001`).
2. **Preserve estrictamente las operaciones normales de compra y venta de poleras:** Todos los pedidos legítimos de clientes (poleras, polerones, buzos, gorras) y compras reales a proveedores deben permanecer intactos y seguir generando sus asientos contables automáticos (Abono Banco, Saldo Cuentas por Cobrar, Costo de Insumos, IVA).
3. **Preserve estrictamente los movimientos contables del usuario:** Gastos operacionales y transferencias legítimas registradas por el usuario para su taller (que no sean de prueba) se mantienen 100% intactas.
4. **Preserve íntegramente el Plan de Cuentas y Configuración:** En conformidad con la Spec 027, el catálogo contable (`novaprint_accounts`), clientes reales, catálogo de insumos y configuración de empresa jamás deben ser vaciados ni alterados.

## 2. Requerimientos
- **REQ-01: Método de Depuración en Persistencia (`storage.js`):**
  - Implementar la función `purgarMovimientosPrueba()` en `assets/js/storage.js`.
  - Debe evaluar los registros existentes en `novaprint_expenses`, `novaprint_transfers`, `novaprint_orders` y `novaprint_purchases`.
  - Identificar como registros de prueba aquellos que cumplan con criterios deterministas:
    - IDs con prefijos o sufijos `TEST`, `DEMO`, o coincidentes con compras/pedidos de plantilla de prueba iniciales (`NP-20261101-001`, `CMP-20261028-001`).
    - Descripciones, glosas, notas o referencias que contengan `"prueba"`, `"test"`, `"demo"`, `"ensayo"`, `"movimiento de prueba"`, `"gasto de prueba"`, `"traspaso de prueba"`.
    - Nombres de cliente o proveedor con `"prueba"`, `"test"`, `"demo"`, o coincidente con el cliente demo de muestra inicial (`Club Deportivo Leones`).
  - Filtrar y remover exclusivamente dichos registros de sus respectivas colecciones.
  - Preservar íntegramente todas las operaciones comerciales reales del taller (ventas y compras de poleras e insumos) y los movimientos reales del usuario.
  - Retornar un resumen con el total de movimientos eliminados y preservados por entidad.
- **REQ-02: Interfaz de Depuración en Libro Diario (`index.html` & `ui.js`):**
  - En `#acc-subview-journal`, incorporar el botón `[🧹 Limpiar Pruebas]` (`#btn-journal-clean-tests`).
  - Al pulsarlo, desplegar un diálogo interactivo `<dialog id="dialog-clean-tests">` que detalle el diagnóstico de movimientos detectados como prueba y garantice que las compras y ventas de poleras del taller se preservarán.
  - Al confirmar, ejecutar `storage.purgarMovimientosPrueba()`, notificar con toast amigable y refrescar reactivamente el Libro Diario y los balances contables.
- **REQ-03: Limpieza Segura de Plantilla de Demostración al Iniciar (`main.js`):**
  - En la inicialización de la app (`init()`), depurar de forma transparente únicamente los registros de plantilla demo inicial (`NP-20261101-001` y `CMP-20261028-001`) si aún existieran en el almacenamiento local del navegador, sin riesgo de afectar ningún dato propio.

## 3. Criterios de Aceptación
1. Invocación de `storage.purgarMovimientosPrueba()` elimina todos los gastos, transferencias, compras y pedidos con marcadores de prueba.
2. Los pedidos reales de clientes y compras reales de insumos/poleras permanecen intactos y sus asientos contables siguen activos en el Libro Diario.
3. Los gastos operacionales reales y transferencias legítimas del usuario permanecen intactos.
4. El Plan de Cuentas (`novaprint_accounts`) no sufre ninguna alteración ni pérdida de cuentas personalizadas.
5. El botón `[🧹 Limpiar Pruebas]` en el Libro Diario permite al usuario ejecutar la limpieza de forma accesible y transparente.
6. 100% de la suite de pruebas unitarias y de integración se ejecuta exitosamente.

