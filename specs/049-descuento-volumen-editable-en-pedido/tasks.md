# Tareas de Implementación — Spec 049: Descuento por Volumen Visible y Editable en Pedidos

## Fase 1: Especificación y Aprobación (SDD)
- [x] T01: Redactar especificación técnica (`specs/049-descuento-volumen-editable-en-pedido/spec.md`).
- [x] T02: Diseñar arquitectura del componente y plan de pruebas (`specs/049-descuento-volumen-editable-en-pedido/plan.md`).
- [x] T03: Desglosar tareas ejecutables (`specs/049-descuento-volumen-editable-en-pedido/tasks.md`).
- [x] T04: Presentar opciones y decisiones al usuario y aguardar aprobación explícita.

---

## Fase 2: Implementación
- [x] T05: En `assets/js/sales.js`, actualizar `calcularTotalesPedido` para soportar `opciones.porcentajeDescuentoManual`.
- [x] T06: En `index.html`, actualizar `#dialog-order` reemplazando el bloque estático por la tarjeta visible y editable `#form-discount-container`.
- [x] T07: En `assets/js/ui.js`, actualizar `recalcularTotalesFormulario()`, `abrirModalNuevoPedido()`, `editarPedido()`, `duplicarPedido()` y `guardarPedidoDesdeFormulario()` para integrar el input editable y la casilla de aceptación.

---

## Fase 3: Pruebas y Verificación
- [x] T08: Crear suite de pruebas `tests/order_editable_volume_discount.test.js`.
- [x] T09: Ejecutar la nueva suite de pruebas unitarias.
- [x] T10: Ejecutar la suite completa `node --test tests/*.test.js` asegurando 100% de éxito y 0 regresiones.

---

## Fase 4: Documentación y Despliegue
- [x] T11: Actualizar `memory.md` (Sección 1, Sección 2 y Sección 3).
- [x] T12: Commit y push a `origin/main`.
- [x] T13: Entregar reporte final con pasos de verificación al usuario.
