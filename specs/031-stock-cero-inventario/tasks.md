# Tareas — Spec 031: Colocar Saldo 0 en el Stock Actual de Todos los Elementos del Inventario

- [x] **Tarea 1 — Respaldo de seguridad previo**
  - [x] Generar JSON en `backups/backup_pre_stock_cero_inventario_20261111.json`
  - [x] Crear y pushear tag Git `backup-pre-stock-cero-inventario-20261111`

- [x] **Tarea 2 — Especificación SDD**
  - [x] Crear `specs/031-stock-cero-inventario/spec.md`
  - [x] Crear `specs/031-stock-cero-inventario/plan.md`
  - [x] Crear `specs/031-stock-cero-inventario/tasks.md`

- [x] **Tarea 3 — Implementación en persistencia (`assets/js/storage.js`)**
  - [x] Implementar `ponerStockCeroATodosLosItems()`
  - [x] Preservar intactos todos los metadatos de los artículos (código, nombre, categoría, costos, etc.)
  - [x] Registrar la auditoría de ajuste en `lastStockAdjustment`
  - [x] Exportar `ponerStockCeroATodosLosItems` en `NovaprintStorage` y `module.exports`

- [x] **Tarea 4 — Interfaz de usuario (`index.html` & `assets/js/ui.js`)**
  - [x] Agregar botón `#btn-reset-inventory-stock` en la cabecera de la vista Inventario (`#view-inventory`)
  - [x] Implementar función controladora `confirmarPonerStockCero()` en `assets/js/ui.js`
  - [x] Exportar `confirmarPonerStockCero` en `NovaprintUI`

- [x] **Tarea 5 — Orquestación en ciclo de vida (`assets/js/main.js`)**
  - [x] Asegurar que el inventario se sincronice con saldo cero en el arranque o acción de usuario

- [x] **Tarea 6 — Pruebas automatizadas**
  - [x] Crear suite de pruebas `tests/inventory_zero_stock.test.js`
  - [x] Ejecutar `node --test tests/*.test.js` y verificar 100% de pruebas aprobadas (267/267 tests passing)

- [x] **Tarea 7 — Documentación y cierre**
  - [x] Actualizar `memory.md` (Sección 1, 2 y 3)
  - [x] Actualizar `tasks.md`
  - [x] Commit y push a `main`
