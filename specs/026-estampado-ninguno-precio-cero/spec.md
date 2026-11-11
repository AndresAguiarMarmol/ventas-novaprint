# Spec 026 — Opción "Ninguno" en Campo Estampado con Precio $0 CLP

Estado: implementada

## 1. Contexto y Problema
En el formulario de creación y edición de pedidos (`#dialog-order`), la tabla de prendas contiene la columna **Estampado** (`printLocation`), la cual permite seleccionar la ubicación y técnica de personalización de cada prenda. En la Spec 020 se formalizaron las opciones con costos y precios diferenciados:
- **Adelante:** Costo compra $1.800 CLP | Precio venta sugerido $3.200 CLP.
- **Atrás:** Costo compra $2.200 CLP | Precio venta sugerido $3.500 CLP.
- **Ambos:** Costo compra $3.500 CLP | Precio venta sugerido $5.500 CLP.

Sin embargo, en el taller frecuentemente los clientes solicitan **prendas lisas sin estampado** (por ejemplo, compra de poleras o polerones lisos al por mayor o muestras textiles base). Actualmente, el selector obliga a elegir una de las tres opciones con costo y recargo de estampado, impidiendo registrar pedidos con prendas lisas sin recargo adicional de estampado y generando órdenes de compra automáticas de insumos DTF innecesarias.

Se requiere:
1. Agregar la opción **"Ninguno"** en el campo/selector de estampado con costo de compra **$0 CLP** y precio de venta de estampado **$0 CLP**.
2. Al seleccionar "Ninguno", el precio sugerido de la prenda debe calcularse únicamente con el costo base de la prenda lisa (más recargos por tallas especiales si aplican), sin añadir ningún valor por concepto de estampado ($0).
3. En la detección de faltantes de material de compra (`calcularFaltantesPedido`), las prendas con estampado "Ninguno" no deben generar ítems de compra de insumos de estampado DTF.
4. Preservar todas las opciones y funcionalidades existentes ("Adelante", "Atrás", "Ambos") sin modificar su comportamiento.

## 2. Historias de Usuario
- **Como vendedor del taller**, quiero poder seleccionar "Ninguno ($0)" en el campo de estampado para vender prendas textiles lisas al cliente sin recargo de impresión.
- **Como cliente**, quiero comprar poleras o polerones lisos y que en mi ticket y cotización se desglose que no llevan estampado con precio $0 por dicho concepto.
- **Como encargado de compras**, cuando se genere una orden de compra por material faltante para un pedido de prendas lisas ("Ninguno"), no quiero que se incluyan compras de películas o transferencias DTF inexistentes.

## 3. Requisitos Funcionales (Formato EARS)

### [REQ-026-1] Parametrización Oficial de "Ninguno" en `OPCIONES_ESTAMPADO`
- **En `assets/js/production.js`**, el objeto `OPCIONES_ESTAMPADO` debe incluir la opción `NINGUNO`:
  ```javascript
  NINGUNO: {
    id: 'Ninguno',
    nombre: 'Ninguno',
    label: 'Ninguno ($0)',
    costoCompra: 0,
    precioVentaSugerido: 0
  }
  ```
- **La función `normalizarOpcionEstampado(ubicacion)`** debe reconocer variaciones como `'ninguno'`, `'ningun'`, `'sin estampado'`, `'sin'`, `'lisa'`, `'liso'`, retornando `OPCIONES_ESTAMPADO.NINGUNO`.
- **La función `obtenerCostoCompraEstampado('Ninguno')`** debe retornar exactamente `0`.

### [REQ-026-2] Cálculo de Precio Sugerido en Ventas (`sales.js`)
- **En `calcularPrecioSugeridoPrenda(item)`**, cuando `item.printLocation` sea `'Ninguno'` (o normalizado a `'Ninguno'`), el costo de estampado debe ser estrictamente `0 CLP`:
  $$\text{Precio Sugerido} = \text{Costo Base Prenda} + \text{Recargo Talla Especial} + 0$$
- Para una polera estándar de algodón en talla L con estampado "Ninguno", el precio de referencia debe ser $3.500 CLP.

### [REQ-026-3] Detección de Faltantes y Compras de Insumos (`production.js`)
- **En `calcularFaltantesPedido(inventario, itemsPedido, opciones)`**:
  - Cuando una prenda tenga estampado `'Ninguno'` o su `costoCompra === 0`, el sistema **no** debe agregar insumos de estampado a la lista `faltantesParaCompra`.
  - El contador `totalEstampadosFaltantes` no debe incrementarse para ítems con estampado `'Ninguno'`.
  - La verificación de existencias de la prenda física textil en bodega debe continuar operando con normalidad.

### [REQ-026-4] Interfaz de Usuario y Formulario de Pedido (`ui.js`)
- **En `renderTablaItemsFormulario()`**, el selector de la columna "Estampado" debe incorporar la opción:
  `<option value="Ninguno" ...>Ninguno ($0)</option>`
  ubicada de forma clara y accesible.
- **Al seleccionar "Ninguno"**, el evento interactivo `actualizarItemProp` debe actualizar el precio sugerido de la fila en tiempo real (si el precio no fue fijado manualmente) y actualizar el subtotal y totales del pedido.
- **La función `normalizarUbicacionEstampado(ubicacion)`** en `ui.js` debe normalizar `'Ninguno'` a `'Ninguno'`.

### [REQ-026-5] No Regresión y Compatibilidad
- Las opciones preexistentes `Adelante ($1.800)`, `Atrás ($2.200)` y `Ambos ($3.500)` deben seguir operando idénticamente.
- Los 213 tests automatizados preexistentes deben continuar en verde.
