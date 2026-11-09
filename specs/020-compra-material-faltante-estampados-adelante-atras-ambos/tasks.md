# Tareas — Spec 020: Compra de Estampados en Material Faltante

- [x] T0: Respaldo previo de datos y código (archivo en `backups/backup_pre_compra_estampados_20261109.json` y tag `backup-pre-compra-estampados-20261109`).
- [x] T1: Definir `OPCIONES_ESTAMPADO`, `normalizarOpcionEstampado` y `obtenerCostoCompraEstampado` en `assets/js/production.js`.
- [x] T2: Extender `calcularFaltantesPedido` en `assets/js/production.js` para incluir la compra de estampados para cada unidad (`opciones.incluirEstampados`).
- [x] T3: Actualizar `calcularPrecioSugeridoPrenda` en `assets/js/sales.js` para precios sugeridos según Adelante, Atrás y Ambos.
- [x] T4: Implementar `asegurarItemInventarioEstampado` en `assets/js/storage.js` para auto-creación y enlace con bodega.
- [x] T5: Actualizar `#dialog-order` y `abrirModalCompraConFaltantes` en `assets/js/ui.js` para selector de estampado y carga en la orden de compra.
- [x] T6: Crear suite de pruebas en `tests/print_purchases_faltantes.test.js` y verificar 100% de tests globales pasando.
- [x] T7: Actualizar `memory.md`, marcar especificación como implementada, realizar commit y push a GitHub (`main`).
