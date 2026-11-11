# Plan de Implementación — Spec 034: Edición de Costo y Cantidad al Separar Compra en 2 Facturas

## Arquitectura de Solución

### 1. Interfaz de Usuario y Renderizado (`assets/js/ui.js`)
1. **Modificación de `abrirModalSepararCompra()`:**
   - En el renderizado de `split-items-poleras-tbody` y `split-items-dtf-tbody`:
     - Reemplazar el texto estático de cantidad por `<input type="number" min="1" step="1" value="${it.quantity}" class="w-16 p-1 bg-white border border-gray-300 rounded text-center text-xs font-bold text-gray-900 focus:outline-none focus:border-blue-500" oninput="NovaprintUI.actualizarItemSplit('poleras', ${index}, 'quantity', this.value)">`.
     - Reemplazar el texto estático de costo unitario por `<input type="number" min="0" step="any" value="${it.unitCost}" class="w-20 p-1 bg-white border border-gray-300 rounded text-right text-xs font-medium text-gray-800 focus:outline-none focus:border-blue-500" oninput="NovaprintUI.actualizarItemSplit('poleras', ${index}, 'unitCost', this.value)">`.
     - Identificar la celda de subtotal de cada fila con ID o selector para actualización reactiva en vivo (`split-subtotal-poleras-${index}` y `split-subtotal-dtf-${index}`).
2. **Nueva función controladora `actualizarItemSplit(tipo, index, campo, valor)` en `ui.js`:**
   - Validar el tipo (`'poleras'` o `'dtf'`).
   - Obtener el ítem en `currentSplitState.itemsPoleras[index]` o `currentSplitState.itemsDtf[index]`.
   - Si `campo === 'quantity'`: asignar `it.quantity = Math.max(1, Number(valor) || 1)`.
   - Si `campo === 'unitCost'`: asignar `it.unitCost = Math.max(0, Number(valor) || 0)`.
   - Actualizar el subtotal del ítem `it.subtotal = it.quantity * it.unitCost`.
   - Actualizar el texto en la celda de subtotal de la fila (`sales.formatearMoneda(it.subtotal)`).
   - Recalcular contadores de badges (`split-badge-count-poleras` y `split-badge-count-dtf`).
   - Invocar `recalcularTotalesSeparacion()` para actualizar los totales de ambas facturas (neto, IVA 19%, delivery y gran total).
3. **Exportación en `NovaprintUI`:**
   - Exponer `actualizarItemSplit` en `uiModule` y en `global.NovaprintUI`.

### 2. Flujo de Confirmación y Persistencia (`confirmarSeparacionCompra` en `ui.js`)
- `confirmarSeparacionCompra` ya lee `currentSplitState.itemsPoleras` y `currentSplitState.itemsDtf` con sus cantidades y costos unitarios mapeados.
- Al permitir la mutación reactiva de estos arreglos en tiempo real, `confirmarSeparacionCompra` enviará automáticamente los valores editados hacia `storage.separarCompraEnDos(compraOriginalId, datosPoleras, datosDtf)`.

### 3. Pruebas Automatizadas
- Crear `tests/split_purchase_edit_items.test.js`:
  - Verificar que `abrirModalSepararCompra` genera los campos `<input>` de cantidad y costo.
  - Verificar que `actualizarItemSplit` muta adecuadamente las cantidades y costos en `currentSplitState`.
  - Verificar el recálculo reactivo de subtotales, totales de factura y gran total consolidado.
  - Verificar que `confirmarSeparacionCompra` persiste las compras con las cantidades y costos modificados.
  - Ejecutar suite global `node --test tests/*.test.js` y certificar 100% de pruebas aprobadas.

### 4. Documentación y Cierre
- Actualizar `memory.md` (Sección 2 y Sección 3).
- Completar `tasks.md`.
- Commit y push a `main`.

