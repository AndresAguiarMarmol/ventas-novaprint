# Tareas de Implementación — Spec 035

## Fase 1: Especificación y Aprobación (SDD)
- [x] T01: Inspeccionar el código actual de `renderAccountingJournal` en `assets/js/ui.js`.
- [x] T02: Crear `specs/035-crud-duplicar-libro-diario/spec.md`.
- [x] T03: Crear `specs/035-crud-duplicar-libro-diario/plan.md`.
- [x] T04: Crear `specs/035-crud-duplicar-libro-diario/tasks.md`.
- [x] T05: Presentar la especificación y el plan al usuario para obtener aprobación explícita ("Aprobado").

---

## Fase 2: Implementación en `assets/js/ui.js`
- [x] T06: Implementar las funciones `editarGasto` y `duplicarGasto`.
- [x] T07: Implementar las funciones `editarTransferencia` y `duplicarTransferencia`.
- [x] T08: Implementar las funciones `duplicarPedido` y `duplicarCompra`.
- [x] T09: Modificar `renderAccountingJournal` para renderizar el grupo de botones CRUD + Duplicar `[✏️] [📋] [🗑️]` en cada fila del Libro Diario.
- [x] T10: Exponer las 6 funciones en el retorno público de `NovaprintUI`.

---

## Fase 3: Pruebas y Validación
- [x] T11: Crear la suite de pruebas unitarias `tests/journal_crud_duplicate.test.js`.
- [x] T12: Ejecutar la nueva suite de pruebas y verificar que pasen al 100%.
- [x] T13: Ejecutar todas las suites existentes (`node --test tests/*.test.js`) asegurando 0 regresiones.

---

## Fase 4: Documentación y Despliegue
- [x] T14: Actualizar `memory.md` (Sección 2 y Sección 3).
- [ ] T15: Realizar commit y push a `origin/main`.
- [ ] T16: Entregar el informe de cierre al usuario con instrucciones de verificación.

