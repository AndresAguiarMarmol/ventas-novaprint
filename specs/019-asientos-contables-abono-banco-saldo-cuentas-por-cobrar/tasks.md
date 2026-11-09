# Tareas — Spec 019: Asientos Contables al Registrar Pedidos

- [x] T0: Respaldo previo de datos y código (archivo en `backups/backup_pre_asientos_pedidos_20261109.json` y tag `backup-pre-asientos-pedidos-20261109`).
- [x] T1: Implementar `generarAsientosPedido(pedido)` en `assets/js/accounting.js` para desglose de Abono a Banco y Saldo a Cuentas por Cobrar.
- [x] T2: Actualizar `generarLibroDiario` y `obtenerConsolidadoPedidos` en `assets/js/accounting.js` para consumir los asientos desglosados con cuadratura estricta.
- [x] T3: Actualizar `saveOrder` en `assets/js/storage.js` para asociar los asientos contables al pedido al momento de registrarse.
- [x] T4: Actualizar renderizado del Libro Diario en `assets/js/ui.js` para distinguir visualmente los asientos de Abono y Saldo por Cobrar.
- [x] T5: Crear suite de pruebas unitarias en `tests/order_accounting_entries.test.js` y verificar que el 100% de las pruebas globales pasen.
- [x] T6: Actualizar `memory.md`, marcar especificación como implementada, realizar commit y push a GitHub (`main`).
