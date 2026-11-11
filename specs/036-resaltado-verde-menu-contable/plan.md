# Plan Técnico — Spec 036: Resaltado con Recuadro Verde del Menú Horizontal de Contabilidad

## 1. Diagnóstico y Enfoque de Diseño

### Ubicación en `index.html` (Línea 652):
Actualmente:
```html
<!-- Barra de Sub-Navegación Contable -->
<div class="bg-white p-2 rounded-xl border border-gray-200 shadow-xs flex flex-wrap gap-2 items-center">
  <button id="btn-acc-sub-balance" ...>...</button>
  <button id="btn-acc-sub-pnl" ...>...</button>
  <button id="btn-acc-sub-journal" ...>...</button>
  <button id="btn-acc-sub-chart" ...>...</button>
</div>
```

### Propuesta de Resaltado Visual:
Modificar el contenedor para resaltar con un recuadro verde claro y visible:
- **ID:** `id="acc-subnav-container"` para identificación semántica y pruebas.
- **Clases Tailwind:**
  `class="bg-emerald-50/50 p-2.5 rounded-xl border-2 border-emerald-500 shadow-sm flex flex-wrap gap-2 items-center"`
  - `border-2 border-emerald-500`: Recuadro con borde verde sólido de 2px de grosor de alta visibilidad.
  - `bg-emerald-50/50`: Fondo con ligero tinte esmeralda/verde para cohesionar el recuadro sin saturar la vista.
  - `p-2.5 rounded-xl shadow-sm`: Margen interno y esquinas redondeadas consistentes con el diseño de la app.

---

## 2. Archivos Modificados
- `index.html`: Aplicar las clases y el ID al contenedor de la barra de sub-navegación contable.

---

## 3. Plan de Pruebas Automatizadas
- Crear `tests/accounting_subnav_highlight.test.js` que verifique:
  1. Presencia del contenedor de sub-navegación contable con borde y estilos verdes (`border-emerald-500` o `border-green`, `border-2`).
  2. Presencia inalterada de los 4 botones de navegación contable con sus IDs exactos.
  3. Ejecutar suite general de 28 suites asegurando 0 regresiones.

