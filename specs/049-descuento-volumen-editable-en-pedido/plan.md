# Plan de Arquitectura e Implementación — Spec 049: Descuento por Volumen Visible y Editable en Pedidos

## 1. Arquitectura y Componentes Afectados

### A. Vista / DOM (`index.html`)
- **Contenedor:** En `#dialog-order`, sustituir el bloque estático/oculto de `#form-discount-container` por una tarjeta comercial visible y estilizada:
  ```html
  <!-- Descuento por Volumen Editable (Spec 049) -->
  <div class="mt-2 bg-emerald-50/70 border border-emerald-200 rounded-lg p-2 space-y-1.5" id="form-discount-box">
    <div class="flex items-center justify-between">
      <label class="flex items-center gap-1.5 text-[11px] font-bold text-emerald-900 cursor-pointer">
        <input id="form-apply-discount" type="checkbox" checked class="rounded text-emerald-600 cursor-pointer" onchange="NovaprintUI.recalcularTotalesFormulario()">
        <span>¿Aplica Descuento por Volumen?</span>
      </label>
      <span id="form-discount-badge" class="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-semibold">Sugerido Escala</span>
    </div>
    <div class="flex items-center justify-between gap-2 pt-1 border-t border-emerald-200/60 text-xs">
      <div class="flex items-center gap-1">
        <span class="text-[11px] font-bold text-gray-700">Porcentaje:</span>
        <input id="form-discount-percent-input" type="number" min="0" max="100" value="0" class="w-14 p-1 border border-emerald-300 bg-white rounded text-xs text-center font-bold text-emerald-700" oninput="NovaprintUI.recalcularTotalesFormulario(true)">
        <span class="text-xs font-bold text-emerald-700">%</span>
      </div>
      <div class="flex items-center gap-1 text-xs font-bold text-emerald-700">
        <span>Ahorro:</span>
        <span id="form-discount-amount">-$0</span>
      </div>
    </div>
  </div>
  ```

### B. Lógica de Cálculo Comercial (`assets/js/sales.js`)
- En `calcularTotalesPedido(items, montoAbono, opciones)`:
  - Soporta `opciones.porcentajeDescuentoManual`: si viene definido (número $\ge 0$), se utiliza directamente dicho porcentaje en lugar de calcularlo exclusivamente desde la escala de volumen.
  - Si no viene definido, se calcula mediante `calcularDescuentoVolumen(totalQuantity, subtotalBruto)`.
  - Si `aplicarDescuentoVolumen` es `false`, `volumeDiscountPercent = 0` y `volumeDiscountAmount = 0`.
  - Mantiene intacta la exportación de `totals.applyDiscount`, `totals.volumeDiscountPercent`, `totals.volumeDiscountAmount`, `totals.netAmount`.

### C. Controlador de Interfaz de Usuario (`assets/js/ui.js`)
- En `recalcularTotalesFormulario(esEdicionManual = false)`:
  - Leer el estado del checkbox `#form-apply-discount` (`aplicarDesc`).
  - Si no es edición manual de porcentaje y el vendedor no ha modificado deliberadamente el porcentaje:
    - Auto-sugerir el porcentaje según `sales.calcularDescuentoVolumen(totalQuantity, subtotalBruto)`.
    - Actualizar `#form-discount-percent-input.value`.
  - Leer el valor del input `#form-discount-percent-input` y pasarlo como `porcentajeDescuentoManual` a `sales.calcularTotalesPedido`.
  - Si el checkbox está desmarcado, deshabilitar visualmente o atenuar el input y mostrar ahorro `-$0`.
  - Si está marcado, mostrar el ahorro calculado `-$X.XXX`.
- En `abrirModalNuevoPedido()`:
  - Inicializar `#form-apply-discount.checked = true` y `#form-discount-percent-input.value = 0`.
- En `editarPedido(id)` y `duplicarPedido(id)`:
  - Restaurar `#form-apply-discount.checked = pedido.totals.applyDiscount`.
  - Restaurar `#form-discount-percent-input.value = pedido.totals.volumeDiscountPercent || 0`.

---

## 2. Pruebas Automatizadas (`tests/order_editable_volume_discount.test.js`)
- **Test 1:** `index.html` contiene el bloque `#form-discount-box`, checkbox `#form-apply-discount`, input `#form-discount-percent-input` y display `#form-discount-amount`.
- **Test 2:** `sales.calcularTotalesPedido` respeta un `porcentajeDescuentoManual` si se proporciona en las opciones cuando `aplicarDescuentoVolumen: true`.
- **Test 3:** `sales.calcularTotalesPedido` aplica $0 de descuento si `aplicarDescuentoVolumen: false`, aún si se provee un porcentaje manual.
- **Test 4:** Al editar el porcentaje en `ui.js`, los totales y el neto se recalculan en tiempo real.
- **Test 5:** Suite completa de 39+ pruebas pasa al 100% sin regresiones.
