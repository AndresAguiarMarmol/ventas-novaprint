# Tareas de Implementación — Spec 040: Enlace de Categoría de Gastos con Plan de Cuentas

## Fase 1: Especificación y Aprobación (SDD)
- [x] T01: Inspeccionar el modal `#dialog-expense` en `index.html` y los módulos `accounting.js`, `storage.js` y `ui.js`.
- [x] T02: Crear `specs/040-enlace-categoria-gastos-plan-cuentas/spec.md`.
- [x] T03: Crear `specs/040-enlace-categoria-gastos-plan-cuentas/plan.md`.
- [x] T04: Crear `specs/040-enlace-categoria-gastos-plan-cuentas/tasks.md`.
- [x] T05: Presentar especificación y plan al usuario para aprobación ("Aprobado").

---

## Fase 2: Implementación
- [x] T06: Implementar `poblarSelectorCategoriasGasto(categoriaSeleccionada)` en `assets/js/ui.js` para consultar `storage.getAccounts()` y cargar dinámicamente las cuentas de egreso/gasto.
- [x] T07: Enlazar `poblarSelectorCategoriasGasto` en `abrirModalNuevoGasto`, `editarGasto` y `duplicarGasto` en `assets/js/ui.js`.
- [x] T08: Actualizar `guardarGastoDesdeFormulario` en `assets/js/ui.js` para extraer y guardar `accountCode`, `accountId` y `accountName` junto a `category`.
- [x] T09: En `assets/js/accounting.js`, actualizar `generarLibroDiario` y `asientoAfectaCuenta` para enlazar directamente el asiento de gasto por código/ID de cuenta contable.
- [x] T10: Exportar `poblarSelectorCategoriasGasto` en `NovaprintUI`.

---

## Fase 3: Pruebas y Verificación
- [x] T11: Crear la suite de pruebas unitarias `tests/expense_accounts_link.test.js`.
- [x] T12: Ejecutar la nueva suite de pruebas unitarias de enlace de cuentas de gastos.
- [x] T13: Ejecutar la suite completa de pruebas (`node --test tests/*.test.js`) asegurando 0 regresiones.

---

## Fase 4: Documentación y Despliegue
- [x] T14: Actualizar `memory.md` (Sección 2 y Sección 3).
- [x] T15: Realizar commit y push a `origin/main`.
- [ ] T16: Entregar informe final con pasos de verificación al usuario.

