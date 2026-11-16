# Especificación Técnica — Spec 044: Fusión Vertical de "Cód. Inventario" y "Artículo/Detalle" en Detalle de Prendas

## 1. Contexto y Propósito
En el formulario modal de pedidos (`#dialog-order`), la tabla "Detalle de Prendas & Técnicas" contenía columnas separadas para `Cód. Inventario` y `Prenda`. Esta división ocupaba demasiado ancho horizontal y dispersaba la información física del artículo.
El propósito de esta especificación es reestructurar la primera columna de la tabla fusionando verticalmente ambos campos:
- **Cabecera unificada:** `Cód. Inventario / Artículo` con ancho flexible `min-w-[160px]`.
- **Fila superior de la celda:** Selector de `Cód. Inventario` (`generarOpcionesCodigoInventario`) en ancho completo de la celda.
- **Fila inferior de la celda (bajo el código):** Selector de `Artículo/Detalle` (`garmentType`: Polera, Polerón, Buzo, Gorra, Otro) agrupado horizontalmente con la insignia de stock de bodega (`badge-stock-${it.id}`).
- **Beneficio visual y operativo:** Se elimina una columna completa en la tabla (de 10 columnas a 9 columnas), otorgando mayor holgura y legibilidad a las columnas de Color, Talla, Técnica, Estampado, Cantidad y Precios en cualquier tamaño de pantalla.

---

## 2. Historias de Usuario

### HU-01: Visualización Consolidada del Artículo y su Código de Bodega
**Como** vendedor o usuario que ingresa pedidos,  
**Quiero** visualizar en un mismo bloque vertical el código de inventario y el tipo de artículo con su stock,  
**Para** asociar de inmediato el código físico con la prenda que estoy seleccionando sin tener que buscar en columnas distantes.

### HU-02: Mayor Holgura Horizontal en la Pantalla de Pedido
**Como** usuario del sistema en computadores portátiles o pantallas estándar,  
**Quiero** que la tabla de detalle de prendas tenga menos columnas horizontales dispersas,  
**Para** ver todo el contenido sin barras de desplazamiento horizontal forzadas y con lectura confortable de precios y técnicas.

---

## 3. Requisitos Funcionales (Formato EARS)

### Ubiquitous (Siempre activo)
- **RF-01:** La tabla `#order-items-table` de `#dialog-order` en `index.html` DEBE presentar la cabecera unificada `<th class="py-2 px-1 min-w-[160px]">Cód. Inventario / Artículo</th>` sustituyendo a las dos cabeceras anteriores `Cód. Inventario` y `Prenda`.
- **RF-02:** En `renderTablaItemsFormulario()` de `assets/js/ui.js`, la primera celda `<td>` DEBE contener un contenedor apilado (`space-y-1`) donde la primera línea es el selector de código de inventario (`onchange="...actualizarItemProp(..., 'inventoryCode', ...)"`).
- **RF-03:** En la misma celda, la segunda línea DEBE contener el selector de tipo de prenda (`garmentType`) junto a la insignia de disponibilidad de bodega (`#badge-stock-${it.id}`).
- **RF-04:** La sincronización bidireccional entre código de inventario y prenda/color/talla implementada en la Spec 042 DEBE mantenerse 100% operativa y reactiva.

---

## 4. Reglas de Negocio
- **RN-01 (Inmutabilidad Comercial):** La reestructuración es visual en el formulario de pedidos; no se altera la estructura interna de los pedidos (`novaprint_orders`), ni el cálculo financiero, ni la deducción de existencias en producción.
- **RN-02 (Persistencia y Trazabilidad):** Los atributos `inventoryCode`, `inventoryItemId` y `garmentType` se persisten fidedignamente al guardar el pedido.

---

## 5. Criterios de Aceptación
1. En `index.html`, la tabla de pedidos tiene la cabecera `Cód. Inventario / Artículo` con clase `min-w-[160px]`.
2. En `assets/js/ui.js`, `renderTablaItemsFormulario` renderiza el selector de código arriba y el selector de prenda con el badge de stock abajo en la misma celda `<td>`.
3. Al seleccionar un código, se auto-completan la prenda, color y talla de forma inmediata.
4. Al seleccionar una prenda manualmente, se mantiene la búsqueda inversa y auto-selección de código si existe en bodega.
5. El 100% de las pruebas automatizadas (35+ suites) pasan sin fallos ni regresiones.
