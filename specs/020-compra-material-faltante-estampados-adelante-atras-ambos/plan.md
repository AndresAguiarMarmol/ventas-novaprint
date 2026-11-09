# Plan Técnico — Spec 020: Compra de Estampados en Material Faltante

## 1. Arquitectura y Módulos

```
[ Formulario de Pedidos (index.html / ui.js) ]
  ├── Selector Estampado: Adelante | Atrás | Ambos
  ├── Cálculo de Precio Sugerido (sales.js)
  └── Alerta de Material Faltante (Prendas + Estampados)
             │
             ▼ (Click en 🛒 Comprar Material Faltante)
[ production.js: calcularFaltantesPedido({ incluirEstampados: true }) ]
  ├── Faltantes de Prendas Base (según stock en bodega)
  └── Faltantes de Estampados (1 un. por cada prenda del pedido)
             │
             ▼
[ storage.js: asegurarItemInventarioEstampado ]
             │
             ▼
[ Formulario de Compra de Insumos (#dialog-purchase / ui.js) ]
  ├── Filas de Prendas Base Faltantes
  └── Filas de Estampados (Adelante $1.800 / Atrás $2.200 / Ambos $3.500)
```

## 2. Contratos y Modificaciones por Módulo

### A. `assets/js/production.js`
- **Constante exportada:** `OPCIONES_ESTAMPADO`:
  - `ADELANTE: { id: 'Adelante', nombre: 'Adelante', label: 'Adelante (Pecho)', costoCompra: 1800, precioVentaSugerido: 3200 }`
  - `ATRAS: { id: 'Atrás', nombre: 'Atrás', label: 'Atrás (Espalda)', costoCompra: 2200, precioVentaSugerido: 3500 }`
  - `AMBOS: { id: 'Ambos', nombre: 'Ambos', label: 'Ambos (Adelante y Atrás)', costoCompra: 3500, precioVentaSugerido: 5500 }`
- **Funciones auxiliares:**
  - `normalizarOpcionEstampado(ubicacion)`: Resuelve strings existentes o nuevos hacia `'Adelante'`, `'Atrás'` o `'Ambos'`.
  - `obtenerCostoCompraEstampado(ubicacion)`: Retorna `1800`, `2200` o `3500`.
- **Modificación en `calcularFaltantesPedido(inventario, itemsPedido, opciones = {})`:**
  - Soporta `opciones.incluirEstampados: true`.
  - Calcula `totalEstampadosFaltantes`.
  - Genera ítems de compra para estampados con `isEstampado: true`, cantidad por cada unidad del ítem y su respectivo costo de compra.

### B. `assets/js/sales.js`
- **Modificación en `calcularPrecioSugeridoPrenda(item)`:**
  - Reconoce las opciones `'Adelante'` ($3.200), `'Atrás'` ($3.500) y `'Ambos'` ($5.500), preservando reglas previas de tallas y compatibilidad de telas.

### C. `assets/js/storage.js`
- **Nueva función exportada:** `asegurarItemInventarioEstampado(technique, location, datosExtra)`:
  - Busca o crea un ítem en inventario con categoría `'Insumos DTF'` (o de la técnica), nombre `Estampado [Técnica] - [Ubicación]`, stock 0 y el costo de compra de referencia.

### D. `assets/js/ui.js`
- **Renderizado de filas en `#order-items-tbody`:**
  - Columna 5 se convierte en `<select>` con opciones:
    - `Adelante` (con tooltip / costo de referencia)
    - `Atrás`
    - `Ambos`
  - Soporta valores legados mapeándolos transparentemente.
- **En `abrirModalCompraConFaltantes()`:**
  - Invoca `calcularFaltantesPedido` con `{ incluirEstampados: true }`.
  - Si el ítem es estampado, asegura su existencia en inventario con `storage.asegurarItemInventarioEstampado`.
  - Pre-carga la tabla de compras con prendas y estampados.
- **En `order-stock-alert-container`:**
  - Muestra el conteo de prendas faltantes y de estampados a comprar.

## 3. Plan de Pruebas
- Archivo de pruebas dedicado: `tests/print_purchases_faltantes.test.js`.
- Casos a verificar:
  1. `normalizarOpcionEstampado` y costos de compra correspondientes para Adelante ($1.800), Atrás ($2.200) y Ambos ($3.500).
  2. `calcularFaltantesPedido` con `{ incluirEstampados: true }`: genera tanto las prendas base faltantes como los estampados por cada unidad.
  3. Comprobación de que `calcularFaltantesPedido` sin la opción mantenga el comportamiento anterior para no romper tests previos.
  4. `asegurarItemInventarioEstampado` crea y recupera el ítem de estampado en bodega con su código y categoría.
  5. Cálculo del precio sugerido de venta en `sales.js` para las 3 opciones.
  6. Suite completa de 146+ pruebas pasando al 100%.

