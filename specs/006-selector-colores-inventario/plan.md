# Plan de Implementación — Spec 006: Selector de Colores en Inventario

## 1. Diseño de Interfaz (`index.html`)
- En el modal nativo `#dialog-inventory`:
  - Reemplazar:
    ```html
    <div>
      <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Color</label>
      <input id="inventory-color-input" type="text" placeholder="Negro" class="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-xs focus:outline-none focus:bg-white">
    </div>
    ```
  - Por:
    ```html
    <div>
      <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Color</label>
      <select id="inventory-color-select" class="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-medium focus:outline-none focus:bg-white" onchange="NovaprintUI.manejarCambioColorInventario(this.value)">
      </select>
    </div>
    ```

---

## 2. Lógica de Componentes (`assets/js/ui.js`)
1. **Reutilización de la función generadora:**
   - Aprovechar la función pura existente `generarOpcionesColor(colorActual = 'Negro')` que consulta `NovaprintSales.COLORES_TEXTILES` y retorna los `<option>` correspondientes.
2. **Nueva función de manejo interactivo:**
   ```javascript
   function manejarCambioColorInventario(valor) {
     const selectEl = document.getElementById('inventory-color-select');
     if (valor === 'Otro') {
       const personalizado = prompt('Especifica el color de la prenda / insumo:');
       if (personalizado && personalizado.trim()) {
         const colorLimpio = personalizado.trim();
         selectEl.innerHTML = `<option value="${colorLimpio}" selected>${colorLimpio}</option>` + generarOpcionesColor(colorLimpio);
         selectEl.value = colorLimpio;
       } else {
         selectEl.value = 'Negro';
       }
     }
   }
   ```
3. **Poblado en Apertura y Edición:**
   - En `abrirModalNuevoItemInventario()`:
     ```javascript
     const colorSelect = document.getElementById('inventory-color-select');
     if (colorSelect) colorSelect.innerHTML = generarOpcionesColor('Negro');
     ```
   - En `editarItemInventario(itemId)`:
     ```javascript
     const colorSelect = document.getElementById('inventory-color-select');
     if (colorSelect) colorSelect.innerHTML = generarOpcionesColor(it.color || 'Negro');
     ```
4. **Lectura y Guardado:**
   - En `guardarItemInventarioDesdeFormulario()`:
     ```javascript
     const color = (document.getElementById('inventory-color-select')?.value || 'Negro').trim();
     ```
5. **Exportación:**
   - Agregar `manejarCambioColorInventario` al objeto `uiModule`.

---

## 3. Pruebas Automatizadas
- En `tests/sales.test.js` o `tests/storage.test.js`:
  - Verificar que `saveInventoryItem` y `getInventory` persisten colores del catálogo estándar y colores personalizados correctamente.
  - Verificar que `COLORES_TEXTILES` contiene todos los colores estándar necesarios.

