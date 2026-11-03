# Plan de Implementación — Spec 005: IVA y Delivery en Pedidos y Compras

## 1. Contratos de Funciones Matemáticas

### A. Módulo de Ventas (`assets/js/sales.js`)
- **Tasa:** `TASA_IVA_CHILE = 0.19;`
- **Firma extendida de `calcularTotalesPedido`:**
  ```javascript
  calcularTotalesPedido(items = [], montoAbono = 0, opciones = {})
  ```
  - `opciones`:
    - `aplicarDescuentoVolumen`: Boolean (default: true)
    - `aplicarIva`: Boolean (default: false)
    - `montoDelivery`: Number (default: 0)
  - **Retorno:**
    ```javascript
    {
      totalQuantity: Number,
      subtotalBruto: Number,
      volumeDiscountPercent: Number,
      volumeDiscountAmount: Number,
      netAmount: Number, // subtotalBruto - volumeDiscountAmount
      applyIva: Boolean,
      ivaPercent: 19,
      ivaAmount: Number, // round(netAmount * 0.19) si applyIva === true
      applyDelivery: Boolean,
      deliveryAmount: Number, // montoDelivery >= 0
      totalAmount: Number, // netAmount + ivaAmount + deliveryAmount
      depositAmount: Number,
      balanceAmount: Number,
      paymentStatus: 'Pendiente' | 'Abonado' | 'Pagado Total'
    }
    ```

### B. Módulo de Producción (`assets/js/production.js`)
- **Firma de `calcularTotalesCompra`:**
  ```javascript
  calcularTotalesCompra(items = [], opciones = {})
  ```
  - `opciones`:
    - `aplicarIva`: Boolean (default: false)
    - `montoDelivery`: Number (default: 0)
  - **Retorno:**
    ```javascript
    {
      totalUnidades: Number,
      subtotalNeto: Number,
      applyIva: Boolean,
      ivaPercent: 19,
      ivaAmount: Number,
      applyDelivery: Boolean,
      deliveryAmount: Number,
      totalAmount: Number // subtotalNeto + ivaAmount + deliveryAmount
    }
    ```

---

## 2. Cambios en la Persistencia (`assets/js/storage.js`)
- `saveOrder`: persiste el objeto `totals` completo con los campos `applyIva`, `ivaAmount`, `applyDelivery`, `deliveryAmount`.
- `savePurchase`: persiste `subtotalNeto`, `applyIva`, `ivaAmount`, `applyDelivery`, `deliveryAmount`, `totalAmount`.

---

## 3. Cambios en Interfaz de Usuario (`index.html` y `assets/js/ui.js`)
1. **Modal de Pedido (`#dialog-order`):**
   - Casilla `[ ] ¿Aplica IVA (19%)?`
   - Casilla `[ ] ¿Aplica Delivery / Envío?` con input numérico (default: 0).
   - Desglose dinámico en vivo en la tarjeta financiera:
     - `Prendas Totales: X un.`
     - `Subtotal: $S`
     - `Desc. Volumen (si aplica)`
     - `Neto: $N`
     - `IVA (19%): +$I` (si aplica)
     - `Delivery: +$D` (si aplica)
     - `TOTAL A PAGAR: $T`
     - `Abono y Saldo`
2. **Modal de Compra (`#dialog-purchase`):**
   - Casilla `[ ] ¿Factura con IVA (19%)?`
   - Casilla `[ ] ¿Aplica Flete / Delivery?` con input numérico (default: 0).
   - Desglose en vivo de `Subtotal Neto`, `IVA (19%)`, `Delivery / Flete` y `Total Compra`.
3. **Tickets y WhatsApp (`assets/js/ticket.js` y `assets/js/sales.js`):**
   - Desglose explícito de Neto, IVA (19%) y Delivery en el ticket físico y en el mensaje de WhatsApp.

