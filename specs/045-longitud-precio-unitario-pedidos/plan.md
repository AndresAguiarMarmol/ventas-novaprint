# Plan de Arquitectura y Diseño — Spec 045: Calibración y Longitud del Campo P. Unitario a 7 Caracteres en Pedidos

## 1. Arquitectura y Enfoque
Ajuste en la capa de presentación y validación del formulario de pedidos:
- **`index.html`:** En `#dialog-order`, cabecera `<th>` para `P. Unit` con ancho fijo `w-20`.
- **`assets/js/ui.js`:** En `renderTablaItemsFormulario()`, input de precio unitario con `w-20 px-2 py-1`, `min="0"`, `max="9999999"`, y límite superior en `actualizarItemProp()`.

---

## 2. Detalle de Cambios en Código

### A. `index.html` — Cabecera de Tabla
```html
<th class="py-2 px-1 text-right w-20">P. Unit</th>
```

### B. `assets/js/ui.js` — Celda de Precio Unitario
```html
<td class="py-2 px-1">
  <input id="input-price-${it.id}" type="number" step="any" min="0" max="9999999" value="${it.unitPrice ?? 0}" placeholder="0" class="w-20 px-2 py-1 border border-gray-300 rounded text-right font-medium focus:bg-white text-xs" oninput="NovaprintUI.actualizarItemProp('${it.id}', 'unitPrice', this.value)">
</td>
```

### C. `assets/js/ui.js` — Función `actualizarItemProp`
```javascript
} else if (prop === 'unitPrice') {
  const parsed = Number(value) || 0;
  item.unitPrice = Math.min(9999999, Math.max(0, parsed));
  item._manualPrice = true;
}
```

---

## 3. Pruebas y Verificación
- Crear `tests/order_unit_price_dimension.test.js`:
  - Verificar presencia de `<th class="py-2 px-1 text-right w-20">P. Unit</th>` en `index.html`.
  - Verificar que el input renderizado en `ui.js` tiene clase `w-20`, `max="9999999"` y `min="0"`.
  - Verificar que `actualizarItemProp` limita importes a un máximo de 9999999 y no permite valores negativos.
- Ejecutar la suite completa `node --test tests/*.test.js` asegurando 100% de éxito.
