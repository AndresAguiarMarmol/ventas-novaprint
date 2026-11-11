# Tareas — Spec 034: Edición de Costo y Cantidad al Separar Compra en 2 Facturas

- [x] **Tarea 1 — Especificación SDD y Aprobación del Usuario**
  - [x] Crear `specs/034-edicion-costo-cantidad-separar-compra/spec.md`
  - [x] Crear `specs/034-edicion-costo-cantidad-separar-compra/plan.md`
  - [x] Crear `specs/034-edicion-costo-cantidad-separar-compra/tasks.md`
  - [x] Solicitar aprobación del usuario antes de modificar código (Aprobado)

- [x] **Tarea 2 — Interfaz y Controladores en `assets/js/ui.js`**
  - [x] Reemplazar celdas estáticas de cantidad y costo por inputs numéricos en `abrirModalSepararCompra()`
  - [x] Implementar la función controladora `actualizarItemSplit(tipo, index, campo, valor)`
  - [x] Actualizar subtotales por fila, badges de conteo y disparar `recalcularTotalesSeparacion()`
  - [x] Exportar `actualizarItemSplit` en `NovaprintUI`

- [x] **Tarea 3 — Pruebas Automatizadas**
  - [x] Crear suite de pruebas `tests/split_purchase_edit_items.test.js`
  - [x] Probar renderizado de inputs, edición reactiva de cantidades/costos y persistencia en 2 facturas
  - [x] Ejecutar `node --test tests/*.test.js` y verificar 100% de pruebas aprobadas (279/279 tests en 27 suites)

- [x] **Tarea 4 — Documentación y Cierre**
  - [x] Actualizar `memory.md` (Sección 2 y Sección 3)
  - [x] Marcar checklist en `tasks.md`
  - [ ] Commit y push a `main`
