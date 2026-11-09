# Plan de Implementación — Spec 017: Opción para Modificar el Stock de Inventarios

## 1. Alcance
- Incorporar método `updateInventoryStock(itemId, newStock, options)` en `assets/js/storage.js`.
- Incorporar diálogo modal `<dialog id="dialog-adjust-stock">` en `index.html`.
- Incorporar funciones de apertura, cálculo de variación y guardado en `assets/js/ui.js` (`abrirModalModificarStock`, `aplicarAjusteStockDelta`, `guardarModificacionStock`) y botones interactivos en `renderInventoryTable`.
- Vincular el envío del formulario `#form-adjust-stock` en `assets/js/main.js`.
- Crear suite de pruebas unitarias en `tests/inventory_stock_adjustment.test.js`.
- Actualizar `memory.md`, marcar especificación como implementada y sincronizar con GitHub (`main`).

## 2. Componentes Afectados
1. `assets/js/storage.js`:
   - Función `updateInventoryStock(itemId, newStock, options)`.
   - Exponer en `NovaprintStorage`.
2. `index.html`:
   - Diálogo modal nativo `<dialog id="dialog-adjust-stock">`.
3. `assets/js/ui.js`:
   - Botón `[📦]` y enlace en celda de stock en `renderInventoryTable`.
   - `abrirModalModificarStock(itemId)`.
   - `aplicarAjusteStockDelta(delta)`.
   - `guardarModificacionStock()`.
   - Exponer en `NovaprintUI`.
4. `assets/js/main.js`:
   - Listener de submit en `#form-adjust-stock` previniendo default y llamando a `NovaprintUI.guardarModificacionStock()`.
5. `tests/inventory_stock_adjustment.test.js`:
   - Pruebas unitarias de la lógica de actualización, límites ($\ge 0$), renderizado de botones y llamadas al diálogo.

## 3. Riesgos y Mitigaciones
- **Riesgo:** Conflicto con los cálculos de disponibilidad de prendas en pedidos (`verificarDisponibilidadPrenda`).
- **Mitigación:** Al actualizar el stock mediante `updateInventoryStock`, `NovaprintMain.refrescarDatos()` refresca automáticamente la tabla de inventario, métricas de inventario y badges de pedidos en tiempo real.

