# Tareas — Spec 029: Depuración y Limpieza de Movimientos Contables de Prueba

- [x] **Tarea 1 — Respaldo previo de seguridad**
  - [x] Generar JSON en `backups/backup_pre_limpieza_movimientos_prueba_20261110.json`
  - [x] Crear y pushear tag `backup-pre-limpieza-movimientos-prueba-20261110`

- [x] **Tarea 2 — Especificación SDD**
  - [x] Crear `specs/029-limpieza-movimientos-contables-prueba/spec.md`
  - [x] Crear `specs/029-limpieza-movimientos-contables-prueba/plan.md`
  - [x] Crear `specs/029-limpieza-movimientos-contables-prueba/tasks.md`

- [x] **Tarea 3 — Implementación en persistencia (`assets/js/storage.js`)**
  - [x] Implementar `esRegistroDePrueba` y `purgarMovimientosPrueba`
  - [x] Preservar pedidos y compras de poleras reales, movimientos del usuario y Plan de Cuentas
  - [x] Exponer `purgarMovimientosPrueba` en `NovaprintStorage`

- [x] **Tarea 4 — Interfaz de usuario (`index.html` & `assets/js/ui.js`)**
  - [x] Agregar botón `#btn-journal-clean-tests` en barra de filtros del Libro Diario
  - [x] Agregar diálogo modal `<dialog id="dialog-clean-tests">`
  - [x] Implementar `abrirModalLimpiarPruebas` y `confirmarLimpiarPruebas` en `assets/js/ui.js`

- [x] **Tarea 5 — Depuración transparente al iniciar (`assets/js/main.js`)**
  - [x] Incorporar llamada segura a `storage.purgarMovimientosPrueba({ silencioso: true })` en `init()`

- [x] **Tarea 6 — Pruebas automatizadas**
  - [x] Crear suite `tests/clean_test_movements.test.js`
  - [x] Ejecutar `node --test tests/*.test.js` y verificar 100% aprobado (256/256 tests passing)

- [x] **Tarea 7 — Documentación y cierre**
  - [x] Actualizar `memory.md`
  - [x] Git commit y push a `main`
