# Plan de Implementación — Spec 013: Flexibilidad de Precios Libres y Descuentos por Volumen

## 1. Flexibilización de Precios en Pedidos (`assets/js/sales.js` y `assets/js/ui.js`)
- En `assets/js/sales.js`:
  - En `calcularSubtotalItem(cantidad, precioUnitario)`:
    - Permitir precios cero o libres: si `isNaN(cant) || isNaN(precio) || cant <= 0`, retornar `0`. Eliminar la condición `precio <= 0` que invalidaba el precio.
  - En `calcularTotalesPedido`:
    - Procesar `unitPrice` como número libre (`Number(item.unitPrice) || 0`).
- En `assets/js/ui.js`:
  - En la generación de filas de prendas (`renderTablaItemsFormulario`):
    - Reemplazar el input de precio: `<input type="number" step="any" ...>` sin atributo restrictivo `step="500"` ni validaciones que bloqueen el submit.
  - En `actualizarItemProp`:
    - Permitir cualquier valor numérico parsed: `parseFloat(value) || 0`.
- En `index.html`:
  - Agregar atributo `novalidate` al `<form id="form-order">` para que validaciones HTML5 nativas no interrumpan la captura de datos del pedido.
  - Ajustar en inventario y compras `step="any"` para coherencia general.

## 2. Modal y Botones de Descuentos por Volumen (`index.html`, `assets/js/ui.js` y `assets/js/main.js`)
- En `index.html`:
  - Agregar botón en barra de herramientas de pedidos (`#btn-view-volume-discounts`).
  - Agregar botón dentro de `#dialog-order` junto a la sección de totales (`#btn-open-volume-discounts-order`).
  - Crear modal nativo `<dialog id="dialog-volume-discounts">` con diseño sobrio y moderno:
    - Encabezado: "Escala Oficial de Descuentos por Volumen".
    - Tabla con las 5 escalas (1 a 5 un. -> 0%, 6 a 11 un. -> 5%, 12 a 24 un. -> 10%, 25 a 49 un. -> 15%, 50+ un. -> 20%).
    - Indicador de estado actual: muestra la cantidad actual de prendas en el formulario de pedido y resalta el tramo alcanzado o cuánto falta para el siguiente tramo.
    - Botón de cierre.
- En `assets/js/ui.js`:
  - Crear función `abrirModalDescuentosVolumen()`:
    - Calcula la cantidad de prendas en `currentOrderItems` si `#dialog-order` está abierto.
    - Renderiza dinámicamente el tramo activo y sugerencia de ahorro.
    - Abre `#dialog-volume-discounts.showModal()`.
- En `assets/js/main.js`:
  - Enlazar los eventos click de `#btn-view-volume-discounts` y `#btn-open-volume-discounts-order` a `NovaprintUI.abrirModalDescuentosVolumen()`.

## 3. Pruebas Unitarias (`tests/sales.test.js`)
- Añadir pruebas unitarias verificando:
  - `calcularSubtotalItem` con precio 0 y precios libres arbitrarios (ej. 1990, 3250).
  - `calcularTotalesPedido` con precios unitarios libres y sin restricciones.
  - Que la escala de descuentos por volumen se calcula correctamente para cualquier combinación.

## 4. Memoria del Proyecto (`memory.md`)
- Actualizar `memory.md` en Sección 2 y Sección 3 con Spec 013.

