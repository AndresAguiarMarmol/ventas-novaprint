# Plan de Arquitectura y Diseño — Spec 041: Descuento Automático de Inventario al Terminar Pedido

## 1. Arquitectura de Datos y Entidades

### Estructura del Pedido en `novaprint_orders`
Se amplía el modelo de pedidos con atributos de control de existencias:
```javascript
{
  id: "NP-20261111-002",
  clientId: "CLI-...",
  items: [
    { garmentType: "Polerón", color: "Azul", size: "XL", quantity: 15, unitPrice: 15000 }
  ],
  status: "Listo para entrega", // o "Entregado"
  stockDeducted: true, // boolean que indica si las prendas ya fueron rebajadas de bodega
  stockDeductedAt: "2026-11-15T18:00:00.000Z", // Timestamp del descuento
  // ... demás propiedades existentes
}
```

---

## 2. Cambios por Módulo

### A. Módulo de Producción (`assets/js/production.js`)
1. **Mejorar `descontarInventarioPorPedido(inventario, itemsPedido, orderId)`:**
   - Asegurar coincidencia robusta por terna `garmentType`, `color`, `size` normalizada.
   - Si un artículo no existe en inventario, registrar el caso o auto-crearlo con stock 0 si aplica para que no quede huérfano.
   - Devolver la lista de artículos modificados con `previousStock`, `nuevoStock` y `cantidadDescontada`.
2. **Implementar `restituirInventarioPorPedido(inventario, itemsPedido, orderId)`:**
   - Permite reintegrar el stock cuando un pedido pasa a `'Cancelado'`.
   - Suma `currentStock + cantidad` y genera el registro en `lastStockAdjustment` con motivo `"Restitución por Cancelación Pedido [ID]"`.

### B. Módulo de Persistencia (`assets/js/storage.js`)
1. **Actualizar `updateOrderStatus(id, newStatus)`:**
   - Detectar si `newStatus` es un estado de culminación (`'Listo para entrega'`, `'Entregado'` o `'En producción'`).
   - Si `!orders[idx].stockDeducted`:
     - Invocar `descontarStockPorPedido(orders[idx].items, orders[idx].id)`.
     - Marcar `orders[idx].stockDeducted = true` y `orders[idx].stockDeductedAt = new Date().toISOString()`.
   - Si `newStatus === 'Cancelado'` y `orders[idx].stockDeducted === true`:
     - Invocar `restituirStockPorPedido(orders[idx].items, orders[idx].id)`.
     - Marcar `orders[idx].stockDeducted = false`.
     - Borrar o actualizar `orders[idx].stockDeductedAt`.
2. **Implementar `restituirStockPorPedido(itemsPedido = [], orderId = '')`:**
   - Función simétrica a `descontarStockPorPedido`.
3. **Implementar `reconciliarDescuentosPedidosTerminados()`:**
   - Revisa todos los pedidos en `novaprint_orders`.
   - Si un pedido tiene `status === 'Listo para entrega'` o `status === 'Entregado'` y `!pedido.stockDeducted`:
     - Descuenta el stock de sus prendas en bodega.
     - Marca `pedido.stockDeducted = true`.
   - Persiste y retorna el recuento de pedidos reconciliados y artículos afectados.

### C. Módulo de Interfaz (`assets/js/ui.js`)
1. En `avanzarEtapaProyecto(projectId)`:
   - Al llegar a `'Terminado'`, ya llama a `storage.updateOrderStatus(prj.orderId, 'Listo para entrega')`, el cual detonará automáticamente el descuento.
2. En `enviarPedidoAFabricacion(orderId)`:
   - Marcar `pedido.stockDeducted = true` para evitar que se descuente una segunda vez cuando el pedido pase a `'Listo para entrega'`.
3. Notificaciones Toast:
   - Informar al usuario en el toast cuando se rebajen existencias de bodega.

### D. Orquestador Principal (`assets/js/main.js`)
1. En `init()`:
   - Ejecutar `storage.reconciliarDescuentosPedidosTerminados()` para procesar retroactivamente órdenes como `NP-20261111-002` que ya se encontraban terminadas.

---

## 3. Plan de Pruebas Unitarias (`tests/inventory_order_deduction.test.js`)
1. Descuento automático al actualizar estado a `'Listo para entrega'`.
2. Descuento automático al actualizar estado a `'Entregado'`.
3. Idempotencia: no volver a descontar al pasar de `'Listo para entrega'` a `'Entregado'`.
4. Restitución al cancelar un pedido que tenía `stockDeducted = true`.
5. Ejecución de `reconciliarDescuentosPedidosTerminados()` sobre `NP-20261111-002`.
6. Preservación del 100% de las 313 pruebas existentes.
