# Tareas de Implementación — Spec 039: Reporte de Material Usado / Consumo Ordenado por Pedido

## Fase 1: Especificación y Aprobación (SDD)
- [x] T01: Inspeccionar la vista `#inv-subview-usage` y los módulos `production.js`, `ui.js` y `main.js`.
- [x] T02: Crear `specs/039-material-usado-por-pedido/spec.md`.
- [x] T03: Crear `specs/039-material-usado-por-pedido/plan.md`.
- [x] T04: Crear `specs/039-material-usado-por-pedido/tasks.md`.
- [x] T05: Presentar especificación y plan al usuario para aprobación ("Aprobado").

---

## Fase 2: Implementación
- [x] T06: Actualizar `calcularConsumoMateriales` en `assets/js/production.js` para generar el arreglo `pedidos` con la lista de órdenes válidas ordenadas descendentemente y el desglose de sus materiales consumidos.
- [x] T07: En `index.html`, actualizar la barra de herramientas de `#inv-subview-usage` con el conmutador de modo ("📋 Por Pedido" / "📦 Por Material") y el botón "Todos", preparando la cabecera dinámica de la tabla.
- [x] T08: En `assets/js/ui.js`, implementar `cambiarModoVistaUso`, `limpiarFiltroMesUso`, y enriquecer `renderInventoryUsage` y `filtrarMaterialUsado` para renderizar el reporte ordenado por Pedido con filas cabecera de orden y filas hijas de insumos.
- [x] T09: Exportar las nuevas funciones en `NovaprintUI` y asegurar sincronización en `main.js`.

---

## Fase 3: Pruebas y Verificación
- [x] T10: Actualizar `tests/inventory_material_usage.test.js` con pruebas unitarias para el ordenamiento y desglose por Pedido.
- [x] T11: Ejecutar la suite de pruebas unitarias de material usado.
- [x] T12: Ejecutar la suite completa de pruebas (`node --test tests/*.test.js`) asegurando 0 regresiones.

---

## Fase 4: Documentación y Despliegue
- [x] T13: Actualizar `memory.md` (Sección 2 y Sección 3).
- [ ] T14: Realizar commit y push a `origin/main`.
- [ ] T15: Entregar informe final con pasos de verificación al usuario.

