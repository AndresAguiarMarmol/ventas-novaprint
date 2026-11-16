# Tareas de Implementación — Spec 042: Enlace de Pedido con Código de Inventario

## Fase 1: Especificación y Aprobación (SDD)
- [x] T01: Ejecutar `/ana` y obtener confirmación de las 4 decisiones de diseño del usuario.
- [x] T02: Crear `specs/042-enlace-codigo-inventario-pedido/spec.md`.
- [x] T03: Crear `specs/042-enlace-codigo-inventario-pedido/plan.md`.
- [x] T04: Crear `specs/042-enlace-codigo-inventario-pedido/tasks.md`.

---

## Fase 2: Implementación
- [x] T05: En `index.html`, agregar la columna `<th>Cód. Inventario</th>` en la tabla de prendas de `#dialog-order`.
- [x] T06: En `assets/js/production.js`, actualizar `verificarDisponibilidadPrenda`, `descontarInventarioPorPedido` y `restituirInventarioPorPedido` para priorizar la búsqueda directa por `inventoryItemId` / `inventoryCode`.
- [x] T07: En `assets/js/ui.js`, implementar `generarOpcionesCodigoInventario` y añadir el `<select>` de código en `renderTablaItemsFormulario`.
- [x] T08: En `assets/js/ui.js`, implementar la sincronización bidireccional en `actualizarItemProp` (código -> prenda/color/talla y viceversa).
- [x] T09: En `assets/js/ui.js`, actualizar `guardarPedidoDesdeFormulario`, `editarPedido` y `duplicarPedido` para persistir y restaurar `inventoryCode` e `inventoryItemId`.
- [x] T10: En `assets/js/ticket.js`, incorporar la impresión de `[inventoryCode]` en el desglose de prendas.

---

## Fase 3: Pruebas y Verificación
- [x] T11: Crear la suite de pruebas unitarias `tests/order_inventory_code_link.test.js`.
- [x] T12: Ejecutar la nueva suite de pruebas unitarias.
- [x] T13: Ejecutar la suite completa de pruebas (`node --test tests/*.test.js`) asegurando 0 regresiones.

---

## Fase 4: Documentación y Despliegue
- [x] T14: Actualizar `memory.md` (Sección 1, Sección 2 y Sección 3).
- [x] T15: Realizar commit y push a `origin/main`.
- [x] T16: Entregar informe final con pasos de verificación al usuario.
