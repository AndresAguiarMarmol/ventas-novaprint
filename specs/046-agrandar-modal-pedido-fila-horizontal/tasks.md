# Tareas de Implementación — Spec 046: Ampliación de Modal y Filas Horizontales

## Fase 1: Especificación y Aprobación (SDD)
- [x] T01: Ejecutar `/ana` y confirmar decisiones con el usuario (1A, 2A).
- [x] T02: Crear `specs/046-agrandar-modal-pedido-fila-horizontal/spec.md`.
- [x] T03: Crear `specs/046-agrandar-modal-pedido-fila-horizontal/plan.md`.
- [x] T04: Crear `specs/046-agrandar-modal-pedido-fila-horizontal/tasks.md`.

---

## Fase 2: Implementación
- [x] T05: En `index.html`, actualizar `#dialog-order` a `max-w-6xl`.
- [x] T06: En `index.html`, restablecer las cabeceras `Cód. Inventario` y `Artículo` en columnas horizontales separadas.
- [x] T07: En `assets/js/ui.js` (`renderTablaItemsFormulario`), separar en dos celdas `<td>` en la misma fila: Cód. Inventario (`w-36`) y Artículo (`garmentType` con badge de stock).

---

## Fase 3: Pruebas y Verificación
- [x] T08: Actualizar y verificar `tests/order_item_details_layout.test.js`.
- [x] T09: Ejecutar la suite completa `node --test tests/*.test.js` asegurando 100% de éxito y 0 regresiones.

---

## Fase 4: Documentación y Despliegue
- [x] T10: Actualizar `memory.md` (Sección 2 y Sección 3).
- [x] T11: Commit y push a `origin/main`.
- [x] T12: Entregar reporte final con pasos de verificación al usuario.
