# Spec 038 — Sub-vista de Material de Inventario Usado (Mensual y Acumulado) en Producción: Inventarios

## 1. Contexto y Problema
En el módulo **"Producción: Inventarios"** (`#view-inventory`), los operadores y administradores gestionan las existencias físicas de prendas lisas, gorras, insumos DTF y accesorios.
Actualmente, la vista presenta las métricas de bodega (Artículos Registrados, Unidades en Stock, Stock Crítico y Valorización de Stock) y la tabla de catálogo con saldos actuales de inventario.

Sin embargo, el taller no dispone de una vista consolidada que permita monitorear el **consumo de materiales e insumos utilizados en la producción de pedidos**:
- Cuánto material (prendas textiles, gorras, insumos de estampado) se ha utilizado en el **mes actual** (o cualquier mes seleccionado).
- Cuánto material se ha utilizado de forma **acumulada histórica**.
- Desglose por artículo, cantidad utilizada, costo valorizado consumido y pedidos/lotes asociados.

El usuario solicita explícitamente:
> *"Coordinator , En el Modulo 'Produccion : Inventario', en la barra horizontal, colocar una vista que presente el material de inventario usado, al mes, y acumulado . Procesar usando metodologia sdd. No mofificar nada adicional"*

---

## 2. Historias de Usuario
- **HU-01 (Sub-navegación Horizontal en Inventario):** Como jefe de taller, quiero disponer de una barra horizontal de sub-navegación dentro del módulo "Producción: Inventarios" que me permita alternar entre:
  1. `📦 Catálogo & Stock Actual` (la vista operativa actual).
  2. `📉 Material Usado / Consumo` (la nueva vista de consumo mensual y acumulado).
- **HU-02 (Resumen Métrico de Material Usado):** Como administrador, quiero ver en la parte superior tarjetas resumen de:
  - Total Unidades Usadas en el Mes seleccionado.
  - Valorización del Consumo del Mes ($).
  - Total Unidades Usadas Acumuladas Históricas.
  - Valorización Total Acumulada ($).
- **HU-03 (Selector y Filtro de Mes):** Como operador, quiero seleccionar el mes a consultar (`YYYY-MM`) mediante un selector temporal con botón de restablecimiento rápido, visualizando tanto el consumo de ese mes específico como la columna/métrica acumulada histórica.
- **HU-04 (Tabla Desglosada de Material Usado):** Como encargado de compras e inventario, quiero una tabla que liste cada artículo/insumo utilizado, mostrando:
  - Código y Nombre de la prenda/insumo.
  - Categoría.
  - Cantidad Usada en el Mes (`un.`).
  - Costo Consumido en el Mes (`$`).
  - Cantidad Usada Acumulada (`un.`).
  - Costo Consumido Acumulado (`$`).
  - Stock Actual disponible en bodega.
- **HU-05 (Preservación y No Modificar Nada Adicional):** Como sistema, los datos se deben calcular directamente a partir de los pedidos confirmados/en producción/entregados del taller (`novaprint_orders`), compras (`novaprint_purchases`) y catálogo (`novaprint_inventory`), sin alterar los registros existentes ni romper ninguna vista contable o comercial.

---

## 3. Requisitos del Sistema (Formato EARS)

### Requisitos Ubicuos (En todo momento)
- **EARS-U-01:** Dentro de `#view-inventory` DEBERÁ existir una barra horizontal de sub-navegación `#inv-subnav-container` con dos pestañas:
  - `#btn-inv-sub-stock`: `📦 Catálogo & Stock Actual`
  - `#btn-inv-sub-usage`: `📉 Material Usado / Consumo`
- **EARS-U-02:** La sub-vista de Material Usado `#inv-subview-usage` DEBERÁ sincronizarse reactivamente al cargar la aplicación y al actualizarse pedidos o inventario.

### Requisitos Conducidos por Eventos (When / Cuando)
- **EARS-E-01 (Alternar Sub-vista):** CUANDO el usuario haga clic en `#btn-inv-sub-usage`, el sistema DEBERÁ invocar `NovaprintUI.cambiarSubVistaInventario('usage')`, ocultando la tabla de stock actual y mostrando `#inv-subview-usage` con las métricas y tabla de consumo.
- **EARS-E-02 (Cálculo Determinístico de Consumo):** CUANDO se renderice la sub-vista de material usado, el sistema DEBERÁ ejecutar `NovaprintProduction.calcularConsumoMateriales(pedidos, inventario, mesSeleccionado)`:
  - Considerará los pedidos activos del taller (estados distintos a `'Cancelado'`).
  - Extraerá la fecha del pedido (`dates.deliveryDate || dates.createdAt || date`).
  - Para cada ítem del pedido, cruzará con el inventario correspondiente (`garmentType`, `color`, `size` o insumo estampado).
  - Acumulará las cantidades e importes valorizados (`cantidad * costoUnitario`) para el mes consultado y para el total acumulado histórico.
- **EARS-E-03 (Filtro por Mes):** CUANDO el usuario modifique el selector de mes `#inv-usage-filter-month`, el sistema DEBERÁ filtrar inmediatamente los consumos mensuales correspondientes al mes seleccionado (`YYYY-MM`), manteniendo visible el acumulado histórico total.

---

## 4. Criterios de Aceptación
1. La barra horizontal de `#view-inventory` incluye los botones `📦 Catálogo & Stock Actual` y `📉 Material Usado / Consumo`.
2. La sub-vista de Material Usado muestra las métricas de unidades y montos del mes actual y del acumulado total.
3. La tabla detalla cada material usado con sus unidades y valorización en el mes y acumulado.
4. El selector de mes permite consultar meses anteriores manteniendo el acumulado histórico.
5. El 100% de las 30 suites de pruebas unitarias existentes siguen pasando sin regresiones, más una nueva suite para verificar los cálculos y la interfaz de material usado.

