# Tareas — Spec 021: Separar Compra de Poleras y Estampado DTF en 2 Facturas para 2 Proveedores Distintos

- [x] T0: Respaldo previo de datos y código (archivo en `backups/backup_pre_separar_compras_poleras_dtf_20261109.json` y tag `backup-pre-separar-compras-poleras-dtf-20261109`).
- [x] T1: Implementar funciones de clasificación y separación en `assets/js/production.js`:
  - `clasificarItemCompra(item, inventario)`
  - `esCompraMixta(items, inventario)`
  - `separarItemsCompra(items, inventario)`
  - `resolverProveedorParaCategoria(categoria, proveedores)`
- [x] T2: Implementar método `separarCompraEnDos(compraOriginalId, datosPoleras, datosDtf)` en `assets/js/storage.js` con cuadratura de stock garantizada.
- [x] T3: Añadir elementos visuales en `index.html`:
  - Banner `#purchase-split-banner` con botón `#btn-split-purchase` dentro de `#dialog-purchase`.
  - Diálogo modal nativo `<dialog id="dialog-split-purchase">` con formulario de 2 facturas y 2 proveedores.
- [x] T4: Implementar controladores y renderizado en `assets/js/ui.js`:
  - Detección de compra mixta en `editarCompra` y render de tabla de compra.
  - Botón `[✂️]` en tabla de compras `#view-purchases`.
  - `abrirModalSepararCompra(purchaseIdOItems)` con pre-llenado de proveedores y cálculo de totales.
  - `confirmarSeparacionCompra()` con persistencia, cierre de modales y recálculo de la aplicación.
- [x] T5: Crear suite de pruebas en `tests/split_purchases_poleras_dtf.test.js` y verificar que el 100% de tests del sistema continúen pasando.
- [x] T6: Actualizar `memory.md`, marcar especificación como implementada, comitear y pushear a GitHub (`main`).
