# Plan de Arquitectura y Diseño — Spec 046: Ampliación del Modal de Pedidos y Disposición Horizontal de Cód. Inventario y Artículo

## 1. Arquitectura y Enfoque
Ajustes en la capa de presentación del modal de pedidos:
- **`index.html`:**
  - Ampliar `#dialog-order` de `max-w-4xl` a `max-w-6xl`.
  - Reestructurar el `<thead>` de `#dialog-order` para tener 10 columnas horizontales independientes:
    `Cód. Inventario`, `Artículo`, `Color`, `Talla`, `Técnica`, `Estampado`, `Cant.`, `P. Unit`, `Subtotal`, `Acciones`.
- **`assets/js/ui.js`:**
  - En `renderTablaItemsFormulario()`:
    - Celda 1 (`<td>`): Selector `<select>` de `Cód. Inventario` (`w-36`).
    - Celda 2 (`<td>`): Selector `<select>` de `garmentType` y `<div id="badge-stock-${it.id}">` en bloque horizontal limpio.
    - Celdas 3 a 10: Color, Talla, Técnica, Estampado, Cantidad, P. Unit, Subtotal, Acciones.

---

## 2. Detalle de Código

### A. `index.html`
```html
<dialog id="dialog-order" class="w-full max-w-6xl p-0 bg-transparent">
```
Cabecera de tabla:
```html
<tr class="bg-gray-100 border-b border-gray-200 text-gray-600 uppercase text-[10px] font-bold">
  <th class="py-2 pr-1 w-36">Cód. Inventario</th>
  <th class="py-2 px-1">Artículo</th>
  <th class="py-2 px-1">Color</th>
  <th class="py-2 px-1 w-14 text-center">Talla</th>
  <th class="py-2 px-1 w-28">Técnica</th>
  <th class="py-2 px-1">Estampado</th>
  <th class="py-2 px-1 w-12 text-center">Cant.</th>
  <th class="py-2 px-1 text-right w-20">P. Unit</th>
  <th class="py-2 px-1 text-right">Subtotal</th>
  <th class="py-2 pl-1 text-center"></th>
</tr>
```

### B. `assets/js/ui.js`
```html
<tr class="border-b border-gray-200 text-xs">
  <td class="py-2 pr-1">
    <select class="w-36 p-1.5 border border-gray-300 rounded font-bold text-gray-800 text-[11px] bg-slate-50 focus:bg-white" onchange="NovaprintUI.actualizarItemProp('${it.id}', 'inventoryCode', this.value)" title="Código de Inventario">
      ${generarOpcionesCodigoInventario(it.inventoryCode)}
    </select>
  </td>
  <td class="py-2 px-1">
    <select class="w-full p-1.5 border border-gray-300 rounded font-semibold text-gray-800" onchange="NovaprintUI.actualizarItemProp('${it.id}', 'garmentType', this.value)" title="Artículo">
      <option value="Polera" ${it.garmentType === 'Polera' ? 'selected' : ''}>Polera</option>
      <option value="Polerón" ${it.garmentType === 'Polerón' ? 'selected' : ''}>Polerón</option>
      <option value="Buzo" ${it.garmentType === 'Buzo' ? 'selected' : ''}>Buzo</option>
      <option value="Gorra" ${it.garmentType === 'Gorra' ? 'selected' : ''}>Gorra</option>
      <option value="Otro" ${it.garmentType === 'Otro' ? 'selected' : ''}>Otro</option>
    </select>
    <div id="badge-stock-${it.id}" class="mt-1">${obtenerBadgeStockHtml(it)}</div>
  </td>
  <td class="py-2 px-1">
  ...
```

---

## 3. Pruebas y Verificación
- Actualizar y ejecutar `tests/order_item_details_layout.test.js` para comprobar:
  - Clase `max-w-6xl` en `#dialog-order`.
  - Cabeceras `Cód. Inventario` y `Artículo` presentes.
  - Celdas separadas en la misma fila horizontal.
- Ejecutar la suite completa `node --test tests/*.test.js` asegurando 100% de éxito.
