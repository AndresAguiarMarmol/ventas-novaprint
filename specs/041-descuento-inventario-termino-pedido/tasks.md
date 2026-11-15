# Tareas de Implementación — Spec 041: Descuento Automático de Inventario al Terminar Pedido

## Fase 1: Especificación y Aprobación (SDD)
- [x] T01: Investigar la causa raíz de la no disminución de existencias para la orden `NP-20261111-002`.
- [x] T02: Crear `specs/041-descuento-inventario-termino-pedido/spec.md`.
- [x] T03: Crear `specs/041-descuento-inventario-termino-pedido/plan.md`.
- [x] T04: Crear `specs/041-descuento-inventario-termino-pedido/tasks.md`.
- [x] T05: Presentar el análisis, la especificación y el plan de mitigación al usuario para su aprobación explícita ("Aprobado").

---

## Fase 2: Implementación
- [x] T06: En `assets/js/production.js`, enriquecer `descontarInventarioPorPedido` e implementar `restituirInventarioPorPedido`.
- [x] T07: En `assets/js/storage.js`, actualizar `updateOrderStatus` para descontar existencias ante estados de culminación (`'Listo para entrega'`, `'Entregado'` o `'En producción'`) con bandera de idempotencia `stockDeducted`.
- [x] T08: En `assets/js/storage.js`, agregar soporte de restitución ante cancelación (`newStatus === 'Cancelado'`).
- [x] T09: En `assets/js/storage.js`, implementar `reconciliarDescuentosPedidosTerminados()` para procesar órdenes concluidas preexistentes como `NP-20261111-002`.
- [x] T10: En `assets/js/ui.js`, asegurar que `enviarPedidoAFabricacion` persista `stockDeducted: true` para evitar duplicación.
- [x] T11: En `assets/js/main.js`, invocar la reconciliación en `init()`.

---

## Fase 3: Pruebas y Verificación
- [x] T12: Crear suite de pruebas `tests/inventory_order_deduction.test.js`.
- [x] T13: Ejecutar la suite de pruebas unitarias de descuento de stock de pedidos.
- [x] T14: Ejecutar todas las suites de prueba (`node --test tests/*.test.js`) asegurando 0 regresiones.

---

## Fase 4: Documentación y Despliegue
- [x] T15: Actualizar `memory.md` (Sección 2 y Sección 3).
- [x] T16: Realizar commit y push a `origin/main`.
- [ ] T17: Entregar informe final con pasos de verificación al usuario.
