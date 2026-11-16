# Plan de Arquitectura y Diseño — Spec 042: Enlace de Pedido con Código de Inventario

## 1. Arquitectura de Datos

### Estructura de cada Ítem en `order.items[]`
```javascript
{
  id: "item-12345",
  inventoryItemId: "INV-POL-AZU-M",  // ID del registro en novaprint_inventory (o null si es prenda nueva)
  inventoryCode: "POL-AZU-M",        // Código del artículo en inventario (o '' si es prenda nueva)
  garmentType: "Polera",             // Prenda
  color: "Azul",                     // Color
  size: "M",                         // Talla
  technique: "DTF",                  // Técnica de estampado
  printLocation: "Adelante",         // Ubicación
  quantity: 10,                      // Cantidad requerida
  unitPrice: 5000,                   // Precio unitario
  subtotal: 50000                    // Subtotal
}
```

---

## 2. Modificaciones por Módulo

### A. Estructura HTML (`index.html`)
- En la tabla de *"Detalle de Prendas & Técnicas"* dentro del modal `#dialog-order`:
  - Agregar `<th>Cód. Inventario</th>` como primera o segunda columna en `<thead>`.

### B. Interfaz de Usuario (`assets/js/ui.js`)
1. **Helper `generarOpcionesCodigoInventario(codigoSeleccionado)`:**
   - Lee `storage.getInventory()`, filtra artículos que sean prendas textiles o gorras.
   - Genera opciones con `<option value="">(Sin código / Prenda nueva)</option>` seguido de `<option value="[code]" data-id="[id]" data-garment="..." data-color="..." data-size="...">[code] — [name] (Stock: [stock])</option>`.
2. **`renderTablaItemsFormulario()`:**
   - Renderiza la celda `<td>` con el `<select class="w-36 ...">` para `inventoryCode`.
3. **Controlador `actualizarItemProp(itemId, prop, value)`:**
   - Si `prop === 'inventoryCode'`:
     - Si `value` tiene código, busca el artículo en inventario.
     - Sincroniza `item.inventoryCode = inv.code`, `item.inventoryItemId = inv.id`, `item.garmentType = inv.garmentType`, `item.color = inv.color`, `item.size = inv.size`.
     - Recalcula precio sugerido si no es manual y re-renderiza la tabla.
   - Si `prop` es `garmentType`, `color` o `size`:
     - Actualiza la propiedad.
     - Busca en el inventario si existe coincidencia exacta por prenda, color y talla.
     - Si existe: fija `item.inventoryCode = inv.code` e `item.inventoryItemId = inv.id`.
     - Si no existe: fija `item.inventoryCode = ''` e `item.inventoryItemId = null`.
4. **`guardarPedidoDesdeFormulario()`:**
   - Persiste `inventoryCode` e `inventoryItemId` en cada elemento del pedido.

### C. Lógica de Producción e Inventario (`assets/js/production.js`)
1. **`verificarDisponibilidadPrenda(inventario, itemPedido)`:**
   - Prioriza coincidencia: si `itemPedido.inventoryItemId`, busca por `inv.id === itemPedido.inventoryItemId`. Si no, si `itemPedido.inventoryCode`, busca por `inv.code === itemPedido.inventoryCode`.
   - Si no coincide o no tiene código, realiza la búsqueda tradicional por terna `garmentType + color + size`.
2. **`descontarInventarioPorPedido(inventario, itemsPedido, orderId)` y `restituirInventarioPorPedido(...)`:**
   - Aplica el mismo criterio de búsqueda prioritario por código/id para descontar exactamente el artículo vinculado.
3. **`calcularConsumoMateriales(pedidos, inventario, mesFiltro)`:**
   - Respeta el ID/código de inventario directo para acumular consumo y costos.

### D. Comprobantes Imprimibles (`assets/js/ticket.js`)
- En el renderizado de prendas en el ticket, si el ítem tiene `inventoryCode`, incluir `[${it.inventoryCode}]` junto al nombre.

---

## 3. Plan de Pruebas Unitarias (`tests/order_inventory_code_link.test.js`)
1. Generación de opciones de código de inventario con stock.
2. Auto-llenado de prenda, color y talla al seleccionar código.
3. Auto-selección de código al modificar prenda, color o talla.
4. Persistencia fiel de `inventoryCode` e `inventoryItemId` en el pedido.
5. Deducción exacta de stock en bodega priorizando el código enlazado.
6. Presentación del código entre corchetes en el ticket de taller.
7. Conservación del 100% de las 320 pruebas preexistentes.
