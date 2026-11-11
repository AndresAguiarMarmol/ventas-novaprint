# Tareas de Implementación — Spec 037

## Fase 1: Especificación y Aprobación (SDD)
- [x] T01: Inspeccionar el manejo de checkboxes en `sales.js`, `ui.js` y `storage.js`.
- [x] T02: Crear `specs/037-preservacion-checkboxes-estado-pedido/spec.md`.
- [x] T03: Crear `specs/037-preservacion-checkboxes-estado-pedido/plan.md`.
- [x] T04: Crear `specs/037-preservacion-checkboxes-estado-pedido/tasks.md`.
- [ ] T05: Presentar especificación y plan al usuario para aprobación ("Aprobado").

---

## Fase 2: Implementación
- [x] T06: Incluir `applyDiscount: Boolean(aplicarDescuentoVolumen)` en el retorno de `calcularTotalesPedido` en `assets/js/sales.js`.
- [x] T07: En `assets/js/ui.js` (`editarPedido` y `duplicarPedido`), restaurar explícitamente el estado del checkbox `#form-apply-discount` junto a `#order-apply-iva` y `#order-apply-delivery`.
- [x] T08: Validar que `storage.updateOrderStatus`, `cambiarEstado` y `seleccionarNuevoEstado` mantengan intactos los atributos `totals` al avanzar de estado.

---

## Fase 3: Pruebas y Validación
- [x] T09: Crear la suite de pruebas unitarias `tests/order_checkboxes_preservation.test.js`.
- [x] T10: Ejecutar la nueva suite de pruebas.
- [x] T11: Ejecutar la suite completa de pruebas (`node --test tests/*.test.js`) asegurando 0 regresiones.

---

## Fase 4: Documentación y Despliegue
- [x] T12: Actualizar `memory.md` (Sección 2 y Sección 3).
- [ ] T13: Commit y push a `origin/main`.
- [ ] T14: Entregar informe final con pasos de verificación.

