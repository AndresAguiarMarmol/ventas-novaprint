# Tareas de Implementación — Spec 038

## Fase 1: Especificación y Aprobación (SDD)
- [x] T01: Inspeccionar la vista `#view-inventory` en `index.html` y los módulos `production.js`, `storage.js` y `ui.js`.
- [x] T02: Crear `specs/038-material-usado-inventario/spec.md`.
- [x] T03: Crear `specs/038-material-usado-inventario/plan.md`.
- [x] T04: Crear `specs/038-material-usado-inventario/tasks.md`.
- [x] T05: Presentar especificación y plan al usuario para aprobación ("Aprobado").

---

## Fase 2: Implementación
- [x] T06: Implementar `calcularConsumoMateriales(pedidos, inventario, mesFiltro)` en `assets/js/production.js` y exportarlo.
- [x] T07: En `index.html`, agregar la barra horizontal de sub-navegación `#inv-subnav-container`, envolver `#inv-subview-stock` y construir `#inv-subview-usage` con métricas, selector de mes y tabla desglosada.
- [x] T08: Implementar `cambiarSubVistaInventario`, `renderInventoryUsage` y `filtrarMaterialUsado` en `assets/js/ui.js` y exportarlos en `NovaprintUI`.
- [x] T09: Enlazar el refresco en `assets/js/main.js` dentro de `refrescarInventario()`.

---

## Fase 3: Pruebas y Verificación
- [x] T10: Crear la suite de pruebas unitarias `tests/inventory_material_usage.test.js`.
- [x] T11: Ejecutar la nueva suite de pruebas de material usado.
- [x] T12: Ejecutar la suite completa de pruebas (`node --test tests/*.test.js`) asegurando 0 regresiones.

---

## Fase 4: Documentación y Despliegue
- [x] T13: Actualizar `memory.md` (Sección 2 y Sección 3).
- [ ] T14: Realizar commit y push a `origin/main`.
- [ ] T15: Entregar informe final con pasos de verificación al usuario.

