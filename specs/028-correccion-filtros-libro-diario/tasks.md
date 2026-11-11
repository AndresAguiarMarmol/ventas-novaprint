# Tareas — Spec 028: Corrección y Optimización de Filtros en Libro Diario

- [x] **Tarea 1 — Respaldo previo de seguridad**
  - [x] Generar JSON en `backups/backup_pre_correccion_filtros_libro_diario_20261110.json`
  - [x] Crear y pushear tag `backup-pre-correccion-filtros-libro-diario-20261110`

- [x] **Tarea 2 — Especificación SDD**
  - [x] Crear `specs/028-correccion-filtros-libro-diario/spec.md`
  - [x] Crear `specs/028-correccion-filtros-libro-diario/plan.md`
  - [x] Crear `specs/028-correccion-filtros-libro-diario/tasks.md`

- [x] **Tarea 3 — Corrección del motor contable (`assets/js/accounting.js`)**
  - [x] Mejorar `asientoAfectaCuenta` con soporte completo de categorías de gastos 5201-5206, IVA 1104/2102, Delivery 4103 e Inventario 1103
  - [x] Implementar extractor resiliente de año-mes en `filtrarAsientosContables` (`normalizarMesTransaccion`)

- [x] **Tarea 4 — Reactividad instantánea en UI (`assets/js/ui.js` e `index.html`)**
  - [x] Re-renderizado directo de `renderAccountingJournal` en `filtrarLibroDiario()`, `limpiarFiltroMesLibroDiario()` y `resetFiltrosLibroDiario()`
  - [x] Agregar `oninput="NovaprintUI.filtrarLibroDiario()"` a `#acc-journal-filter-month` en `index.html`
  - [x] Exponer `refrescarVistaLibroDiario` en `NovaprintUI`

- [x] **Tarea 5 — Pruebas automatizadas**
  - [x] Crear suite `tests/journal_filters_bugfix.test.js`
  - [x] Ejecutar `node --test tests/*.test.js` y verificar 100% aprobado (247 tests pasados)

- [x] **Tarea 6 — Documentación y cierre**
  - [x] Actualizar `memory.md`
  - [x] Git commit y push a `main`
