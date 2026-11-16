# Tareas de Implementación — Spec 047: Incorporación del Campo "Detalles" y Ampliación de Modal a max-w-7xl

## Fase 1: Especificación y Aprobación (SDD)
- [x] T01: Ejecutar `/ana` y confirmar decisiones con el usuario (1A, 2A, 3A).
- [x] T02: Crear `specs/047-campo-detalles-y-ampliacion-modal-pedido/spec.md`.
- [x] T03: Crear `specs/047-campo-detalles-y-ampliacion-modal-pedido/plan.md`.
- [x] T04: Crear `specs/047-campo-detalles-y-ampliacion-modal-pedido/tasks.md`.

---

## Fase 2: Implementación
- [x] T05: En `index.html`, actualizar `#dialog-order` a `max-w-7xl`.
- [x] T06: En `index.html`, añadir `<th class="py-2 px-1 w-40">Detalles</th>` después de `Artículo`.
- [x] T07: En `assets/js/ui.js` (`renderTablaItemsFormulario`), insertar la celda `<td>` con el input de `details` contigua a `Artículo`.
- [x] T08: En `assets/js/ui.js` (`actualizarItemProp`), manejar la propiedad `details` y el auto-completado con `inv.name` al elegir `inventoryCode`.
- [x] T09: En `assets/js/ticket.js`, incorporar el detalle de la prenda en la impresión si está presente.

---

## Fase 3: Pruebas y Verificación
- [x] T10: Crear suite de pruebas `tests/order_details_field.test.js`.
- [x] T11: Ejecutar la nueva suite de pruebas unitarias.
- [x] T12: Ejecutar la suite completa `node --test tests/*.test.js` asegurando 100% de éxito y 0 regresiones.

---

## Fase 4: Documentación y Despliegue
- [x] T13: Actualizar `memory.md` (Sección 1, Sección 2 y Sección 3).
- [x] T14: Commit y push a `origin/main`.
- [x] T15: Entregar reporte final con pasos de verificación al usuario.
