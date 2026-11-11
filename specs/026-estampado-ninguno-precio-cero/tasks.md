# Tareas — Spec 026: Opción "Ninguno" en Campo Estampado con Precio $0 CLP

- [x] T0: Respaldo previo de datos y código (archivo `backups/backup_pre_estampado_ninguno_20261110.json` y tag git `backup-pre-estampado-ninguno-20261110`).
- [x] T1: Añadir `NINGUNO` en `OPCIONES_ESTAMPADO` y actualizar `normalizarOpcionEstampado` y `calcularFaltantesPedido` en `assets/js/production.js`.
- [x] T2: Actualizar `calcularPrecioSugeridoPrenda` en `assets/js/sales.js` para asignar costo $0 cuando el estampado sea "Ninguno".
- [x] T3: Actualizar `asegurarItemInventarioEstampado` en `assets/js/storage.js` para manejar la opción "Ninguno".
- [x] T4: Actualizar `normalizarUbicacionEstampado` y el selector de prendas en `renderTablaItemsFormulario` en `assets/js/ui.js` incorporando `<option value="Ninguno">Ninguno ($0)</option>`.
- [x] T5: Crear suite de pruebas en `tests/print_option_none.test.js` y verificar que el 100% de tests continúe en verde.
- [x] T6: Actualizar `memory.md`, marcar tareas como completadas, comitear y pushear a GitHub (`main`).
