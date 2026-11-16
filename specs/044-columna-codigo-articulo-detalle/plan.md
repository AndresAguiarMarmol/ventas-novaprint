# Plan de Arquitectura y Diseño — Spec 044: Fusión Vertical de "Cód. Inventario" y "Artículo/Detalle" en Detalle de Prendas

## 1. Arquitectura y Enfoque
Esta intervención refactoriza la estructura de columnas de la tabla de prendas en el modal de pedidos:
- **`index.html`:** En el `<thead>` de `#dialog-order`, unificar las dos columnas iniciales en `<th class="py-2 px-1 min-w-[160px]">Cód. Inventario / Artículo</th>`.
- **`assets/js/ui.js`:** En `renderTablaItemsFormulario()`, generar una sola celda `<td>` inicial que contiene el selector de código arriba (`w-full`) y el selector de prenda (`garmentType`) con el `badge-stock-${it.id}` abajo.

---

## 2. Detalle de Cambios en Código

### A. `index.html` — Cabecera de Tabla
```html
<tr class="bg-gray-100 border-b border-gray-200 text-gray-600 uppercase text-[10px] font-bold">
  <th class="py-2 px-1 min-w-[160px]">Cód. Inventario / Artículo</th>
  <th class="py-2 px-1">Color</th>
  <th class="py-2 px-1 w-14 text-center">Talla</th>
  <th class="py-2 px-1 w-28">Técnica</th>
  <th class="py-2 px-1">Estampado</th>
  <th class="py-2 px-1 w-12 text-center">Cant.</th>
  <th class="py-2 px-1 text-right">P. Unit</th>
  <th class="py-2 px-1 text-right">Subtotal</th>
  <th class="py-2 pl-1 text-center"></th>
</tr>
```

### B. `assets/js/ui.js` — Celda Unificada
```html
<td class="py-2 px-1 min-w-[160px] space-y-1">
  <select class="w-full p-1.5 border border-gray-300 rounded font-bold text-gray-800 text-[11px] bg-slate-50 focus:bg-white" onchange="NovaprintUI.actualizarItemProp('${it.id}', 'inventoryCode', this.value)" title="Código de Inventario">
    ${generarOpcionesCodigoInventario(it.inventoryCode)}
  </select>
  <div class="flex items-center gap-1.5">
    <select class="flex-1 p-1 border border-gray-300 rounded font-semibold text-gray-800 text-xs bg-white" onchange="NovaprintUI.actualizarItemProp('${it.id}', 'garmentType', this.value)" title="Artículo / Tipo de Prenda">
      <option value="Polera" ${it.garmentType === 'Polera' ? 'selected' : ''}>Polera</option>
      <option value="Polerón" ${it.garmentType === 'Polerón' ? 'selected' : ''}>Polerón</option>
      <option value="Buzo" ${it.garmentType === 'Buzo' ? 'selected' : ''}>Buzo</option>
      <option value="Gorra" ${it.garmentType === 'Gorra' ? 'selected' : ''}>Gorra</option>
      <option value="Otro" ${it.garmentType === 'Otro' ? 'selected' : ''}>Otro</option>
    </select>
    <span id="badge-stock-${it.id}" class="shrink-0">${obtenerBadgeStockHtml(it)}</span>
  </div>
</td>
```

---

## 3. Pruebas y Verificación
- Crear `tests/order_item_details_layout.test.js`:
  - Verificar presencia de la cabecera `Cód. Inventario / Artículo` con `min-w-[160px]`.
  - Verificar que el `<td>` renderiza verticalmente ambos selectores y el badge de stock.
  - Verificar que la sincronización bidireccional de la Spec 042 sigue operando sin alteraciones.
- Ejecutar suite completa `node --test tests/*.test.js` (36 suites) asegurando 100% de aprobación.
