# Tareas de Implementación — Spec 044: Fusión Vertical de "Cód. Inventario" y "Artículo/Detalle"

## Fase 1: Especificación y Aprobación (SDD)
- [x] T01: Ejecutar `/ana` y confirmar decisiones con el usuario (1a, 2a, 3b, 4a).
- [x] T02: Crear `specs/044-columna-codigo-articulo-detalle/spec.md`.
- [x] T03: Crear `specs/044-columna-codigo-articulo-detalle/plan.md`.
- [x] T04: Crear `specs/044-columna-codigo-articulo-detalle/tasks.md`.

---

## Fase 2: Implementación
- [x] T05: En `index.html`, unificar las cabeceras `<th>` en `<th class="py-2 px-1 min-w-[160px]">Cód. Inventario / Artículo</th>`.
- [x] T06: En `assets/js/ui.js` (`renderTablaItemsFormulario`), fusionar la celda inicial con el selector de código arriba y el selector de prenda/artículo con badge de stock abajo.

---

## Fase 3: Pruebas y Verificación
- [x] T07: Crear suite de pruebas `tests/order_item_details_layout.test.js`.
- [x] T08: Ejecutar la nueva suite de pruebas unitarias.
- [x] T09: Ejecutar la suite completa `node --test tests/*.test.js` asegurando 100% de éxito y 0 regresiones.

---

## Fase 4: Documentación y Despliegue
- [x] T10: Actualizar `memory.md` (Sección 2 y Sección 3).
- [x] T11: Commit y push a `origin/main`.
- [x] T12: Entregar reporte final con pasos de verificación al usuario.
