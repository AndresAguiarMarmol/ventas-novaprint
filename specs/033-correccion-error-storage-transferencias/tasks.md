# Tareas — Spec 033: Corrección de "storage is not defined" en Transferencias y Compras

- [x] **Tarea 1 — Especificación SDD y Aprobación del Usuario**
  - [x] Crear `specs/033-correccion-error-storage-transferencias/spec.md`
  - [x] Crear `specs/033-correccion-error-storage-transferencias/plan.md`
  - [x] Crear `specs/033-correccion-error-storage-transferencias/tasks.md`
  - [x] Solicitar aprobación del usuario antes de modificar código (Aprobado)

- [x] **Tarea 2 — Corrección en `assets/js/ui.js`**
  - [x] Añadir `const storage = global.NovaprintStorage;` en `renderPurchasesTable`
  - [x] Asegurar verificación defensiva `typeof storage.getInventory === 'function'`
  - [x] Asegurar verificación defensiva de opciones en `poblarSelectorCuentasLibroDiario`

- [x] **Tarea 3 — Pruebas Automatizadas**
  - [x] Crear prueba en `tests/purchases_table_render_storage.test.js` verificando renderizado de compras sin `ReferenceError`
  - [x] Probar simulación de transferencia entre cuentas `3101` y `3102` con compras cargadas
  - [x] Ejecutar `node --test tests/*.test.js` y verificar 100% aprobado (276/276 tests en 26 suites)

- [x] **Tarea 4 — Documentación y Cierre**
  - [x] Actualizar `memory.md` (Sección 2 y 3)
  - [x] Marcar checklist en `tasks.md`
  - [ ] Commit y push a `main`
