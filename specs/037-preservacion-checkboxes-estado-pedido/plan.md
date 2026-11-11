# Plan Técnico — Spec 037: Preservación de Checkboxes (Desc. Volumen, IVA, Delivery)

## 1. Modificaciones en el Flujo de Datos

### A. Módulo de Ventas (`assets/js/sales.js`)
En `calcularTotalesPedido(items = [], montoAbono = 0, opciones = {})`:
Incluir explícitamente en el objeto retornado la propiedad `applyDiscount`:
```javascript
applyDiscount: Boolean(aplicarDescuentoVolumen),
```
Tanto en el caso base (cuando no hay ítems) como en el cálculo completo.

### B. Módulo de UI (`assets/js/ui.js`)
1. **En `editarPedido(orderId)`:**
   - Cargar `#form-apply-discount`:
     ```javascript
     const checkDesc = document.getElementById('form-apply-discount');
     if (checkDesc) {
       if (pedido.totals && typeof pedido.totals.applyDiscount === 'boolean') {
         checkDesc.checked = pedido.totals.applyDiscount;
       } else {
         // Retrocompatibilidad con pedidos anteriores
         checkDesc.checked = Boolean(pedido.totals?.volumeDiscountAmount > 0 || (pedido.totals?.volumeDiscountPercent > 0 && pedido.totals?.subtotalBruto > 0));
       }
     }
     ```
   - Cargar `#order-apply-iva`: (ya implementado, asegurar robustez)
     ```javascript
     const checkIva = document.getElementById('order-apply-iva');
     if (checkIva) checkIva.checked = Boolean(pedido.totals?.applyIva);
     ```
   - Cargar `#order-apply-delivery`: (ya implementado, asegurar robustez)
     ```javascript
     const checkDeliv = document.getElementById('order-apply-delivery');
     const inputDeliv = document.getElementById('order-delivery-input');
     const contDeliv = document.getElementById('order-delivery-input-container');
     const hasDelivery = Boolean(pedido.totals?.applyDelivery || (pedido.totals?.deliveryAmount > 0));
     if (checkDeliv) checkDeliv.checked = hasDelivery;
     if (inputDeliv) inputDeliv.value = pedido.totals?.deliveryAmount || 0;
     ```

2. **En `duplicarPedido(orderId)`:**
   - Aplicar la misma lógica para que el pedido clonado mantenga los tres checkboxes tal como estaban en el pedido original.

3. **En `storage.updateOrderStatus(id, newStatus)` y `NovaprintUI.cambiarEstado` / `seleccionarNuevoEstado`:**
   - Verificar y asegurar que la mutación de estado únicamente altere `status`, `updatedAt` y `deliveredAt`, dejando el objeto `totals` inmutable con sus 3 checkboxes y montos intactos.

---

## 2. Plan de Pruebas Automatizadas
Crear `tests/order_checkboxes_preservation.test.js` para comprobar:
1. `sales.calcularTotalesPedido` exporta `applyDiscount` (tanto cuando es `true` como cuando es `false`).
2. `ui.editarPedido` restaura correctamente los checkboxes `#form-apply-discount`, `#order-apply-iva` y `#order-apply-delivery` según los datos del pedido.
3. `ui.duplicarPedido` clona fielmente los 3 checkboxes.
4. `NovaprintUI.cambiarEstado` y `storage.updateOrderStatus` preservan íntegramente `totals.applyDiscount`, `totals.applyIva`, `totals.applyDelivery` y los importes sin alterarlos.
5. Ejecución completa de suites existentes para 0 regresiones.

