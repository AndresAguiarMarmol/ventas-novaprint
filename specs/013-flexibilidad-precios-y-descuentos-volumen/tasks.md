# Tareas de Implementación — Spec 013: Flexibilidad de Precios Libres y Descuentos por Volumen

- [x] **Tarea 1: Especificación y Diseño Técnico (SDD)**
  - Crear `spec.md`, `plan.md` y `tasks.md` en `specs/013-flexibilidad-precios-y-descuentos-volumen/`.

- [x] **Tarea 2: Flexibilización de Precios en Lógica Financiera (`assets/js/sales.js`)**
  - Actualizar `calcularSubtotalItem` para permitir precio $0 y precios libres sin restricciones.
  - Asegurar cálculo de totales con precios libres en `calcularTotalesPedido`.

- [x] **Tarea 3: Interfaz de Ingreso Libre de Precios (`assets/js/ui.js` e `index.html`)**
  - Remover restricciones `step="500"` y fijar `step="any"` en los inputs de precio unitario en `ui.js`.
  - Agregar `novalidate` en `<form id="form-order">` para evitar interrupciones de validación nativa de HTML5.
  - Permitir captura libre en `actualizarItemProp`.

- [x] **Tarea 4: Botones y Modal de Descuentos por Volumen (`index.html`, `assets/js/ui.js`, `assets/js/main.js`)**
  - Añadir `<dialog id="dialog-volume-discounts">` en `index.html` con la escala explicada.
  - Añadir botón de acceso en barra de pedidos (`#btn-view-volume-discounts`).
  - Añadir botón de acceso en el formulario de pedido (`#btn-open-volume-discounts-order`).
  - Implementar `abrirModalDescuentosVolumen()` en `ui.js` con resaltado del tramo activo según las prendas del pedido.
  - Enlazar eventos en `main.js`.

- [x] **Tarea 5: Pruebas Unitarias Automatizadas (`tests/sales.test.js`)**
  - Agregar pruebas para precios libres (0, decimales, arbitrarios) y escala de descuentos.
  - Ejecutar suite de pruebas (`node --test tests/*.test.js`) y confirmar 100% verde.

- [x] **Tarea 6: Memoria del Proyecto (`memory.md`)**
  - Actualizar Sección 2 y Sección 3 en `memory.md`.
