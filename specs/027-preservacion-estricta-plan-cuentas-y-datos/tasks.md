# Tareas — Spec 027: Preservación Estricta del Plan de Cuentas y Datos del Taller

- [x] **Tarea 1 — Respaldo previo de seguridad**
  - [x] Generar JSON en `backups/backup_pre_preservacion_plan_cuentas_20261110.json`
  - [x] Crear y pushear tag `backup-pre-preservacion-plan-cuentas-20261110`

- [x] **Tarea 2 — Especificación SDD**
  - [x] Crear `specs/027-preservacion-estricta-plan-cuentas-y-datos/spec.md`
  - [x] Crear `specs/027-preservacion-estricta-plan-cuentas-y-datos/plan.md`
  - [x] Crear `specs/027-preservacion-estricta-plan-cuentas-y-datos/tasks.md`

- [x] **Tarea 3 — Neutralización del borrado automático en `assets/js/main.js`**
  - [x] Remover invocación de `limpiarDatosDemoPrevios()` en `init()`
  - [x] Neutralizar el cuerpo de `limpiarDatosDemoPrevios()` para prevenir ejecuciones no deseadas

- [x] **Tarea 4 — Remoción del botón destructivo en `index.html` y ajuste en `assets/js/ui.js`**
  - [x] Eliminar botón `#btn-reset-accounts` en `#acc-subview-chart`
  - [x] Asegurar que `initEventosContabilidad` en `ui.js` no falle si el botón no está presente en el DOM

- [x] **Tarea 5 — Blindaje no destructivo en `assets/js/storage.js`**
  - [x] Actualizar `resetDefaultAccounts(forzarReemplazo = false)` para preservar cuentas personalizadas

- [x] **Tarea 6 — Pruebas automatizadas**
  - [x] Crear suite `tests/data_preservation_chart_accounts.test.js`
  - [x] Ejecutar `node --test tests/*.test.js` y validar 100% aprobado (232 tests pasados)

- [x] **Tarea 7 — Documentación y cierre**
  - [x] Actualizar `memory.md`
  - [x] Git commit y push a `main`
