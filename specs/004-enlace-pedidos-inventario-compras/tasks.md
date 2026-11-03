# Tareas de Implementación — Spec 004: Enlace Pedidos ➔ Inventario & Faltantes

- [x] **Tarea 1: Pruebas unitarias TDD en `tests/production.test.js`**
  - Pruebas para `verificarDisponibilidadPrenda` (stock suficiente, faltante parcial, no registrado).
  - Pruebas para `calcularFaltantesPedido` (detección de lista de compra).
  - Pruebas para `descontarInventarioPorPedido` (descuento exacto y protección contra stock negativo).
  - *Criterio de verificación:* `node --test tests/production.test.js` ejecutado.

- [x] **Tarea 2: Lógica de Negocio en `assets/js/production.js`**
  - Implementar `verificarDisponibilidadPrenda`.
  - Implementar `calcularFaltantesPedido`.
  - Implementar `descontarInventarioPorPedido`.
  - Exportar funciones en el módulo.
  - *Criterio de verificación:* Pruebas unitarias de Tarea 1 pasando en verde.

- [x] **Tarea 3: Persistencia en `assets/js/storage.js`**
  - Implementar método `descontarStockPorPedido(itemsPedido)`.
  - Añadir pruebas unitarias en `tests/storage.test.js`.
  - *Criterio de verificación:* `node --test tests/storage.test.js` pasando al 100%.

- [x] **Tarea 4: Interfaz de Usuario y Formulario de Pedido en `assets/js/ui.js`**
  - Renderizar badge de disponibilidad en tiempo real en cada fila del pedido (`#order-items-tbody`).
  - Renderizar sección de alerta de materiales faltantes en `#form-order` y en las tarjetas de pedidos.
  - Implementar acción `abrirModalCompraConFaltantes(itemsFaltantes)` para pre-llenar la orden de compra en `#dialog-purchase`.
  - Integrar descuento automático de existencias en `enviarPedidoAFabricacion`.
  - *Criterio de verificación:* Apertura del formulario de pedido y comprobación de stock y compras.

- [x] **Tarea 5: Verificación Integral y Memoria del Proyecto**
  - Ejecutar suite completa `node --test tests/*.test.js`.
  - Actualizar `memory.md` (Sección 1, 2 y 3).
  - *Criterio de verificación:* Cero regresiones, 100% pruebas en verde.
