# Plan de Arquitectura y Diseño — Spec 047: Incorporación del Campo "Detalles" y Ampliación del Modal de Pedidos a max-w-7xl

## 1. Arquitectura y Módulos
- **`index.html`:**
  - `#dialog-order`: cambiar `max-w-6xl` por `max-w-7xl`.
  - En `<thead>` de `#order-items-table`, insertar `<th class="py-2 px-1 w-40">Detalles</th>` entre `Artículo` y `Color`.
- **`assets/js/ui.js`:**
  - En `renderTablaItemsFormulario()`, insertar celda `<td>` con `<input type="text" ...>` para `details`.
  - En `actualizarItemProp()`, gestionar `prop === 'details'`.
  - En `actualizarItemProp()` con `prop === 'inventoryCode'`, si existe `inv.name` y `item.details` está vacío o no personalizado, sugerir `item.details = inv.name`.
- **`assets/js/ticket.js`:**
  - En `generarTicketHTML()`, si `it.details` tiene contenido, formatearlo en la descripción de la prenda.

---

## 2. Detalle de Código

### A. `index.html`
```html
<dialog id="dialog-order" class="w-full max-w-7xl p-0 bg-transparent">
```
Cabecera:
```html
<tr class="bg-gray-100 border-b border-gray-200 text-gray-600 uppercase text-[10px] font-bold">
  <th class="py-2 pr-1 w-36">Cód. Inventario</th>
  <th class="py-2 px-1">Artículo</th>
  <th class="py-2 px-1 w-40">Detalles</th>
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
<td class="py-2 px-1">
  <input type="text" placeholder="Detalle (ej. Cuello V)" value="${it.details || ''}" class="w-40 p-1.5 border border-gray-300 rounded text-xs font-medium focus:bg-white" oninput="NovaprintUI.actualizarItemProp('${it.id}', 'details', this.value)" title="Detalles específicos de la prenda">
</td>
```

### C. `assets/js/ticket.js`
En el desglose de prendas:
```javascript
const detalleTexto = it.details ? ` (${it.details})` : '';
// Incluir detalleTexto junto a la prenda y atributos
```

---

## 3. Plan de Pruebas
- Crear `tests/order_details_field.test.js`:
  - Validar presencia de `max-w-7xl` y columna `Detalles`.
  - Validar que al escribir en el campo de detalles se persiste `item.details`.
  - Validar que al seleccionar un código de inventario se auto-completa el nombre del ítem en `details`.
  - Validar que `ticket.js` incluye `details` cuando está presente.
- Ejecutar suite completa `node --test tests/*.test.js` asegurando 100% de éxito.
