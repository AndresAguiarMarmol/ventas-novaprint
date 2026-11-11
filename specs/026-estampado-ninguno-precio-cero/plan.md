# Plan de Implementación — Spec 026: Opción "Ninguno" en Campo Estampado con Precio $0 CLP

## Módulos y Cambios Previstos

### 1. `assets/js/production.js`
- Añadir la constante de opción `NINGUNO` dentro de `OPCIONES_ESTAMPADO`:
  ```javascript
  NINGUNO: {
    id: 'Ninguno',
    nombre: 'Ninguno',
    label: 'Ninguno ($0)',
    costoCompra: 0,
    precioVentaSugerido: 0
  }
  ```
- Actualizar `normalizarOpcionEstampado(ubicacion)` para detectar palabras clave: `ninguno`, `ningun`, `sin estampado`, `sin`, `lisa`, `liso`.
- Actualizar `calcularFaltantesPedido`:
  - Evaluar `opEstampado`: si `opEstampado.id === 'Ninguno'` o `opEstampado.costoCompra === 0`, omitir la generación de ítems de compra de insumos de estampado y no sumar a `totalEstampadosFaltantes`.

### 2. `assets/js/sales.js`
- En `calcularPrecioSugeridoPrenda(item)`:
  - Añadir condición temprana para evaluar si `ubicacion` normalizada corresponde a `ninguno`, `sin estampado`, etc. En tal caso, `costoEstampado = 0`.

### 3. `assets/js/storage.js`
- En `asegurarItemInventarioEstampado(technique, location, datosExtra)`:
  - Si `location` es `'Ninguno'` o costo es 0, no generar ítem de compra innecesario o devolver `null`.

### 4. `assets/js/ui.js`
- En `normalizarUbicacionEstampado(ubicacion)`:
  - Normalizar correctamente a `'Ninguno'`.
- En `renderTablaItemsFormulario()`:
  - Agregar la opción `<option value="Ninguno" ...>Ninguno ($0)</option>` al `<select>` de la columna "Estampado".

### 5. `tests/print_option_none.test.js`
- Suite de pruebas automatizadas cubriendo:
  - Presencia y propiedades de `OPCIONES_ESTAMPADO.NINGUNO` (`costoCompra: 0`, `precioVentaSugerido: 0`).
  - Normalización de cadenas `'Ninguno'`, `'sin estampado'`, etc.
  - Cálculo de precio sugerido en `sales.calcularPrecioSugeridoPrenda` con recargo $0 por estampado.
  - `production.calcularFaltantesPedido` excluyendo compras de insumos para prendas con estampado "Ninguno".
  - Renderizado de la opción en el DOM / HTML del formulario.
- Ejecución completa de suite global (`node --test tests/*.test.js`).
