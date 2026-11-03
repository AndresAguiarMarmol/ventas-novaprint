# Tareas de Implementación — Spec 005: IVA y Delivery en Pedidos y Compras

- [x] **Tarea 1: Pruebas unitarias TDD en `tests/sales.test.js` y `tests/production.test.js`**
  - Pruebas para `calcularTotalesPedido` con IVA (19%) y Delivery ($0 y montos reales).
  - Pruebas para `calcularTotalesCompra` con IVA (19%) y Delivery.
  - *Criterio de verificación:* Ejecución de pruebas en fase roja y posterior verde.

- [x] **Tarea 2: Lógica de Negocio en `assets/js/sales.js` y `assets/js/production.js`**
  - Implementar cálculo de IVA (19%) y Delivery en `sales.js`.
  - Implementar `calcularTotalesCompra` con IVA y Delivery en `production.js`.
  - Exportar funciones y constantes (`TASA_IVA_CHILE`).
  - *Criterio de verificación:* Pruebas unitarias de Tarea 1 pasando en verde.

- [x] **Tarea 3: Persistencia en `assets/js/storage.js`**
  - Actualizar `savePurchase` para guardar desglose de IVA y Delivery.
  - Añadir pruebas unitarias en `tests/storage.test.js`.
  - *Criterio de verificación:* Pruebas de storage pasando al 100%.

- [x] **Tarea 4: Interfaz de Usuario en `index.html` y `assets/js/ui.js`**
  - Añadir controles de IVA y Delivery (por defecto en 0) en `#dialog-order`.
  - Añadir controles de IVA y Delivery (por defecto en 0) en `#dialog-purchase`.
  - Conectar recálculo en tiempo real en `ui.js`.
  - Actualizar `ticket.js` y mensaje de WhatsApp en `sales.js`.
  - *Criterio de verificación:* Prueba de comprobantes y recálculo en vivo en ambos modales.

- [x] **Tarea 5: Verificación Integral y Memoria del Proyecto**
  - Ejecutar suite completa `node --test tests/*.test.js`.
  - Actualizar `memory.md` (Sección 1, 2 y 3).
  - *Criterio de verificación:* 100% de pruebas unitarias pasando en verde y sin regresiones.
