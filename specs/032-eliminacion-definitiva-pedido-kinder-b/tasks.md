# Tareas — Spec 032: Respetar Eliminación Definitiva del Pedido "BRS Kinder B"

- [x] **Tarea 1 — Especificación SDD y Aprobación del Usuario**
  - [x] Crear `specs/032-eliminacion-definitiva-pedido-kinder-b/spec.md`
  - [x] Crear `specs/032-eliminacion-definitiva-pedido-kinder-b/plan.md`
  - [x] Crear `specs/032-eliminacion-definitiva-pedido-kinder-b/tasks.md`
  - [x] Solicitar aprobación del usuario antes de modificar código fuente (Aprobado)

- [x] **Tarea 2 — Modificaciones en Persistencia (`assets/js/storage.js`)**
  - [x] Modificar `deleteOrder(id)` para detectar la supresión del pedido de Kinder B y persistir `settings.kinderBOrderDeleted = true` y `settings.kinderBRecoveryApplied_v1 = true`
  - [x] Modificar `asegurarPedidoKinderB()` para respetar las banderas `kinderBOrderDeleted` y `kinderBRecoveryApplied_v1`
  - [x] Sellar la migración marcando `settings.kinderBRecoveryApplied_v1 = true` cuando el pedido ya esté presente o recuperado

- [x] **Tarea 3 — Guardia de Ciclo de Vida en Arranque (`assets/js/main.js`)**
  - [x] Envolver `asegurarPedidoKinderB()` en `main.js:init()` con la guardia `!config.kinderBRecoveryApplied_v1 && !config.kinderBOrderDeleted`

- [x] **Tarea 4 — Pruebas Automatizadas**
  - [x] Crear suite `tests/kinder_b_deletion_preservation.test.js` probando eliminación, persistencia de bandera y no-resurrección tras borrado
  - [x] Asegurar compatibilidad en `tests/kinder_b_preservation.test.js`
  - [x] Ejecutar la suite global `node --test tests/*.test.js` y verificar 100% aprobado (273/273 tests passing en 25 suites)

- [x] **Tarea 5 — Documentación y Cierre**
  - [x] Actualizar `memory.md` (Sección 2 y Sección 3)
  - [x] Marcar tareas en `tasks.md`
  - [ ] Commit y push a `main`
