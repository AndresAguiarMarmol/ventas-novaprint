# Tareas de Implementación — Spec 045: Longitud del Campo P. Unitario a 7 Caracteres

## Fase 1: Especificación y Aprobación (SDD)
- [x] T01: Ejecutar `/ana` y confirmar decisiones de diseño con el usuario (1A, 2A, 3A).
- [x] T02: Crear `specs/045-longitud-precio-unitario-pedidos/spec.md`.
- [x] T03: Crear `specs/045-longitud-precio-unitario-pedidos/plan.md`.
- [x] T04: Crear `specs/045-longitud-precio-unitario-pedidos/tasks.md`.

---

## Fase 2: Implementación
- [x] T05: En `index.html`, actualizar la cabecera `<th>` de `P. Unit` con `w-20`.
- [x] T06: En `assets/js/ui.js` (`renderTablaItemsFormulario`), actualizar el input de precio con `w-20 px-2 py-1`, `min="0"`, `max="9999999"`.
- [x] T07: En `assets/js/ui.js` (`actualizarItemProp`), validar que `unitPrice` se acote al rango 0-9999999.

---

## Fase 3: Pruebas y Verificación
- [x] T08: Crear suite de pruebas `tests/order_unit_price_dimension.test.js`.
- [x] T09: Ejecutar la nueva suite de pruebas unitarias.
- [x] T10: Ejecutar la suite completa `node --test tests/*.test.js` asegurando 100% de éxito y 0 regresiones.

---

## Fase 4: Documentación y Despliegue
- [x] T11: Actualizar `memory.md` (Sección 2 y Sección 3).
- [x] T12: Commit y push a `origin/main`.
- [x] T13: Entregar reporte final con pasos de verificación al usuario.
