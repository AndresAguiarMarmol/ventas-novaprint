# Tareas de Implementación — Spec 007: Tallas Infantiles en Pedidos e Inventario

- [x] **Tarea 1: Constantes de Tallas en `assets/js/sales.js`**
  - Definir `TALLAS_TEXTILES` y `TALLAS_GRUPOS` con los rangos infantiles (4, 6, 8, 10, 12, 14, 16, 18) y adultos (XS, S, M, L, XL, XXL, Única).
  - Exportar ambas constantes en `NovaprintSales`.
  - *Criterio de verificación:* Pruebas unitarias de definición en `sales.test.js`.

- [x] **Tarea 2: Función `generarOpcionesTalla` e integración en `assets/js/ui.js`**
  - Implementar `generarOpcionesTalla(tallaActual)` con soporte de `<optgroup>` semántico y fallback para tallas no estándar.
  - Reemplazar el HTML estático de opciones de talla en `renderizarTablaItemsPedido` por `${generarOpcionesTalla(it.size)}`.
  - Exportar `generarOpcionesTalla` en `NovaprintUI`.
  - *Criterio de verificación:* El HTML del select contiene los optgroups y preselecciona la talla del ítem.

- [x] **Tarea 3: Datalist de sugerencias en `index.html`**
  - Añadir `<datalist id="inventory-size-datalist">` con las tallas infantiles y adultas.
  - Vincular `list="inventory-size-datalist"` en `#inventory-size-input`.
  - *Criterio de verificación:* En el formulario de inventario el campo de talla muestra las sugerencias del datalist.

- [x] **Tarea 4: Pruebas unitarias e integración**
  - Agregar pruebas en `tests/sales.test.js` y `tests/production.test.js` para validar el catálogo de tallas infantiles, cálculo de precios, cotizaciones y cruce de stock.
  - Ejecutar `node --test tests/*.test.js` y constatar 100% de pruebas pasando en verde (87/87 pruebas superadas).
  - *Criterio de verificación:* 0 fallos en tests.

- [x] **Tarea 5: Actualización de Memoria del Proyecto (`memory.md`)**
  - Actualizar Sección 2 y Sección 3 de `memory.md` según protocolo `AGENTS.md`.
