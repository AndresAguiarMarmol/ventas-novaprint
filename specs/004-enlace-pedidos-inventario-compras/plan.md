# Plan de Implementación — Spec 004: Enlace Pedidos ➔ Inventario & Faltantes

## 1. Arquitectura y Módulos Involucrados

```
┌──────────────────────────────────────────────────────────────┐
│                     Novaprint Sales (UI)                     │
│               Formulario Pedido / Tarjeta Pedido             │
└──────────────────────────────┬───────────────────────────────┘
                               │
            consulta disponibilidad en tiempo real
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                 Novaprint Production Logic                   │
│  - verificarDisponibilidadPrenda(inventario, item)           │
│  - calcularFaltantesPedido(inventario, itemsPedido)          │
│  - descontarInventarioPorPedido(inventario, itemsPedido)     │
└──────────────────────────────┬───────────────────────────────┘
                               │
                   actualiza stock físico
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                    Novaprint Storage                         │
│  - descontarStockPorPedido(itemsPedido)                      │
│  - novaprint_inventory (currentStock actualizado)            │
└──────────────────────────────┬───────────────────────────────┘
                               │
                     si faltan materiales
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                 Novaprint Compras (UI)                       │
│    #dialog-purchase con líneas precargadas de faltantes      │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Contratos de Funciones (Pure Functions en `assets/js/production.js`)

### `verificarDisponibilidadPrenda(inventario = [], itemPedido = {})`
- **Entrada:**
  - `inventario`: Array de ítems de inventario de `storage.getInventory()`.
  - `itemPedido`: `{ garmentType, color, size, quantity }`.
- **Salida:**
  ```javascript
  {
    encontrado: Boolean,
    itemInventario: Object | null,
    stockActual: Number,
    cantidadRequerida: Number,
    faltante: Number, // max(0, cantidadRequerida - stockActual)
    estado: 'suficiente' | 'faltante' | 'no_registrado'
  }
  ```

### `calcularFaltantesPedido(inventario = [], itemsPedido = [])`
- **Entrada:** Array de inventario y array de prendas del pedido.
- **Salida:**
  ```javascript
  {
    tieneFaltantes: Boolean,
    totalPrendasFaltantes: Number,
    detalle: Array<ResultadoVerificacion>,
    faltantesParaCompra: Array<{
      inventoryId: String,
      code: String,
      name: String,
      supplierId: String,
      supplierName: String,
      quantityNeeded: Number,
      unitCost: Number,
      subtotal: Number
    }>
  }
  ```

### `descontarInventarioPorPedido(inventario = [], itemsPedido = [])`
- **Entrada:** Array de inventario actual y array de prendas utilizadas en el pedido.
- **Salida:**
  ```javascript
  {
    nuevoInventario: Array<ItemInventario>,
    descontados: Array<{ id, code, cantidadDescontada, stockAnterior, nuevoStock }>,
    noEncontrados: Array<{ garmentType, color, size, quantity }>
  }
  ```

---

## 3. Persistencia en `assets/js/storage.js`
- Función `descontarStockPorPedido(itemsPedido = [])`:
  Ejecuta `prod.descontarInventarioPorPedido(getInventory(), itemsPedido)`, guarda el `nuevoInventario` en `novaprint_inventory` y retorna el resultado de los descuentos efectuados.

---

## 4. Componentes UI (`assets/js/ui.js` e `index.html`)
1. **Fila del Formulario de Pedido (`#order-items-tbody`):**
   - Agrega un indicador visual bajo la celda de prenda/color/talla con el badge de stock disponible y faltante en tiempo real al tipear cantidades o cambiar selects.
2. **Resumen de Faltantes en Pedido:**
   - Si el pedido tiene faltantes, se muestra una tarjeta de alerta con el botón `[ 🛒 Comprar Material Faltante ]`.
3. **Pre-llenado de Compra:**
   - La función `abrirModalCompraConFaltantes(faltantesParaCompra)` abre `#dialog-purchase` e inserta automáticamente las líneas de compra con los insumos y cantidades requeridas.
4. **Despacho a Taller con Descuento:**
   - En `enviarPedidoAFabricacion(orderId)`, se ejecuta `storage.descontarStockPorPedido(pedido.items)` y se notifica al usuario qué insumos fueron descontados de la bodega física.

