# Especificación Técnica — Spec 045: Calibración y Longitud del Campo P. Unitario a 7 Caracteres en Pedidos

## 1. Contexto y Propósito
En el formulario modal de pedidos (`#dialog-order`), la tabla "Detalle de Prendas & Técnicas" contiene la columna "P. Unit" (Precio Unitario). Previamente, el input utilizaba un ancho genérico `w-24` (96px) sin restricción superior explícita, ocupando más espacio horizontal del necesario.
El propósito de esta especificación es calibrar la longitud y el ancho visual del campo **P. Unitario** a **7 caracteres** (adecuado para precios de prendas y estampados de hasta $9.999.999 CLP):
- **Ancho visual:** `w-20` (80px), optimizado para mostrar 7 dígitos con padding horizontal compacto `px-2 py-1` y alineación a la derecha `text-right`.
- **Restricción de entrada:** Atributo `max="9999999"` y validación en `actualizarItemProp(itemId, 'unitPrice', value)` limitando a valores en el rango de `$0` a `$9.999.999`.
- **Alineación de cabecera:** Cabecera `<th class="py-2 px-1 text-right w-20">P. Unit</th>` en `index.html` sincronizada con la celda de datos.

---

## 2. Historias de Usuario

### HU-01: Visualización Compacta del Precio Unitario
**Como** vendedor o usuario que ingresa cotizaciones en el taller,  
**Quiero** que el campo de Precio Unitario tenga un ancho exacto de 7 caracteres,  
**Para** optimizar el espacio horizontal de la tabla y visualizar claramente precios típicos de hasta 7 dígitos sin desperdicio visual.

### HU-02: Control de Rango en Precio Unitario
**Como** administrador del sistema,  
**Quiero** que el campo no permita ingresar importes mayores a 7 cifras ($9.999.999),  
**Para** prevenir errores tipográficos graves en los precios unitarios de las prendas.

---

## 3. Requisitos Funcionales (Formato EARS)

### Ubiquitous (Siempre activo)
- **RF-01:** En `index.html`, la cabecera de Precio Unitario DEBE definirse como `<th class="py-2 px-1 text-right w-20">P. Unit</th>`.
- **RF-02:** En `renderTablaItemsFormulario()` de `assets/js/ui.js`, el `<input id="input-price-${it.id}">` DEBE tener clases de estilo `w-20 px-2 py-1 border border-gray-300 rounded text-right font-medium focus:bg-white text-xs`.
- **RF-03:** El input DEBE incorporar el atributo `max="9999999"` y `min="0"`.
- **RF-04:** En `actualizarItemProp(itemId, 'unitPrice', value)`, el valor numérico DEBE limitarse al rango `Math.min(9999999, Math.max(0, parsed))`.

---

## 4. Reglas de Negocio
- **RN-01 (Inmutabilidad Financiera):** Los precios sugeridos automáticos (`calcularPrecioSugeridoPrenda`) y cálculos de subtotales se mantienen idénticos.
- **RN-02 (Retrocompatibilidad):** Pedidos preexistentes con precios vigentes se visualizan y editan sin alteración.

---

## 5. Criterios de Aceptación
1. `index.html` contiene `<th class="py-2 px-1 text-right w-20">P. Unit</th>`.
2. `renderTablaItemsFormulario()` renderiza el input con clase `w-20` y atributo `max="9999999"`.
3. `actualizarItemProp` limita importes ingresados a un máximo de 9999999 y mínimo de 0.
4. El 100% de las pruebas automatizadas (36+ suites) pasan sin fallos ni regresiones.
