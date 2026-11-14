# Plan Técnico — Spec 038: Sub-vista de Material Usado en Producción: Inventarios

## 1. Arquitectura de Componentes y Flujo de Datos

### A. Módulo de Producción (`assets/js/production.js`)
Implementar la función de cálculo matemático y agregación:
```javascript
calcularConsumoMateriales(pedidos = [], inventario = [], mesFiltro = '')
```
- **Filtro de Pedidos:** Considera pedidos que no estén en estado `'Cancelado'`.
- **Extracción de Mes:** Emplea `normalizarMes(fecha)` (formato `YYYY-MM`). Si `mesFiltro` está vacío, utiliza el mes actual (`new Date().toISOString().slice(0, 7)`).
- **Procesamiento de Ítems de Pedido:**
  - Para cada ítem del pedido (`garmentType`, `color`, `size`, `quantity`):
    - Localiza en `inventario` el artículo correspondiente (usando `verificarDisponibilidadPrenda` o búsqueda normalizada por tipo/color/talla).
    - Costo unitario: `itemInventario ? itemInventario.unitCost : costoReferencia`.
    - Cantidad consumida: `quantity`.
    - Importe consumido: `quantity * costoUnitario`.
    - Si el mes del pedido coincide con `mesFiltro`, se suma a `usadoMes` y `costoMes`.
    - Siempre se suma a `usadoAcumulado` y `costoAcumulado`.
  - Para insumos de estampado asociados (si la técnica es DTF, serigrafía o vinilo y la ubicación no es "Ninguno"):
    - Si existe un insumo de estampado en el inventario que coincida, se computa su consumo en unidades e importe.
- **Retorno:**
  ```javascript
  {
    mesConsultado: '2026-11',
    resumen: {
      unidadesMes: Number,
      costoMes: Number,
      unidadesAcumulado: Number,
      costoAcumulado: Number,
      totalArticulosDiferentes: Number
    },
    items: [
      {
        id: String,
        code: String,
        name: String,
        category: String,
        unitCost: Number,
        currentStock: Number,
        usadoMes: Number,
        costoMes: Number,
        usadoAcumulado: Number,
        costoAcumulado: Number
      }
    ]
  }
  ```

---

## 2. Modificaciones en Interfaz (`index.html`)

Dentro de `<section id="view-inventory">`:
1. **Barra de Sub-Navegación Horizontal (`#inv-subnav-container`):**
   ```html
   <div id="inv-subnav-container" class="bg-white p-2 rounded-xl border border-gray-200 shadow-xs flex flex-wrap gap-2 items-center">
     <button id="btn-inv-sub-stock" type="button" class="px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 text-white shadow-xs transition" onclick="NovaprintUI.cambiarSubVistaInventario('stock')">
       📦 Catálogo & Stock Actual
     </button>
     <button id="btn-inv-sub-usage" type="button" class="px-4 py-2 rounded-lg text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition" onclick="NovaprintUI.cambiarSubVistaInventario('usage')">
       📉 Material Usado / Consumo
     </button>
   </div>
   ```
2. **Contenedor Sub-vista 1: Catálogo y Stock Actual (`#inv-subview-stock`):**
   Envuelve las métricas actuales, barra de búsqueda y tabla de inventario existente.
3. **Contenedor Sub-vista 2: Material Usado (`#inv-subview-usage`, `class="hidden space-y-6"`):**
   - **Métricas de Consumo:**
     - Tarjeta 1: `Unidades Usadas (Mes)` (`#inv-usage-metric-units-month`).
     - Tarjeta 2: `Valorización Consumo (Mes)` (`#inv-usage-metric-cost-month`).
     - Tarjeta 3: `Total Unidades (Acumulado)` (`#inv-usage-metric-units-total`).
     - Tarjeta 4: `Valorización Total (Acumulado)` (`#inv-usage-metric-cost-total`).
   - **Barra de Filtros:**
     - Selector de mes: `<input type="month" id="inv-usage-filter-month" onchange="NovaprintUI.filtrarMaterialUsado()">`.
     - Buscador de material: `<input type="text" id="inv-usage-search-input" placeholder="Buscar material o prenda...">`.
     - Botón `[Mes Actual]` y `[Todos los Meses]`.
   - **Tabla Desglosada:**
     - Columnas: Código, Artículo / Detalle, Stock Bodega, Usado en el Mes (un.), Costo Mes ($), Total Acumulado (un.), Costo Acumulado ($).
     - `#inv-usage-table-body`.

---

## 3. Modificaciones en Controladores (`assets/js/ui.js` y `assets/js/main.js`)
- `cambiarSubVistaInventario(subview)`: alterna clases activas/inactivas entre `#btn-inv-sub-stock` y `#btn-inv-sub-usage`, y visibilidad de `#inv-subview-stock` e `#inv-subview-usage`.
- `renderInventoryUsage(consumoData)`: renderiza métricas y filas de la tabla de consumo.
- `filtrarMaterialUsado()`: lee el mes seleccionado y re-renderiza la tabla.
- Exportar `cambiarSubVistaInventario`, `renderInventoryUsage` y `filtrarMaterialUsado` en `NovaprintUI`.
- Enlazar en `main.js:refrescarInventario()` para mantener sincronizada la vista de consumo.

---

## 4. Plan de Pruebas Automatizadas
Crear `tests/inventory_material_usage.test.js`:
1. `production.calcularConsumoMateriales`:
   - Agrupa correctamente el consumo de pedidos por mes y el total acumulado.
   - Maneja pedidos sin inventario previo asignando costos base de referencia.
   - Excluye pedidos cancelados.
2. Renderizado en UI:
   - Verifica existencia de la barra `#inv-subnav-container` y los botones.
   - Verifica renderizado de métricas y filas de material usado.
3. Suite completa: Ejecutar las 30 suites existentes para garantizar 0 regresiones.

