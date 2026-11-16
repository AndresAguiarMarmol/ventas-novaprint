# Plan de Arquitectura y Diseño — Spec 043: Optimización y Ajuste de Anchos en "Detalle de Prendas & Técnicas"

## 1. Arquitectura y Enfoque
Este desarrollo interviene la capa de presentación de la interfaz de usuario:
- **`index.html`:** Cabeceras de columna `<th>` de `#dialog-order`.
- **`assets/js/ui.js`:** Función `renderTablaItemsFormulario()` y control de eventos de entrada en `actualizarItemProp()`.

No requiere cambios en `storage.js`, `sales.js`, `production.js`, `accounting.js` ni `ticket.js`.

---

## 2. Cambios en Detalle

### A. `index.html` — Cabeceras de Tabla `#dialog-order`
Líneas ~1241-1252:
```html
<tr class="bg-gray-100 border-b border-gray-200 text-gray-600 uppercase text-[10px] font-bold">
  <th class="py-2 pr-1 w-36">Cód. Inventario</th>
  <th class="py-2 px-1">Prenda</th>
  <th class="py-2 px-1 w-28">Color</th>
  <th class="py-2 px-1 w-14 text-center">Talla</th>
  <th class="py-2 px-1 w-28">Técnica</th>
  <th class="py-2 px-1 w-32">Estampado</th>
  <th class="py-2 px-1 w-12 text-center">Cant.</th>
  <th class="py-2 px-1 text-right">P. Unit</th>
  <th class="py-2 px-1 text-right">Subtotal</th>
  <th class="py-2 pl-1 text-center"></th>
</tr>
```

### B. `assets/js/ui.js` — Celdas en `renderTablaItemsFormulario()`
- **Talla:**
  ```html
  <td class="py-2 px-1 text-center">
    <select class="w-14 px-1 py-1.5 border border-gray-300 rounded font-medium text-center text-xs" onchange="NovaprintUI.actualizarItemProp('${it.id}', 'size', this.value)">
      ${generarOpcionesTalla(it.size)}
    </select>
  </td>
  ```
- **Técnica:**
  ```html
  <td class="py-2 px-1">
    <select class="w-28 p-1.5 border border-gray-300 rounded font-semibold text-blue-700 text-[11px]" onchange="NovaprintUI.actualizarItemProp('${it.id}', 'technique', this.value)">
      ...
    </select>
  </td>
  ```
- **Cantidad:**
  ```html
  <td class="py-2 px-1 text-center">
    <input type="number" min="1" max="999" value="${it.quantity}" class="w-12 p-1 border border-gray-300 rounded text-center font-bold text-xs" oninput="NovaprintUI.actualizarItemProp('${it.id}', 'quantity', this.value)">
  </td>
  ```
- **Validación en `actualizarItemProp` (para prop === 'quantity'):**
  ```javascript
  if (prop === 'quantity') {
    let parsed = parseInt(value, 10) || 0;
    if (parsed > 999) parsed = 999;
    item.quantity = Math.max(0, parsed);
  }
  ```

---

## 3. Plan de Verificación y Pruebas
1. Crear `tests/order_items_dimensions.test.js` para comprobar:
   - Clases `w-14` en Talla y `th` correspondiente.
   - Clases `w-28` en Técnica y `th` correspondiente.
   - Clases `w-12`, `min="1"`, `max="999"` en Cantidad y `th` correspondiente.
   - Limitación máxima a 999 en `actualizarItemProp`.
2. Ejecutar la suite completa `node --test tests/*.test.js` para asegurar 0 regresiones.
